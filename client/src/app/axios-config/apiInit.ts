import axios from "axios";

export const initInterceptors = (getToken: () => Promise<string>) => {
  axios.interceptors.request.use(
    async (config) => {
      const token = await getToken();
      if (token) config.headers["Authorization"] = "Bearer " + token;
      return config;
    },
    (error) => {
      Promise.reject(error);
    }
  );
};
