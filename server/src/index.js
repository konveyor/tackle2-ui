import path from "node:path";
import { fileURLToPath } from "node:url";

import * as ejs from "ejs";
import { default as express } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createHttpTerminator } from "http-terminator";

import {
  KONVEYOR_ENV,
  SERVER_ENV_KEYS,
  brandingStrings,
  encodeEnv,
} from "@konveyor-ui/common";

import proxies from "./proxies";

const developmentMode = KONVEYOR_ENV.NODE_ENV === "development";
const debugMode = process.env.DEBUG === "1";
debugMode && console.log("KONVEYOR_ENV", KONVEYOR_ENV);

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const pathToClientDist = path.join(__dirname, "../../client/dist");

const port = parseInt(KONVEYOR_ENV.PORT, 10) || developmentMode ? 9000 : 8080;

const app = express();
app.set("x-powered-by", false);

// Setup proxies for auth and hub
app.use(createProxyMiddleware(proxies.auth));
app.use(createProxyMiddleware(proxies.hub));
app.use(createProxyMiddleware(proxies.kai));

// In development, proxy to the dev server, otherwise serve the client/dist content
if (developmentMode) {
  console.log("** development mode - proxying to webpack-dev-server **");
  app.use(createProxyMiddleware(proxies.devServer));
} else {
  app.engine("ejs", ejs.renderFile);
  app.use(express.json());
  app.set("views", pathToClientDist);
  app.use(express.static(pathToClientDist));

  app.get("*splat", (_, res) => {
    res.render("index.html.ejs", {
      _env: encodeEnv(KONVEYOR_ENV, SERVER_ENV_KEYS),
      branding: brandingStrings,
    });
  });
}

// Start the server
const server = app.listen(port, (error) => {
  if (error) {
    throw error; // e.g. EADDRINUSE
  }
  console.log(`Server listening on port::${port}`);
});

// Handle shutdown signals Ctrl-C (SIGINT) and default podman/docker stop (SIGTERM)
const httpTerminator = createHttpTerminator({ server });

const shutdown = async (signal) => {
  if (!server) {
    console.log(`${signal}, no server running.`);
    return;
  }

  console.log(`${signal} - Stopping server on port::${port}`);
  await httpTerminator.terminate();
  console.log(`${signal} - Stopped server on port::${port}`);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
