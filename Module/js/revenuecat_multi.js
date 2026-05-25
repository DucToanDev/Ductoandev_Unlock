// RevenueCat Mở Khóa Premium Đa Ứng Dụng
// Hỗ trợ: Locket, VSCO, Mojo, HTTPBot, 1Blocker, Structured, Splice, Facetune
// Phiên bản: 2.4
// Tác giả: DucToanDev

(function () {
  "use strict";

  // --- CÁC HẰNG SỐ ---
  const PURCHASE_DATE = "2026-02-10T00:00:00Z";
  const EXPIRES_DATE = "2099-12-31T23:59:59Z";

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

  $done({ body: JSON.stringify(responseObj) });
})();