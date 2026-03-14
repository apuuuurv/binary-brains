// frontend/src/lib/api.js
import axios from "axios";

// Create an Axios instance pointing to your FastAPI backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8999/api",
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    // Get the token from local storage
    const token = localStorage.getItem("access_token");

    // If the token exists, attach it to the Authorization header
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
