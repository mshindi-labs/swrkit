import {
  type SWRKitResponse,
  type SWRKitRequestConfig,
  type RequestTransform,
  type AsyncRequestTransform,
  type ResponseTransform,
  type AsyncResponseTransform,
  type Monitor,
  type CacheKey,
} from './types';
import {
  PROBLEM_CODE,
  classifyProblem,
  buildUrl,
  mergeHeaders,
  headersToObject,
  fetchWithTimeout,
  parseResponseBody,
  prepareRequestBody,
} from '@mshindi-labs/refetch';

import { METHODS_WITH_BODY, DEFAULT_TIMEOUT } from './constants';
import { createErrorFromResponse } from './errors';

/**
 * Build a cache key for SWR
 * Supports strings, arrays, and objects (SWR will serialize them)
 */
export function buildCacheKey(
  key: CacheKey,
  params?: Record<string, any>,
): CacheKey {
  // Null or undefined - no fetching
  if (key === null || key === undefined) {
    return null;
  }

  // If it's already an array or object, let SWR handle serialization
  if (Array.isArray(key)) {
    return key;
  }

  if (typeof key === 'object' && !(key instanceof String)) {
    return key;
  }

  // String URL - add params if provided
  const url = key as string;

  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    return `${url}?${sortedParams}`;
  }

  return url;
}

/**
 * Extract URL from cache key (handles strings, arrays, objects)
 */
export function extractUrlFromKey(key: CacheKey): string | null {
  if (!key) return null;

  if (typeof key === 'string') {
    return key;
  }

  if (Array.isArray(key) && key.length > 0) {
    return String(key[0]);
  }

  if (typeof key === 'object' && 'url' in key) {
    return String(key.url);
  }

  return null;
}

/**
 * Apply request transforms
 */
export async function applyRequestTransforms(
  config: SWRKitRequestConfig,
  transforms: Array<RequestTransform | AsyncRequestTransform>,
): Promise<void> {
  for (const transform of transforms) {
    await transform(config);
  }
}

/**
 * Apply response transforms
 */
export async function applyResponseTransforms<T>(
  response: SWRKitResponse<T>,
  transforms: Array<ResponseTransform | AsyncResponseTransform>,
): Promise<void> {
  for (const transform of transforms) {
    await transform(response);
  }
}

/**
 * Notify monitors
 */
export function notifyMonitors<T>(
  response: SWRKitResponse<T>,
  monitors: Monitor[],
): void {
  monitors.forEach((monitor) => {
    try {
      monitor(response);
    } catch (error) {
      console.error('Monitor error:', error);
    }
  });
}

/**
 * Check if method should have a body
 */
export function shouldHaveBody(method: string): boolean {
  return METHODS_WITH_BODY.includes(
    method.toUpperCase() as (typeof METHODS_WITH_BODY)[number],
  );
}

/**
 * Normalize response to SWRKit format
 */
export function normalizeResponse<T>(
  data: T,
  response: Response,
  duration: number,
): SWRKitResponse<T> {
  const isOk = response.ok;

  if (isOk) {
    return {
      ok: true,
      problem: null,
      originalError: null,
      data,
      status: response.status,
      headers: headersToObject(response.headers),
      duration,
    };
  } else {
    const error = new Error(
      `HTTP Error ${response.status}: ${response.statusText}`,
    );
    return {
      ok: false,
      problem: classifyProblem(response.status),
      originalError: error,
      data,
      status: response.status,
      headers: headersToObject(response.headers),
      duration,
    };
  }
}

/**
 * Normalize error response
 */
export function normalizeErrorResponse<T>(
  error: Error,
  response?: Response,
  duration?: number,
): SWRKitResponse<T> {
  const status = response?.status;
  const problem = classifyProblem(status, error);

  return {
    ok: false,
    problem,
    originalError: error,
    data: undefined,
    status,
    headers: response ? headersToObject(response.headers) : undefined,
    duration,
  };
}

/**
 * Create a fetcher function with configuration
 */
export function createFetcher(
  baseURL?: string,
  defaultHeaders?: HeadersInit,
  defaultTimeout?: number,
  requestTransforms?: Array<RequestTransform | AsyncRequestTransform>,
  responseTransforms?: Array<ResponseTransform | AsyncResponseTransform>,
  monitors?: Monitor[],
) {
  return async function fetcher<T = any>(
    config: SWRKitRequestConfig,
  ): Promise<SWRKitResponse<T>> {
    const startTime = Date.now();

    try {
      // Apply request transforms
      if (requestTransforms && requestTransforms.length > 0) {
        await applyRequestTransforms(config, requestTransforms);
      }

      // Build URL
      const fullUrl = buildUrl(baseURL, config.url || '', config.params);

      // Merge headers
      const headers = mergeHeaders(defaultHeaders, config.headers);

      // Prepare body
      const method = config.method?.toUpperCase() || 'GET';
      const body = shouldHaveBody(method)
        ? prepareRequestBody(config.data)
        : undefined;

      // Make request
      const fetchConfig: RequestInit & { timeout?: number } = {
        method,
        headers,
        body,
        timeout: config.timeout || defaultTimeout || DEFAULT_TIMEOUT,
        ...config.options,
      };

      const response = await fetchWithTimeout(fullUrl, fetchConfig);
      const duration = Date.now() - startTime;

      // Parse response
      const data = await parseResponseBody<T>(response);

      // Normalize response
      let swrKitResponse = normalizeResponse(data as T, response, duration);

      // Apply response transforms
      if (responseTransforms && responseTransforms.length > 0) {
        await applyResponseTransforms(swrKitResponse, responseTransforms);
      }

      // Notify monitors
      if (monitors && monitors.length > 0) {
        notifyMonitors(swrKitResponse, monitors);
      }

      // Throw error if not ok (for SWR error handling)
      if (!swrKitResponse.ok) {
        const error = createErrorFromResponse(swrKitResponse);
        throw error;
      }

      return swrKitResponse;
    } catch (error) {
      const duration = Date.now() - startTime;
      const swrKitResponse = normalizeErrorResponse<T>(
        error as Error,
        undefined,
        duration,
      );

      // Apply response transforms even for errors
      if (responseTransforms && responseTransforms.length > 0) {
        await applyResponseTransforms(swrKitResponse, responseTransforms);
      }

      // Notify monitors
      if (monitors && monitors.length > 0) {
        notifyMonitors(swrKitResponse, monitors);
      }

      // Create typed error
      const typedError = createErrorFromResponse(swrKitResponse);
      throw typedError;
    }
  };
}

/**
 * Merge configurations
 */
export function mergeConfigs(
  ...configs: (SWRKitRequestConfig | undefined)[]
): SWRKitRequestConfig {
  const merged: SWRKitRequestConfig = {};

  for (const config of configs) {
    if (!config) continue;

    Object.assign(merged, config);

    // Merge headers specifically
    if (config.headers) {
      merged.headers = mergeHeaders(merged.headers, config.headers);
    }

    // Merge params specifically
    if (config.params) {
      merged.params = { ...merged.params, ...config.params };
    }
  }

  return merged;
}

/**
 * Extract response data from SWR error
 */
export function extractResponseFromError(
  error: any,
): SWRKitResponse<any> | null {
  return error?.response || null;
}

// Re-export utilities from refetch for convenience
export {
  buildUrl,
  mergeHeaders,
  headersToObject,
  classifyProblem,
  PROBLEM_CODE,
};
