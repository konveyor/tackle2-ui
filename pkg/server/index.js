const express = require("express");
const path = require("path");
const app = express(),
  bodyParser = require("body-parser");
const { createProxyMiddleware } = require("http-proxy-middleware");

const port = 8080;

app.use(
  "/auth",
  createProxyMiddleware({
    target: process.env.SSO_SERVER_URL || "http://localhost:9001",
    changeOrigin: true,
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

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../client/dist")));

// Handles any requests that don't match the ones above
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on port::${port}`);
});
