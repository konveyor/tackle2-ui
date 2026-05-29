/**
 * Centralized Axios interceptors for the Tackle UI.
 *
 * Request interceptor: attaches the current OIDC access token as a Bearer header.
 *
 * Response interceptor: on 401 (Unauthorized), attempts a silent token refresh and retries
 * the request once with the new token. The refresh is guarded by an `_authRetry` flag to
 * prevent infinite loops. If the refresh or retry fails, the user is redirected to login.
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
          // Refresh worked, but the retry failed — redirect to login.
          try {
            await userManager.signinRedirect();
          } catch {
            // just reject the request if the redirect fails
          }
          return Promise.reject(error);
        }

        try {
          // Silent refresh using the access token and retry the request.
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
          // Silent refresh failed — redirect to login.
          try {
            await userManager.signinRedirect();
          } catch {
            // just reject the request if the redirect fails
          }
          return Promise.reject(error);
        }
      }
      return Promise.reject(error);
    }
  );
};
