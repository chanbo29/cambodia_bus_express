import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
});
// Attach the JWT access token to every outgoing request, if present.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

function clearAuth() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
}

// On 401, try to refresh the access token using the refresh token before
// giving up and logging the user out. This is what prevents the
// "expires after 5 minutes and kicks me out" behavior.
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh");
    if (!refreshToken) {
      clearAuth();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Another request already triggered a refresh — wait for it instead
      // of firing a second refresh call.
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject, originalRequest });
      });
    }

    isRefreshing = true;

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/token/refresh/",
        { refresh: refreshToken }
      );

      const newAccess = res.data.access;
      localStorage.setItem("access", newAccess);

      // Retry queued requests with the new token
      refreshQueue.forEach(({ resolve, originalRequest: queuedReq }) => {
        queuedReq.headers.Authorization = `Bearer ${newAccess}`;
        resolve(API(queuedReq));
      });
      refreshQueue = [];

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return API(originalRequest);
    } catch (refreshError) {
      refreshQueue.forEach(({ reject }) => reject(refreshError));
      refreshQueue = [];
      clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;