import axios, { AxiosError } from "axios";

/**
 * Resolves the API base URL. Priority:
 * 1. NEXT_PUBLIC_API_URL if explicitly set (production / custom setups).
 * 2. Otherwise, derive from the browser's current hostname so the app
 *    works both on localhost AND when opened via the machine's LAN IP
 *    (e.g. a phone hitting http://192.168.1.5:3000 will call the API at
 *    http://192.168.1.5:5000). Falls back to localhost during SSR.
 */
function resolveApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:5000/api/v1`;
  }
  return "http://localhost:5000/api/v1";
}

export const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send/receive httpOnly auth cookies
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let pendingQueue: { resolve: () => void; reject: (err: unknown) => void }[] = [];

function flushQueue(error: unknown) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingQueue = [];
}

/**
 * On a 401 from any request (except the refresh call itself and auth
 * endpoints), transparently attempt one silent refresh via the
 * httpOnly refresh-token cookie, then retry the original request once.
 * Concurrent 401s are queued so only one refresh call fires at a time.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status !== 401 || isAuthRoute || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: () => resolve(api(originalRequest)),
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post("/auth/refresh");
      flushQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export interface ApiErrorShape {
  success: false;
  message: string;
  details?: Record<string, string[] | undefined>;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorShape | undefined;
    return data?.message ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
