'use client';

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { SWRConfig, useSWRConfig } from 'swr';
import { mutate as globalMutate } from 'swr';
import type {
  SWRKitConfig,
  Fetcher,
  RequestTransform,
  AsyncRequestTransform,
  ResponseTransform,
  AsyncResponseTransform,
  Monitor,
  CacheKey,
} from './types';
import { DEFAULT_SWRKIT_CONFIG, DEFAULT_AUTH_CONFIG } from './constants';
import { createFetcher, buildCacheKey, extractUrlFromKey } from './utils';

/**
 * SWRKit context value
 */
interface SWRKitContextValue {
  config: SWRKitConfig;
  fetcher: Fetcher;
  addRequestTransform: (
    transform: RequestTransform | AsyncRequestTransform,
  ) => void;
  addResponseTransform: (
    transform: ResponseTransform | AsyncResponseTransform,
  ) => void;
  addMonitor: (monitor: Monitor) => void;
  setHeader: (name: string, value: string) => void;
  setHeaders: (headers: Record<string, string>) => void;
  deleteHeader: (name: string) => void;
  setBaseURL: (baseURL: string) => void;
}

/**
 * SWRKit context
 */
const SWRKitContext = createContext<SWRKitContextValue | null>(null);

/**
 * SWRKit provider props
 */
interface SWRKitProviderProps {
  config?: SWRKitConfig;
  children: React.ReactNode;
  getAccessToken?: (cookieName?: string) => string | null;
}

/**
 * SWRKit provider component
 */
export function SWRKitProvider({
  config: userConfig,
  children,
  getAccessToken,
}: SWRKitProviderProps) {
  // Create auth request transform
  const authTransform: RequestTransform = React.useCallback(
    (config) => {
      const authConfig = {
        ...DEFAULT_AUTH_CONFIG,
        ...userConfig?.auth,
      };

      // Only add auth if autoAuth is enabled
      if (authConfig.autoAuth !== false && getAccessToken) {
        const token = getAccessToken(authConfig.accessTokenCookie);

        if (token) {
          const authHeader = authConfig.authHeader || 'Authorization';
          const tokenPrefix = authConfig.tokenPrefix || 'Bearer';
          const authValue = `${tokenPrefix} ${token}`;

          // Add authorization header
          if (!config.headers) {
            config.headers = {};
          }

          if (config.headers instanceof Headers) {
            config.headers.set(authHeader, authValue);
          } else if (Array.isArray(config.headers)) {
            // Check if header already exists
            const existingIndex = config.headers.findIndex(
              ([key]) => key.toLowerCase() === authHeader.toLowerCase(),
            );
            if (existingIndex === -1) {
              config.headers.push([authHeader, authValue]);
            }
          } else {
            // Only add if not already present
            if (!config.headers[authHeader]) {
              config.headers[authHeader] = authValue;
            }
          }
        }
      }
    },
    [userConfig?.auth],
  );

  // Merge user config with defaults
  const [config, setConfig] = React.useState<SWRKitConfig>(() => ({
    ...DEFAULT_SWRKIT_CONFIG,
    ...userConfig,
    headers: { ...DEFAULT_SWRKIT_CONFIG.headers, ...userConfig?.headers },
    auth: { ...DEFAULT_AUTH_CONFIG, ...userConfig?.auth },
    swr: { ...DEFAULT_SWRKIT_CONFIG.swr, ...userConfig?.swr },
    requestTransforms: [
      // Add auth transform first
      authTransform,
      ...(DEFAULT_SWRKIT_CONFIG.requestTransforms || []),
      ...(userConfig?.requestTransforms || []),
    ],
    responseTransforms: [
      ...(DEFAULT_SWRKIT_CONFIG.responseTransforms || []),
      ...(userConfig?.responseTransforms || []),
    ],
    monitors: [
      ...(DEFAULT_SWRKIT_CONFIG.monitors || []),
      ...(userConfig?.monitors || []),
    ],
  }));

  // Create fetcher
  const fetcher = useMemo(
    () =>
      config.fetcher ||
      createFetcher(
        config.baseURL,
        config.headers,
        config.timeout,
        config.requestTransforms,
        config.responseTransforms,
        config.monitors,
      ),
    [
      config.fetcher,
      config.baseURL,
      config.headers,
      config.timeout,
      config.requestTransforms,
      config.responseTransforms,
      config.monitors,
    ],
  );

  // Helper functions to update config
  const addRequestTransform = React.useCallback(
    (transform: RequestTransform | AsyncRequestTransform) => {
      setConfig((prev) => ({
        ...prev,
        requestTransforms: [...(prev.requestTransforms || []), transform],
      }));
    },
    [],
  );

  const addResponseTransform = React.useCallback(
    (transform: ResponseTransform | AsyncResponseTransform) => {
      setConfig((prev) => ({
        ...prev,
        responseTransforms: [...(prev.responseTransforms || []), transform],
      }));
    },
    [],
  );

  const addMonitor = React.useCallback((monitor: Monitor) => {
    setConfig((prev) => ({
      ...prev,
      monitors: [...(prev.monitors || []), monitor],
    }));
  }, []);

  const setHeader = React.useCallback((name: string, value: string) => {
    setConfig((prev) => {
      const headers = prev.headers || {};
      if (headers instanceof Headers) {
        headers.set(name, value);
        return { ...prev, headers };
      } else if (Array.isArray(headers)) {
        const newHeaders = [...headers];
        const existingIndex = newHeaders.findIndex(
          ([key]) => key.toLowerCase() === name.toLowerCase(),
        );
        if (existingIndex !== -1) {
          newHeaders[existingIndex] = [name, value];
        } else {
          newHeaders.push([name, value]);
        }
        return { ...prev, headers: newHeaders };
      } else {
        return { ...prev, headers: { ...headers, [name]: value } };
      }
    });
  }, []);

  const setHeaders = React.useCallback(
    (headers: Record<string, string>) => {
      Object.entries(headers).forEach(([name, value]) => {
        setHeader(name, value);
      });
    },
    [setHeader],
  );

  const deleteHeader = React.useCallback((name: string) => {
    setConfig((prev) => {
      const headers = prev.headers;
      if (!headers) return prev;

      if (headers instanceof Headers) {
        headers.delete(name);
        return { ...prev, headers };
      } else if (Array.isArray(headers)) {
        return {
          ...prev,
          headers: headers.filter(
            ([key]) => key.toLowerCase() !== name.toLowerCase(),
          ),
        };
      } else {
        const newHeaders = { ...headers };
        delete newHeaders[name];
        return { ...prev, headers: newHeaders };
      }
    });
  }, []);

  const setBaseURL = React.useCallback((baseURL: string) => {
    setConfig((prev) => ({ ...prev, baseURL }));
  }, []);

  const contextValue = useMemo<SWRKitContextValue>(
    () => ({
      config,
      fetcher,
      addRequestTransform,
      addResponseTransform,
      addMonitor,
      setHeader,
      setHeaders,
      deleteHeader,
      setBaseURL,
    }),
    [
      config,
      fetcher,
      addRequestTransform,
      addResponseTransform,
      addMonitor,
      setHeader,
      setHeaders,
      deleteHeader,
      setBaseURL,
    ],
  );

  return (
    <SWRKitContext.Provider value={contextValue}>
      <SWRConfig value={config.swr || {}}>{children}</SWRConfig>
    </SWRKitContext.Provider>
  );
}

