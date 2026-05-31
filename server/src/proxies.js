/** @import { Logger, Options, OnProxyEvent } from "http-proxy-middleware/dist/types.js" */
import * as cookie from "cookie";

import { KONVEYOR_ENV } from "@konveyor-ui/common";

/** @type Logger */
const logger =
  process.env.DEBUG === "1"
    ? console
    : {
        info() {},
        warn: console.warn,
        error: console.error,
      };

/**
 * Add the Bearer token to the request if it is not already present, AND if
 * the token is part of the request as a cookie.
 *
 * Note: With Hub OIDC + react-oidc-context, tokens are stored in sessionStorage
 * and injected into requests by Axios interceptors (initAuthInterceptors). The
 * keycloak_cookie mechanism is a Keycloak-specific legacy retained for backward
 * compatibility with deployments still using the /auth (Keycloak) proxy path.
 *
 * @type OnProxyEvent["proxyReq"]
 */
const addBearerTokenIfNeeded = (proxyReq, req, _res) => {
  const cookies = cookie.parse(req.headers.cookie ?? "");
  const bearerToken = cookies.keycloak_cookie;
  if (bearerToken && !req.headers["authorization"]) {
    proxyReq.setHeader("Authorization", `Bearer ${bearerToken}`);
  }
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
 * Set the RFC 7239 `Forwarded` header and the legacy `X-Forwarded-*` headers
 * on the proxied request, but only when an upstream proxy has not already set
 * them.  This covers three deployment scenarios:
 *
 *  1. Dev (direct access) — no upstream proxy; no forwarded headers on the
 *     incoming request.  We set them all so Hub sees the correct client context.
 *
 *  2. Vanilla K8s (e.g. minikube + ingress-nginx) — the ingress controller sets
 *     X-Forwarded-For/Proto/Host before the request reaches the pod.  We
 *     preserve those values and derive the RFC 7239 Forwarded header from them.
 *
 *  3. OpenShift — HAProxy at the edge sets X-Forwarded-For/Host and also
 *     injects a Forwarded header.  We do not overwrite any of them (the same
 *     Forwarded header that broke Keycloak on OpenShift when set by the auth
 *     proxy is already correctly present).
 *
 * Notes:
 * - IPv6 addresses in the Forwarded `for=` token are bracketed and quoted per
 *   RFC 7239 §6.
 * - `req.socket.encrypted` is used instead of `req.protocol` for the protocol
 *   fallback, because `req.protocol` in Express reflects the internal pod
 *   connection (always `http` inside Kubernetes), not the external protocol.
 *
 * @type OnProxyEvent["proxyReq"]
 */
const setForwardedHeader = (proxyReq, req, _res) => {
  // --- X-Forwarded-* (legacy, set only if absent) ---
  if (!req.headers["x-forwarded-for"] && req.socket.remoteAddress) {
    proxyReq.setHeader("X-Forwarded-For", req.socket.remoteAddress);
  }

  if (!req.headers["x-real-ip"] && req.socket.remoteAddress) {
    proxyReq.setHeader("X-Real-IP", req.socket.remoteAddress);
  }

  if (!req.headers["x-forwarded-host"] && req.headers.host) {
    proxyReq.setHeader("X-Forwarded-Host", req.headers.host);
  }

  if (!req.headers["x-forwarded-proto"]) {
    proxyReq.setHeader(
      "X-Forwarded-Proto",
      req.socket.encrypted ? "https" : "http"
    );
  }

  // --- RFC 7239 Forwarded (set only if absent) ---
  if (!req.headers["forwarded"]) {
    const parts = [];

    if (req.socket.remoteAddress) {
      const ip = req.socket.remoteAddress;
      // IPv6 addresses must be bracketed and quoted per RFC 7239 §6
      const forValue = ip.includes(":") ? `"[${ip}]"` : ip;
      parts.push(`for=${forValue}`);
    }

    if (req.headers.host) {
      parts.push(`host="${req.headers.host}"`);
    }

    // Use x-forwarded-proto when already present (set by upstream or by us
    // above); fall back to the socket's encryption state.
    const proto =
      String(req.headers["x-forwarded-proto"] ?? "")
        .split(",")[0]
        .trim() || (req.socket.encrypted ? "https" : "http");
    parts.push(`proto=${proto}`);

    proxyReq.setHeader("Forwarded", parts.join(";"));
  }
};

/** @type Record<string, Options> */
export default {
  devServer: {
    pathFilter: "/",
    target: "http://localhost:9003",
    logger,
  },

  auth: {
    pathFilter: "/auth",
    target: KONVEYOR_ENV.KEYCLOAK_SERVER_URL || "http://localhost:9001",
    logger,

    changeOrigin: true,

    on: {
      proxyReq(proxyReq, req, _res) {
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
        req.socket.remoteAddress &&
          proxyReq.setHeader("X-Forwarded-For", req.socket.remoteAddress);
        req.socket.remoteAddress &&
          proxyReq.setHeader("X-Real-IP", req.socket.remoteAddress);
        req.headers.host &&
          proxyReq.setHeader("X-Forwarded-Host", req.headers.host);
      },
    },
  },

  oidc: {
    pathFilter: "/oidc",
    target: KONVEYOR_ENV.TACKLE_HUB_URL || "http://localhost:9002",
    logger,

    changeOrigin: true,

    on: {
      proxyReq: setForwardedHeader,
    },
  },

  hub: {
    pathFilter: "/hub",
    target: KONVEYOR_ENV.TACKLE_HUB_URL || "http://localhost:9002",
    logger,

    changeOrigin: true,
    pathRewrite: {
      "^/hub": "",
    },

    on: {
      proxyReq: addBearerTokenIfNeeded,
      proxyRes: redirectIfUnauthorized,
    },
  },

  kai: {
    pathFilter: "/kai",
    target: KONVEYOR_ENV.TACKLE_HUB_URL || "http://localhost:9002",
    logger,

    changeOrigin: true,
    pathRewrite: {
      "^/kai": "/services/kai",
    },

    on: {
      proxyReq: addBearerTokenIfNeeded,
      proxyRes: redirectIfUnauthorized,
    },
  },

  kaiLLMProxy: {
    pathFilter: "/llm-proxy",
    target: KONVEYOR_ENV.KAI_LLM_PROXY_URL || "http://localhost:9004",
    logger,

    changeOrigin: true,
    pathRewrite: {
      "^/llm-proxy": "",
    },

    on: {
      proxyReq: addBearerTokenIfNeeded,
    },
  },
};
