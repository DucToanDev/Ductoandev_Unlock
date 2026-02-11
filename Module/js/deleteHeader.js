// ========================================
// Xóa Header ETag của RevenueCat - Phiên bản nâng cao
// ⚡ Hiệu suất: Cực nhanh
// 🔐 Xóa các header cache cho ứng dụng RevenueCat
// 👤 Tác giả: DucToanDev
// ========================================

(function () {
  'use strict';

  // Lấy headers của request 
  const headers = $request.headers;

  // Xóa các header ETag 
  delete headers["X-RevenueCat-ETag"];
  delete headers["x-revenuecat-etag"];
  delete headers["X-REVENUECAT-ETAG"];

  // Xóa thêm If-None-Match 
  delete headers["If-None-Match"];
  delete headers["if-none-match"];

  // Trả về headers đã chỉnh sửa 
  $done({ headers: headers });

})();