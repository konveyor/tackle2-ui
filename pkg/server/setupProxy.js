const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/auth",
    createProxyMiddleware({
      target: process.env.SSO_SERVER_URL || "http://localhost:9001",
      changeOrigin: true,
      logLevel: process.env.DEBUG ? "debug" : "info",
    })
  );

  app.use(
    "/api/pathfinder",
    createProxyMiddleware({
      target: process.env.PATHFINDER_API_URL || "http://localhost:9003",
      changeOrigin: true,
      pathRewrite: {
        "^/api/pathfinder": "/pathfinder",
      },
      logLevel: process.env.DEBUG ? "debug" : "info",
    })
  );

  app.use(
    "/api",
    createProxyMiddleware({
      target:
        process.env.APPLICATION_INVENTORY_API_URL || "http://localhost:9002",
      changeOrigin: true,
      pathRewrite: {
        "^/api": "",
      },
      logLevel: process.env.DEBUG ? "debug" : "info",
    })
  );
};
