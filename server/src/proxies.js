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
 * the token is part of the request as a cookie
 *
 * TODO: Verify this is still relevant when authorization is turned on.  The query
 *       handling libraries probably already take care of this.  The cookie may
 *       not be set.
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
 * TODO: Verify that if auth doesn't exist or expires that the user is redirect
 *       back to the app to login.  This handler may not be necessary with the
 *       current query handling libraries.  The idea would be to make sure if an
 *       auth token expires on a data fetch, the app pushes the user back to
 *       the login page.
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
};
