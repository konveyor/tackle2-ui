const { createProxyMiddleware } = require("http-proxy-middleware");
function relayRequestHeaders(proxyReq, req) {
  if (req.cookies.keycloak_cookie) {
    proxyReq.setHeader(
      "Authorization",
      `Bearer ${req.cookies.keycloak_cookie}`
    );
  }
}

module.exports = function (app) {
  app.use(
    "/auth",
    createProxyMiddleware({
      target: process.env.KEYCLOAK_SERVER_URL || "http://localhost:9001",
      changeOrigin: true,
      logLevel: process.env.DEBUG ? "debug" : "info",
    })
  );
  app.use(
    "/hub",
    createProxyMiddleware({
      target: process.env.TACKLE_HUB_URL || "http://localhost:9002",
      changeOrigin: true,
      pathRewrite: {
        "^/hub": "",
      },
      logLevel: process.env.DEBUG ? "debug" : "info",
      onProxyReq: relayRequestHeaders,
    })
  );
};
