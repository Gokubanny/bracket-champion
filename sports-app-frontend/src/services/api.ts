import axios from "axios";

const PRIMARY_URL = import.meta.env.VITE_API_BASE_URL || "https://arenax-backend-xybu.onrender.com/api";
const FALLBACK_URL = "http://localhost:5000/api";
const PRIMARY_SOCKET = import.meta.env.VITE_SOCKET_URL || "https://arenax-backend-xybu.onrender.com";
const FALLBACK_SOCKET = "http://localhost:5000";

let currentApiUrl = PRIMARY_URL;
let currentSocketUrl = PRIMARY_SOCKET;
let usingFallback = false;

// Test which URL is working
const testConnection = async (url: string) => {
  try {
    const response = await axios.get(`${url}/health`, { 
      timeout: 3000,
      withCredentials: true 
    });
    return response.status === 200;
  } catch (error) {
    console.warn(`⚠️ Connection test failed for ${url}`);
    return false;
  }
};

// Auto-detect which URL to use on startup
const initializeApi = async () => {
  console.log("🔗 Testing API connections on startup...");
  console.log("  Primary:", PRIMARY_URL);
  console.log("  Fallback:", FALLBACK_URL);

  const primaryWorks = await testConnection(PRIMARY_URL);

  if (primaryWorks) {
    currentApiUrl = PRIMARY_URL;
    currentSocketUrl = PRIMARY_SOCKET;
    usingFallback = false;
    console.log("✅ Using PRIMARY API:", currentApiUrl);
  } else {
    console.warn("⚠️ Primary API timed out, trying fallback...");
    const fallbackWorks = await testConnection(FALLBACK_URL);

    if (fallbackWorks) {
      currentApiUrl = FALLBACK_URL;
      currentSocketUrl = FALLBACK_SOCKET;
      usingFallback = true;
      console.log("✅ Switched to FALLBACK API:", currentApiUrl);
    } else {
      console.error("❌ Both APIs are down!");
      currentApiUrl = FALLBACK_URL;
      currentSocketUrl = FALLBACK_SOCKET;
    }
  }
};

// Initialize on module load
initializeApi();

const api = axios.create({
  baseURL: currentApiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 8000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.baseURL = currentApiUrl;
  return config;
});

// Response interceptor with smart fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check for network errors
    const isNetworkError = 
      !error.response || 
      error.code === 'ECONNABORTED' || 
      error.code === 'ENOTFOUND' ||
      error.message.includes('timeout') ||
      error.message === 'Network Error';

    const isServerError = error.response?.status >= 500;

    // If primary fails and we haven't switched yet, try fallback
    if ((isNetworkError || isServerError) && !originalRequest._retried && !usingFallback) {
      console.warn("🔄 Primary API failed, switching to fallback...");
      originalRequest._retried = true;

      const fallbackWorks = await testConnection(FALLBACK_URL);
      if (fallbackWorks) {
        currentApiUrl = FALLBACK_URL;
        currentSocketUrl = FALLBACK_SOCKET;
        usingFallback = true;
        api.defaults.baseURL = currentApiUrl;
        originalRequest.baseURL = currentApiUrl;
        console.log("✅ Switched to fallback API:", currentApiUrl);
        return api(originalRequest);
      }
    }

    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    console.error("❌ API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export { api as default, currentApiUrl, currentSocketUrl, usingFallback };