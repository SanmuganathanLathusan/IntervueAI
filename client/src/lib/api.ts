/**
 * API client utilities for making requests to backend
 */

const API_URL = ''; 

// Configuration for retries
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryOn: [408, 429, 500, 502, 503, 504], // Retry on these status codes
};

interface FetchOptions extends Omit<RequestInit, 'body'> {
  token?: string;
  body?: unknown;
  skipRetry?: boolean;
  timeout?: number; // Optional timeout in ms
}

/**
 * Wait before retrying
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if we should retry based on status code or error type
 */
function shouldRetry(error: unknown, status?: number): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true; // Retry network errors
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true; // Retry on timeout
  }
  if (status && RETRY_CONFIG.retryOn.includes(status)) {
    return true; // Retry specific HTTP errors
  }
  return false;
}

/**
 * Generic fetch wrapper with error handling, retry logic, and timeouts
 */
export async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, body, skipRetry = false, timeout = 15000, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const requestInit: RequestInit = {
    ...fetchOptions,
    headers,
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  let lastError: Error | null = null;
  let retries = 0;

  while (retries <= (skipRetry ? 0 : RETRY_CONFIG.maxRetries)) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    requestInit.signal = controller.signal;

    try {
      console.log(`[API] ${requestInit.method || 'GET'} ${endpoint}${retries > 0 ? ` (retry ${retries}/${RETRY_CONFIG.maxRetries})` : ''}`);

      const response = await fetch(url, requestInit);
      clearTimeout(id);

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        
        // Check if we should retry
        if (!skipRetry && shouldRetry(error, response.status) && retries < RETRY_CONFIG.maxRetries) {
          lastError = error;
          retries++;
          const waitTime = RETRY_CONFIG.retryDelay * Math.pow(2, retries - 1); // Exponential backoff
          console.warn(`[API] Failed (${response.status}), retrying in ${waitTime}ms...`);
          await delay(waitTime);
          continue;
        }

        throw error;
      }

      const data = await response.json();
      console.log(`[API] ✅ ${requestInit.method || 'GET'} ${endpoint}`);
      return data;
    } catch (error) {
      clearTimeout(id);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (lastError.name === 'AbortError') {
        console.warn(`[API] ⏱️ Timeout (${timeout}ms) for ${requestInit.method || 'GET'} ${endpoint}`);
        lastError = new Error('Request timed out. Please check your connection.');
      }

      // Check if we should retry
      if (!skipRetry && shouldRetry(error) && retries < RETRY_CONFIG.maxRetries) {
        retries++;
        const waitTime = RETRY_CONFIG.retryDelay * Math.pow(2, retries - 1); // Exponential backoff
        console.warn(`[API] Error: ${lastError.message}, retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }

      // All retries exhausted, throw error
      console.error(`[API] ❌ ${requestInit.method || 'GET'} ${endpoint} - ${lastError.message}`);
      throw lastError;
    }
  }

  throw lastError || new Error('API request failed');
}

/**
 * Make a JSON GET/POST/PUT/DELETE request
 */
export async function apiJson<T>(
  endpoint: string,
  options: FetchOptions & { method?: string } = {}
): Promise<T> {
  return apiRequest<T>(endpoint, options);
}

/**
 * Make a FormData request (for file uploads)
 */
export async function apiForm<T>(
  endpoint: string,
  formData: FormData,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  let lastError: Error | null = null;
  let retries = 0;
  const timeout = 60000; // 60 seconds for uploads

  while (retries <= RETRY_CONFIG.maxRetries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`[API] POST ${endpoint}${retries > 0 ? ` (retry ${retries}/${RETRY_CONFIG.maxRetries})` : ''}`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;

        if (shouldRetry(error, response.status) && retries < RETRY_CONFIG.maxRetries) {
          lastError = error;
          retries++;
          const waitTime = RETRY_CONFIG.retryDelay * Math.pow(2, retries - 1);
          console.warn(`[API] Failed (${response.status}), retrying in ${waitTime}ms...`);
          await delay(waitTime);
          continue;
        }

        throw error;
      }

      const data = await response.json();
      console.log(`[API] ✅ POST ${endpoint}`);
      return data;
    } catch (error) {
      clearTimeout(id);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (lastError.name === 'AbortError') {
         console.warn(`[API] ⏱️ Timeout (${timeout}ms) for POST ${endpoint}`);
         lastError = new Error('Upload timed out. Please check your connection.');
      }

      if (shouldRetry(error) && retries < RETRY_CONFIG.maxRetries) {
        retries++;
        const waitTime = RETRY_CONFIG.retryDelay * Math.pow(2, retries - 1);
        console.warn(`[API] Error: ${lastError.message}, retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }

      console.error(`[API] ❌ POST ${endpoint} - ${lastError.message}`);
      throw lastError;
    }
  }

  throw lastError || new Error('API request failed');
}

/**
 * Construct proper Authorization header
 */
export function getAuthHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}
