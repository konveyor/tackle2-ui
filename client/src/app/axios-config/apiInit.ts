/**
 * axios-config/apiInit.ts
 *
 * Centralised Axios interceptors for the Tackle UI.
 *
 * Request interceptor: attaches the current OIDC access token as a Bearer header.
 * Response interceptor: on 401, attempts a silent token refresh via the OIDC
 * UserManager; retries the request with the new token; redirects to login on failure.
 *
 * When AUTH_REQUIRED is false no token is available, so the Authorization header
 * is simply omitted and 401 responses are passed through unchanged.
 */

import axios from "axios";

import { isAuthRequired } from "@app/Constants";
import { userManager } from "@app/auth/userManager";

// Guard against duplicate interceptor registration (e.g. React StrictMode double-invoke).
let _initialized = false;

export const initInterceptors = () => {
  if (_initialized) return;
  _initialized = true;

  // ── Request: attach Bearer token ──────────────────────────────────────────
  axios.interceptors.request.use(
    async (config) => {
      if (!isAuthRequired) return config;

      const user = await userManager.getUser();
      const token = user?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ── Response: 401 → refresh → retry → login ───────────────────────────────
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!isAuthRequired) return Promise.reject(error);

      if (error.response?.status === 401) {
        try {
          // signinSilent performs a hidden iframe refresh using the refresh token.
          const refreshedUser = await userManager.signinSilent();
          if (refreshedUser?.access_token) {
            const retryConfig = {
              ...error.config,
              headers: {
                ...error.config.headers,
                Authorization: `Bearer ${refreshedUser.access_token}`,
              },
            };
            return axios(retryConfig);
          }
        } catch {
          // Refresh failed — redirect to login.
          await userManager.signinRedirect();
        }
      }
      return Promise.reject(error);
    }
  );
};
