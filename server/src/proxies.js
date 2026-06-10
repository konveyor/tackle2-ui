/** @import { Logger, Options, OnProxyEvent } from "http-proxy-middleware/dist/types.js" */

import { serverConfig } from "./serverConfig.js";

/** @type Logger */
const logger = serverConfig.DEBUG
  ? console
  : {
      info() {},
      warn: console.warn,
      error: console.error,
    };

/**
 * Server-side safety net: redirect the browser back to "/" if a non-JSON
 * request receives a 401/Unauthorized response from the hub.
 *
 * Note: With Hub OIDC + react-oidc-context, client-side session management
 * handles token expiry and re-authentication automatically. This handler
 * remains as a fallback for non-AJAX requests (e.g. direct browser navigation
 * to /hub/...) that would otherwise display a bare 401 response.
 *
 * @type OnProxyEvent["proxyRes"]
 */
const redirectIfUnauthorized = (proxyRes, req, res) => {
  if (
    !req.headers.accept?.includes("application/json") &&
    (proxyRes.statusCode === 401 || proxyRes.statusMessage === "Unauthorized")
  ) {
    res.writeHead(302, { Location: "/" }).end();
    proxyRes?.destroy();
  }
};

/**
 * Set the RFC 7239 `Forwarded` header on the proxied request, but only when an
 * upstream proxy has not already set one.  This covers three deployment
 * scenarios:
 *
 *  1. Dev (direct access) — no upstream proxy; no forwarded headers arrive.
 *     We derive `for`, `host`, and `proto` from the socket/request directly.
 *
 *  2. Vanilla K8s (e.g. minikube + ingress-nginx) — the ingress controller
 *     sets `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Host`
 *     before the request reaches the pod, but does not set `Forwarded`.  We
 *     synthesize the RFC 7239 header from those legacy values so Hub gets a
 *     standard header that reflects the real client context.
 *
 *  3. OpenShift — HAProxy at the edge injects a `Forwarded` header itself.
 *     We leave it untouched (this avoids the duplicate-header problem that
 *     previously broke Keycloak on OpenShift).
 *
 * Notes:
 * - IPv6 addresses in the `for=` token are bracketed and quoted per
 *   RFC 7239 §6.
 * - `req.socket.encrypted` is used instead of `req.protocol` for the protocol
 *   fallback, because `req.protocol` in Express reflects the internal pod
 *   connection (always `http` inside Kubernetes), not the external protocol.
 *
 * @type OnProxyEvent["proxyReq"]
 */
const setForwardedHeader = (proxyReq, req, _res) => {
  if (req.headers["forwarded"]) return;

  const parts = [];

  const clientIp =
    String(req.headers["x-forwarded-for"] ?? "")
      .split(",")[0]
      .trim() || req.socket.remoteAddress;
  if (clientIp) {
    const forValue = clientIp.includes(":") ? `"[${clientIp}]"` : clientIp;
    parts.push(`for=${forValue}`);
  }

  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  if (host) {
    parts.push(`host="${host}"`);
  }

  const proto =
    String(req.headers["x-forwarded-proto"] ?? "")
      .split(",")[0]
      .trim() || (req.socket.encrypted ? "https" : "http");
  parts.push(`proto=${proto}`);

  proxyReq.setHeader("Forwarded", parts.join(";"));
};

/** @type Record<string, Options> */
export default {
  devServer: {
    pathFilter: "/",
    target: "http://localhost:9001",
    logger,
  },

  oidc: {
    pathFilter: "/oidc",
    target: serverConfig.TACKLE_HUB_URL || "http://localhost:9002",
    logger,

    changeOrigin: true,

    on: {
      proxyReq: setForwardedHeader,
    },
  },

  hub: {
    pathFilter: "/hub",
    target: serverConfig.TACKLE_HUB_URL || "http://localhost:9002",
    logger,

    changeOrigin: true,
    pathRewrite: {
      "^/hub": "",
    },

    on: {
      proxyReq: setForwardedHeader,
      proxyRes: redirectIfUnauthorized,
    },
  },

  kai: {
    pathFilter: "/kai",
    target: serverConfig.TACKLE_HUB_URL || "http://localhost:9002",
    logger,

    changeOrigin: true,
    pathRewrite: {
      "^/kai": "/services/kai",
    },

    on: {
      proxyReq: setForwardedHeader,
      proxyRes: redirectIfUnauthorized,
    },
  },

  kaiLLMProxy: {
    pathFilter: "/llm-proxy",
    target: serverConfig.KAI_LLM_PROXY_URL || "http://localhost:9003",
    logger,

    changeOrigin: true,
    pathRewrite: {
      "^/llm-proxy": "",
    },

    on: {},
  },
};
