const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Đường dẫn file log
const LOG_FILE = path.join(__dirname, 'logs.json');

// Khởi tạo file log nếu chưa có
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
}

// Hàm đọc logs
const readLogs = () => {
  try {
    const data = fs.readFileSync(LOG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Hàm ghi logs
const writeLogs = (logs) => {
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
};

// API endpoint nhận log
app.post('/logs', (req, res) => {
  try {
    const { app: appName, token, device, ip } = req.body;
    
    // Lấy IP thực từ request
    const realIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.ip;

    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      app: appName || 'Unknown',
      token: token || null,
      device: device || null,
      ip: realIP,
      userAgent: req.headers['user-agent'] || null
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Logs endpoint: POST /logs`);
  console.log(`View logs: GET /logs?key=ductoandev_secret_2026`);
});
