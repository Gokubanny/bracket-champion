import axios from "axios";

const PRIMARY_URL = import.meta.env.VITE_API_BASE_URL || "https://arenax-backend-xybu.onrender.com/api";
const PRIMARY_SOCKET = import.meta.env.VITE_SOCKET_URL || "https://arenax-backend-xybu.onrender.com";

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

  const primaryWorks = await testConnection(PRIMARY_URL);

  if (primaryWorks) {
    currentApiUrl = PRIMARY_URL;
    currentSocketUrl = PRIMARY_SOCKET;
    usingFallback = false;
    console.log("✅ Using PRIMARY API:", currentApiUrl);
  } else {
    console.error("❌ Primary API is down!");
    currentApiUrl = PRIMARY_URL;
    currentSocketUrl = PRIMARY_SOCKET;
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
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