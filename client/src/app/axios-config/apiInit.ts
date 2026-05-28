/**
 * Centralized Axios interceptors for the Tackle UI.
 *
 * Request interceptor: attaches the current OIDC access token as a Bearer header.
 *
 * Response interceptor: on 401, attempts a silent token refresh via the OIDC
 * UserManager; retries the request once with the new token (guarded by an
 * `_authRetry` flag to prevent infinite loops); redirects to login on failure.
 */

import axios from "axios";

import { isAuthRequired } from "@app/Constants";
import { userManager } from "@app/auth/userManager";

// Guard against duplicate interceptor registration (e.g. React StrictMode double-invoke).
let _initialized = false;

export const initAuthInterceptors = () => {
  if (!isAuthRequired) return;
  if (_initialized) return;
  _initialized = true;

  // ── Request: attach Bearer token ──────────────────────────────────────────
  axios.interceptors.request.use(
    async (config) => {
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
      if (error.response?.status === 401) {
        if ((error.config as Record<string, unknown>)?._authRetry) {
          await userManager.signinRedirect();
          return Promise.reject(error);
        }

        try {
          // signinSilent performs a hidden iframe refresh using the refresh token.
          const refreshedUser = await userManager.signinSilent();
          if (refreshedUser?.access_token) {
            const retryConfig = {
              ...error.config,
              _authRetry: true,
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
          return Promise.reject(error);
        }
      }
      return Promise.reject(error);
    }
  );
};
