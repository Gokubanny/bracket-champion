import axios from "axios";

const PRIMARY_URL = import.meta.env.VITE_API_BASE_URL || "https://arenax-backend-xybu.onrender.com/api";
const PRIMARY_SOCKET = import.meta.env.VITE_SOCKET_URL || "https://arenax-backend-xybu.onrender.com";

let currentApiUrl = PRIMARY_URL;
let currentSocketUrl = PRIMARY_SOCKET;
let usingFallback = false;

const testConnection = async (url: string) => {
  try {
    // Test the health endpoint at the correct path
    const healthUrl = url.includes("/api") ? url.replace("/api", "/api/health") : `${url}/api/health`;
    const response = await axios.get(healthUrl, { 
      timeout: 3000,
      withCredentials: true 
    });
    return response.status === 200;
  } catch (error) {
    console.warn(`⚠️ Connection test failed for ${url}`);
    return false;
  }
};

const initializeApi = async () => {
  console.log("🔗 Testing API connection...");
  console.log("  Primary:", PRIMARY_URL);

  const primaryWorks = await testConnection(PRIMARY_URL);
  if (primaryWorks) {
    currentApiUrl = PRIMARY_URL;
    currentSocketUrl = PRIMARY_SOCKET;
    usingFallback = false;
    console.log("✅ Using PRIMARY API:", currentApiUrl);
  } else {
    console.error("❌ Primary API is down! Using fallback...");
    currentApiUrl = PRIMARY_URL;
    currentSocketUrl = PRIMARY_SOCKET;
    usingFallback = true;
  }
};

initializeApi();

const api = axios.create({
  baseURL: currentApiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.baseURL = currentApiUrl;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("token");
      // Only redirect if user had a token (was logged in)
      if (token) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    console.error("❌ API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export { api as default, currentApiUrl, currentSocketUrl, usingFallback };