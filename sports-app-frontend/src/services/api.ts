import axios from "axios";

const PRIMARY_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://arenax-backend-xybu.onrender.com/api";
const PRIMARY_SOCKET =
  import.meta.env.VITE_SOCKET_URL ||
  "https://arenax-backend-xybu.onrender.com";

// These are module-level so they can be mutated by initializeApi and then
// read by the request interceptor on every call — no race condition.
export let currentApiUrl = PRIMARY_URL;
export let currentSocketUrl = PRIMARY_SOCKET;
export let usingFallback = false;

// ── Axios instance ───────────────────────────────────────────────────────────
// baseURL is intentionally left out here; the request interceptor below sets
// it from `currentApiUrl` on every call, so it always reflects the result of
// initializeApi() even if that hasn't resolved yet when the instance is created.
const api = axios.create({
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
});

// ── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // Always pull the latest resolved URL — safe even if initializeApi is still running
  config.baseURL = currentApiUrl;

  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("token");
      if (token) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    console.error("❌ API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ── Connection check ─────────────────────────────────────────────────────────
// Runs once at startup. Because the request interceptor is the source of truth
// for baseURL, any in-flight requests that fire before this resolves will still
// use PRIMARY_URL (the correct default) and will simply get the updated URL on
// their next retry if needed.
const testConnection = async (url: string): Promise<boolean> => {
  try {
    const healthUrl = url.endsWith("/api")
      ? `${url}/health`
      : `${url}/api/health`;
    const response = await axios.get(healthUrl, { timeout: 5000 });
    return response.status === 200;
  } catch {
    console.warn(`⚠️ Connection test failed for ${url}`);
    return false;
  }
};

export const initializeApi = async (): Promise<void> => {
  console.log("🔗 Testing API connection to:", PRIMARY_URL);

  const primaryWorks = await testConnection(PRIMARY_URL);

  if (primaryWorks) {
    currentApiUrl = PRIMARY_URL;
    currentSocketUrl = PRIMARY_SOCKET;
    usingFallback = false;
    console.log("✅ API reachable:", currentApiUrl);
  } else {
    // No real fallback URL exists, so keep primary and warn.
    // The bearer token in localStorage will still authenticate requests
    // even if the cookie path is broken on cross-origin mobile connections.
    currentApiUrl = PRIMARY_URL;
    usingFallback = true;
    console.warn("⚠️ Primary API health check failed — requests will still attempt PRIMARY_URL");
  }
};

// Fire-and-forget — the interceptor handles timing automatically
initializeApi();

export default api;