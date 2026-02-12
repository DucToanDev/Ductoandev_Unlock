# Rudo Watch Backend

Backend để nhận và lưu trữ logs từ RevenueCat script.

## Cài đặt local

```bash
cd backend
npm install
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## Deploy lên Render.com

1. Tạo tài khoản tại [render.com](https://render.com)
2. Tạo **New Web Service**
3. Kết nối GitHub repo hoặc upload code
4. Cấu hình:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Deploy

## API Endpoints

### POST /logs
Nhận log từ client

**Body:**
```json
{
  "app": "Locket",
  "token": "user_token",
  "device": "device_id",
  "ip": "optional"
}
```

### GET /logs?key=ductoandev_secret_2026
Xem tất cả logs (cần secret key)

### DELETE /logs?key=ductoandev_secret_2026
Xóa tất cả logs (cần secret key)

### GET /
Health check

## Bảo mật

Thay đổi `ductoandev_secret_2026` trong `server.js` thành secret key của bạn.

## File Logs

Logs được lưu trong `logs.json` cùng thư mục với server.
