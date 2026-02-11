// Locket Gold Premium - Phien ban nang cao
// Phien ban: 1.7 (2026-02-10)
// Tac gia: DucToanDev

(function () {
  "use strict";

  // Cac hang so
  const PURCHASE_DATE = "2026-02-10T00:00:00Z"; // Ngay mua
  const EXPIRES_DATE = "2099-12-31T23:59:59Z"; // Ngay het han 
  const PRODUCT_ID = "locket.premium.yearly"; // Ma san pham

  // Cau hinh anh xa ung dung
  const APP_MAPPING = {
    "%E8%BD%A6%E7%A5%A8%E7%A5%A8": ["vip+watch_vip"],
    Locket: ["Gold"],
  };

  // Lay User-Agent tu headers
  const headers = $request.headers;
  const ua = headers["User-Agent"] || headers["user-agent"] || "";

  // Phan tich body phan hoi
  let responseObj;
  try {
    responseObj = JSON.parse($response.body);

    // Dam bao cau truc ton tai
    if (!responseObj.subscriber) {
      responseObj.subscriber = {};
    }
    if (!responseObj.subscriber.subscriptions) {
      responseObj.subscriber.subscriptions = {};
    }
    if (!responseObj.subscriber.entitlements) {
      responseObj.subscriber.entitlements = {};
    }
  } catch (error) {
    // Khoi phuc loi voi cau truc day du
    responseObj = {
      subscriber: {
        subscriptions: {},
        entitlements: {},
        original_app_user_id: "",
        original_application_version: "",
      },
    };
  }

  // Du lieu dang ky Premium
  const subscriptionData = {
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
  };

  // Du lieu quyen loi
  const entitlementData = {
    grace_period_expires_date: null,
    purchase_date: PURCHASE_DATE,
    product_identifier: PRODUCT_ID,
    expires_date: EXPIRES_DATE,
  };

  // Ap dung anh xa
  let entitlementKey = "Gold"; // Mac dinh

  // Tim kiem anh xa nhanh
  for (const key in APP_MAPPING) {
    if (ua.indexOf(key) !== -1) {
      entitlementKey = APP_MAPPING[key][0];
      break;
    }
  }

  // Ap dung du lieu premium
  responseObj.subscriber.subscriptions[PRODUCT_ID] = subscriptionData;
  responseObj.subscriber.entitlements[entitlementKey] = entitlementData;

  // Tra ve phan hoi
  $done({ body: JSON.stringify(responseObj) });
})();