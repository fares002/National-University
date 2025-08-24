import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1",
  withCredentials: true, // Important for http-only cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const publicPaths = ["/login", "/forgot-password", "/reset-password"];
      const currentPath = window.location.pathname;

      // Redirect only if we're not on a public page
      if (!publicPaths.includes(currentPath)) {
        console.log("Authentication failed - redirecting to login");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);


export default api;
