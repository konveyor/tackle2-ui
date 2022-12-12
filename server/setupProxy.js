const { createProxyMiddleware } = require("http-proxy-middleware");

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
      onProxyReq: (proxyReq, req, res) => {
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
