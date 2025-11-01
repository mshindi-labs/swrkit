'use client';

import { useRef, useEffect } from 'react';
import type { Middleware } from 'swr';

/**
 * Middleware for laggy data - keeps previous data during revalidation
 * Useful for smooth UI transitions without showing loading states
 *
 * @example
 * const { data } = useFetch('/api/user', {
 *   use: [laggyMiddleware()],
 * });
 */
export function laggyMiddleware(): Middleware {
  return (useSWRNext) => {
    return (key, fetcher, config) => {
      const laggyDataRef = useRef<any>(undefined);
      const swr = useSWRNext(key, fetcher, config);

      useEffect(() => {
        if (swr.data !== undefined) {
          laggyDataRef.current = swr.data;
        }
      }, [swr.data]);

      const isLagging = swr.data === undefined && swr.isValidating;

      return {
        ...swr,
        data: isLagging ? laggyDataRef.current : swr.data,
      } as any;
    };
  };
}

/**
 * Middleware for request logging
 * Logs all SWR requests, responses, and errors to console
 *
 * @param options - Configuration options
 *
 * @example
 * const { data } = useFetch('/api/user', {
 *   use: [loggerMiddleware({ logErrors: true })],
 * });
 */
export function loggerMiddleware(
  options: {
    logRequests?: boolean;
    logResponses?: boolean;
    logErrors?: boolean;
    prefix?: string;
  } = {},
): Middleware {
  const {
    logRequests = true,
    logResponses = true,
    logErrors = true,
    prefix = '[SWRKit]',
  } = options;

  return (useSWRNext) => {
    return (key, fetcher, config) => {
      if (logRequests) {
        console.log(`${prefix} Request:`, key);
      }

      const swr = useSWRNext(key, fetcher, config);

      useEffect(() => {
        if (logErrors && swr.error) {
          console.error(`${prefix} Error:`, key, swr.error);
        }
        if (logResponses && swr.data) {
          console.log(`${prefix} Success:`, key, swr.data);
        }
      }, [swr.data, swr.error]);

      return swr;
    };
  };
}

/**
 * Middleware for request timing
 * Measures and logs request duration
 *
 * @param options - Configuration options
 *
 * @example
 * const { data } = useFetch('/api/user', {
 *   use: [timingMiddleware({ threshold: 1000 })],
 * });
 */
export function timingMiddleware(
  options: {
    threshold?: number; // Warn if request takes longer than this (ms)
    onSlowRequest?: (key: string, duration: number) => void;
    prefix?: string;
  } = {},
): Middleware {
  const { threshold = 3000, onSlowRequest, prefix = '[SWRKit Timing]' } =
    options;

  return (useSWRNext) => {
    return (key, fetcher, config) => {
      const startTimeRef = useRef<number>(0);

      const wrappedFetcher = async (...args: any[]) => {
        startTimeRef.current = Date.now();
        const result = await fetcher?.(...args);
        const duration = Date.now() - (startTimeRef.current || 0);

        if (duration > threshold) {
          console.warn(
            `${prefix} Slow request detected: ${key} (${duration}ms)`,
          );
          if (onSlowRequest) {
            onSlowRequest(String(key), duration);
          }
        }

        return result;
      };

      return useSWRNext(key, wrappedFetcher as any, config);
    };
  };
}

/**
 * Middleware for retry with backoff
 * Implements exponential backoff for failed requests
 *
 * @param options - Configuration options
 *
 * @example
 * const { data } = useFetch('/api/user', {
 *   use: [retryMiddleware({ maxRetries: 5 })],
 * });
 */
export function retryMiddleware(
  options: {
    maxRetries?: number;
    baseDelay?: number; // Base delay in ms for exponential backoff
    maxDelay?: number; // Maximum delay in ms
  } = {},
): Middleware {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000 } = options;

  return (useSWRNext) => {
    return (key, fetcher, config) => {
      return useSWRNext(key, fetcher, {
        ...config,
        onErrorRetry: (error: any, key: any, config: any, revalidate: any, opts: any) => {
          const retryCount = opts.retryCount || 0;

          // Stop retrying if max retries reached
          if (retryCount >= maxRetries) {
            return;
          }

          // Don't retry on 4xx errors (client errors)
          if (error.status && error.status >= 400 && error.status < 500) {
            return;
          }

          // Calculate exponential backoff delay
          const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

          setTimeout(() => revalidate(opts), delay);
        },
      } as any);
    };
  };
}

/**
 * Middleware for caching to localStorage
 * Persists SWR cache data to localStorage for offline access
 *
 * @param options - Configuration options
 *
 * @example
 * const { data } = useFetch('/api/user', {
 *   use: [localStorageMiddleware({ key: 'user-cache' })],
 * });
 */
export function localStorageMiddleware(
  options: {
    key: string; // localStorage key to use
    ttl?: number; // Time to live in ms (default: 24 hours)
  } = { key: 'swrkit-cache' },
): Middleware {
  const { key, ttl = 24 * 60 * 60 * 1000 } = options;

  return (useSWRNext) => {
    return (swrKey, fetcher, config) => {
      const swr = useSWRNext(swrKey, fetcher, {
        ...config,
        fallbackData: config?.fallbackData ?? (() => {
          // Try to load from localStorage
          if (typeof window === 'undefined') return undefined;

          try {
            const cached = localStorage.getItem(`${key}:${String(swrKey)}`);
            if (!cached) return undefined;

            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp > ttl) {
              // Expired
              localStorage.removeItem(`${key}:${String(swrKey)}`);
              return undefined;
            }

            return parsed.data;
          } catch (error) {
            return undefined;
          }
        })(),
      } as any);

      // Save to localStorage when data changes
      useEffect(() => {
        if (typeof window === 'undefined') return;
        if (swr.data === undefined) return;

        try {
          localStorage.setItem(
            `${key}:${String(swrKey)}`,
            JSON.stringify({
              data: swr.data,
              timestamp: Date.now(),
            }),
          );
        } catch (error) {
          console.error('Failed to save to localStorage:', error);
        }
      }, [swr.data]);

      return swr;
    };
  };
}

/**
 * Middleware for request deduplication with custom interval
 * Prevents duplicate requests within a specified time window
 *
 * @param interval - Deduplication interval in ms
 *
 * @example
 * const { data } = useFetch('/api/user', {
 *   use: [dedupeMiddleware(5000)], // Dedupe for 5 seconds
 * });
 */
export function dedupeMiddleware(interval: number = 2000): Middleware {
  return (useSWRNext) => {
    return (key, fetcher, config) => {
      return useSWRNext(key, fetcher, {
        ...config,
        dedupingInterval: interval,
      });
    };
  };
}

/**
 * Middleware for conditional fetching based on predicate
 * Pauses/resumes requests based on a condition
 *
 * @param shouldFetch - Function that returns whether to fetch
 *
 * @example
 * const { data } = useFetch('/api/user', {
 *   use: [conditionalMiddleware(() => isOnline)],
 * });
 */
export function conditionalMiddleware(
  shouldFetch: () => boolean,
): Middleware {
  return (useSWRNext) => {
    return (key, fetcher, config) => {
      return useSWRNext(key, fetcher, {
        ...config,
        isPaused: () => !shouldFetch(),
      });
    };
  };
}
