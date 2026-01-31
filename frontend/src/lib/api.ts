// Centralized API client for Frontend <-> Backend communication
// Uses VITE_API_BASE_URL or defaults to '/api'
// frontend/src/lib/api.ts

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
  code?: string;
  retryable?: boolean;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition?: (error: ApiError) => boolean;
}

const API_BASE: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const MOCK_MODE: boolean = import.meta.env.VITE_MOCK === 'true';

// CSRF token management
let csrfToken: string | null = null;

const getCSRFToken = async (): Promise<string | null> => {
  if (csrfToken) return csrfToken;
  
  try {
    const response = await fetch(`${API_BASE}/csrf-token`, {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
      return csrfToken;
    }
  } catch (error) {
    console.warn('Failed to get CSRF token:', error);
  }
  return null;
};

const IS_TEST = import.meta.env.MODE === 'test';

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: IS_TEST ? 10 : 1000, // 10ms in tests, 1s otherwise
  maxDelay: IS_TEST ? 100 : 10000, // 100ms in tests, 10s otherwise
  retryCondition: (error: ApiError) => {
    // Retry on network errors, 5xx server errors, and rate limiting
    return (
      !error.status || // Network error
      error.status >= 500 || // Server error
      error.status === 429 || // Rate limited
      error.status === 408 // Request timeout
    );
  }
};

function buildUrl(path: string): string {
  // Allow callers to pass full URLs for redirects if needed
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  // Ensure single slash between base and path
  return `${API_BASE.replace(/\/$/, "")}${path}`;
}

interface ErrorResponse {
  message?: string;
  error?: string;
  code?: string;
  [key: string]: unknown;
}

function createApiError(res: Response, data: unknown): ApiError {
  const errorData = data as ErrorResponse;
  const error: ApiError = new Error(
    errorData?.message || 
    errorData?.error || 
    `Request failed: ${res.status} ${res.statusText}`
  );
  
  error.status = res.status;
  error.details = errorData;
  error.code = errorData?.code;
  
  // Determine if error is retryable
  error.retryable = (
    !res.status || // Network error
    res.status >= 500 || // Server error
    res.status === 429 || // Rate limited
    res.status === 408 // Request timeout
  );
  
  return error;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Production mode - no mock responses

async function requestWithRetry<TResponse>(
  method: HttpMethod, 
  path: string, 
  body?: unknown, 
  init?: RequestInit,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<TResponse> {
  let lastError: ApiError;
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const url = buildUrl(path);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced to 10 second timeout
      
      // Get CSRF token for non-GET requests
      const token = method !== 'GET' ? await getCSRFToken() : null;
      
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "X-CSRF-Token": token }),
          ...(init?.headers || {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...init,
      });
      
      clearTimeout(timeoutId);

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await res.json().catch(() => ({})) : (await res.text()) as unknown;

      if (!res.ok) {
        const error = createApiError(res, data);
        
        // Log the error for debugging
        console.error(`API Error (${res.status}):`, error.message, data);
        
        // Mark as non-retryable if condition is not met
        if (!retryConfig.retryCondition?.(error)) {
          error.retryable = false;
          throw error;
        }
        
        lastError = error;
      } else {
        return data as TResponse;
      }
    } catch (error: unknown) {
      // Handle network errors, timeouts, etc.
      if ((error as Error).name === 'AbortError') {
        const timeoutError: ApiError = new Error('Request timeout');
        timeoutError.status = 408;
        timeoutError.retryable = true;
        lastError = timeoutError;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError: ApiError = new Error('Backend not available - using demo mode');
        networkError.status = 0;
        networkError.retryable = false;
        lastError = networkError;
      } else {
        lastError = error as ApiError;
      }
      
      // If this is the last attempt or error is not retryable, throw immediately
      if (attempt === retryConfig.maxRetries || lastError.retryable === false) {
        throw lastError;
      }
    }
    
    // Calculate delay with exponential backoff and jitter
    const delay = Math.min(
      retryConfig.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
      retryConfig.maxDelay
    );
    
    await sleep(delay);
  }
  
  throw lastError!;
}

async function request<TResponse>(method: HttpMethod, path: string, body?: unknown, init?: RequestInit): Promise<TResponse> {
  return requestWithRetry(method, path, body, init);
}

export const api = {
  base: API_BASE,
  get: <TResponse>(path: string, init?: RequestInit) => request<TResponse>("GET", path, undefined, init),
  post: <TResponse>(path: string, body?: unknown, init?: RequestInit) => request<TResponse>("POST", path, body, init),
  put: <TResponse>(path: string, body?: unknown, init?: RequestInit) => request<TResponse>("PUT", path, body, init),
  patch: <TResponse>(path: string, body?: unknown, init?: RequestInit) => request<TResponse>("PATCH", path, body, init),
  delete: <TResponse>(path: string, init?: RequestInit) => request<TResponse>("DELETE", path, undefined, init),
  buildUrl,
};

export type ApiClient = typeof api;



