//api.js

import axios from "axios";
//export const BASE_URL = "https://api/presales.myciti.life/api/";

//export const BASE_URL = "http://127.0.0.1:8000/api/";
export const BASE_URL = "https://api.presale.myciti.life/api/";
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

// Helpers
const getAccess = () => localStorage.getItem("access") || null;
const getRefresh = () => localStorage.getItem("refresh") || null;

// Attach access token
api.interceptors.request.use((config) => {
  const token = getAccess();
  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

let isRefreshing = false;
let queue = [];
const flushQueue = (err, token = null) => {
  queue.forEach((p) => (token ? p.resolve(token) : p.reject(err)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    if (!original || original._retry) return Promise.reject(error);

    if (status === 401) {
      const refresh = getRefresh();
      if (!refresh) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((newAccess) => {
          original.headers = {
            ...(original.headers || {}),
            Authorization: `Bearer ${newAccess}`,
          };
          original._retry = true;
          return api(original);
        });
      }

      isRefreshing = true;
      try {
        // refresh token endpoint – as per your new backend
        const resp = await axios.post(`${BASE_URL}accounts/token/refresh/`, {
          refresh,
        });
        const newAccess = resp?.data?.access;
        if (!newAccess) throw new Error("No access token in refresh response");

        localStorage.setItem("access", newAccess);
        isRefreshing = false;
        flushQueue(null, newAccess);

        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${newAccess}`,
        };
        original._retry = true;
        return api(original);
      } catch (err) {
        isRefreshing = false;
        flushQueue(err, null);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// 👇 default export is now called `api`
export default api;