/**
 * Hook to access SWRKit context
 */
export function useSWRKitContext(): SWRKitContextValue {
  const context = useContext(SWRKitContext);

  if (!context) {
    throw new Error('useSWRKitContext must be used within a SWRKitProvider');
  }

  return context;
}

/**
 * Hook to access SWRKit config
 */
export function useSWRKitConfig(): SWRKitConfig {
  const { config } = useSWRKitContext();
  return config;
}

/**
 * Hook to access SWRKit fetcher
 */
export function useSWRKitFetcher(): Fetcher {
  const { fetcher } = useSWRKitContext();
  return fetcher;
}

/**
 * Hook to access SWR cache and mutate function
 *
 * @example
 * const { cache, mutate } = useSWRKitCache();
 * // Access cache entries
 * for (const key of cache.keys()) {
 *   console.log(key, cache.get(key));
 * }
 */
export function useSWRKitCache() {
  const { cache, mutate } = useSWRConfig();
  return { cache, mutate };
}

/**
 * Hook for preloading data with automatic fetcher integration
 *
 * @example
 * function ProductCard() {
 *   const preload = useSWRKitPreload();
 *
 *   return (
 *     <Link
 *       href="/product/123"
 *       onMouseEnter={() => preload('/api/product/123')}
 *     >
 *       View Product
 *     </Link>
 *   );
 * }
 */
export function useSWRKitPreload() {
  const { fetcher } = useSWRKitContext();

  return useCallback(
    async <T = any>(key: CacheKey, params?: Record<string, any>) => {
      const cacheKey = buildCacheKey(key, params);
      if (!cacheKey) return;

      const url = extractUrlFromKey(cacheKey);
      if (!url) return;

      const wrappedFetcher = async () => {
        const response = await fetcher<T>({
          url,
          method: 'GET',
          params,
        });

        if (!response.ok) throw response.originalError;
        return response.data;
      };

      try {
        const data = await wrappedFetcher();
        if (data) {
          await globalMutate(cacheKey, data, false);
        }
      } catch (error) {
        // Silently fail for preload
        console.debug('Preload failed for', key, error);
      }
    },
    [fetcher],
  );
}

/**
 * Hook for imperative cache mutation with bound fetcher context
 *
 * @example
 * const mutateCache = useSWRKitMutate();
 * // Update cache
 * await mutateCache('/api/user', updatedUser);
 * // Invalidate cache
 * await mutateCache('/api/user');
 */
export function useSWRKitMutate() {
  const { mutate } = useSWRConfig();

  return useCallback(
    async <T = any>(
      key: CacheKey,
      data?: T | Promise<T> | ((currentData?: T) => T | Promise<T>),
      shouldRevalidate = true,
    ) => {
      return mutate(key, data, shouldRevalidate);
    },
    [mutate],
  );
}
