const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/auth",
    createProxyMiddleware({
      target: process.env.KEYCLOAK_SERVER_URL || "http://localhost:9001",
      changeOrigin: true,
      logLevel: process.env.DEBUG ? "debug" : "info",
      onProxyReq: (proxyReq, req, res) => {
        // Keycloak needs these header set so we can function in Kubernetes (non-OpenShift)
        // https://www.keycloak.org/server/reverseproxy
        //
        // Note, on OpenShift, this works as the haproxy implementation
        // for the OpenShift route is setting these for us automatically
        //
        // We saw problems with including the below broke the OpenShift route
        //  {"X-Forwarded-Proto", req.protocol} broke the OpenShift
        //  {"X-Forwarded-Port", req.socket.localPort}
        //  {"Forwarded", `for=${req.socket.remoteAddress};proto=${req.protocol};host=${req.headers.host}`}
        // so we are not including even though they are customary
        //
        proxyReq.setHeader("X-Forwarded-For", req.socket.remoteAddress);
        proxyReq.setHeader("X-Real-IP", req.socket.remoteAddress);
        proxyReq.setHeader("X-Forwarded-Host", req.headers.host);
      },
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
      onProxyReq: (proxyReq, req, res) => {
        if (req.originalUrl.includes("windup/report/?filter")) {
          proxyReq.setHeader("Accept", "");
        }
        if (req.cookies.keycloak_cookie && !req.headers["authorization"]) {
          proxyReq.setHeader(
            "Authorization",
            `Bearer ${req.cookies.keycloak_cookie}`
          );
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        const includesJsonHeaders =
          req.headers.accept?.includes("application/json");
        if (
          (!includesJsonHeaders && proxyRes.statusCode === 401) ||
          (!includesJsonHeaders && proxyRes.statusMessage === "Unauthorized")
        ) {
          res.redirect("/");
        }
      },
    })
  );
};
