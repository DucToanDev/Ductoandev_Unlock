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

// Start server
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Logs endpoint: POST /logs`);
  console.log(`View logs: GET /logs?key=ductoandev_secret_2026`);
});
