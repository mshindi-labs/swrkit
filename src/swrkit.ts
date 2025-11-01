'use client';

import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import useSWRInfinite from 'swr/infinite';
import { mutate as globalMutate } from 'swr';
import type {
  UseFetchOptions,
  UseFetchReturn,
  UseMutationOptions,
  UseMutationReturn,
  UseInfiniteScrollOptions,
  UseInfiniteScrollReturn,
  SWRKitRequestConfig,
  SWRKitResponse,
  CacheKey,
} from './types';
import { useSWRKitContext } from './context';
import {
  buildCacheKey,
  mergeConfigs,
  extractResponseFromError,
  extractUrlFromKey,
} from './utils';

/**
 * Main hook for GET requests with SWR
 *
 * @template T - The expected data type
 *
 * @param key - Cache key (URL, array, or object)
 * @param options - Configuration options
 *
 * @returns Object containing data, loading state, error, and mutate function
 *
 * @example
 * // Simple fetch
 * const { data, isLoading } = useFetch<User>('/api/user/123');
 *
 * @example
 * // With query parameters
 * const { data } = useFetch('/api/users', {
 *   params: { page: 1, limit: 10 },
 * });
 *
 * @example
 * // Multiple arguments (for dynamic fetching)
 * const { data } = useFetch(['/api/user', userId, token]);
 *
 * @example
 * // Conditional fetching
 * const { data } = useFetch(userId ? `/api/user/${userId}` : null);
 *
 * @example
 * // With polling
 * const { data } = useFetch('/api/stats', {
 *   refreshInterval: 5000, // Poll every 5 seconds
 * });
 */
export function useFetch<T = any>(
  key: CacheKey | (() => CacheKey),
  options: UseFetchOptions<T> = {},
): UseFetchReturn<T> {
  const { fetcher: contextFetcher } = useSWRKitContext();
  const {
    swr: swrConfig,
    request: requestConfig,
    params,
    skip,
    // Extract convenience options
    fallbackData,
    keepPreviousData,
    suspense,
    revalidateIfStale,
    revalidateOnMount,
    refreshInterval,
    refreshWhenHidden,
    refreshWhenOffline,
    shouldRetryOnError,
    errorRetryInterval,
    errorRetryCount,
    onErrorRetry,
    compare,
    isPaused,
    use,
    loadingTimeout,
    onLoadingSlow,
    onSuccess,
    onError,
    onDiscarded,
  } = options;

  // Resolve key if it's a function
  const resolvedKey = typeof key === 'function' ? key() : key;

  // Build cache key with stable reference
  const cacheKey = useMemo(() => {
    if (skip || !resolvedKey) return null;
    return buildCacheKey(resolvedKey, params);
  }, [resolvedKey, params, skip]);

  // Stable request config reference
  const stableRequestConfig = useMemo(
    () => requestConfig,
    [JSON.stringify(requestConfig)],
  );

  // Create fetcher function that extracts URL from various key formats
  const fetcher = useCallback(
    async (fetchKey: CacheKey): Promise<T> => {
      // Extract URL from key (handles strings, arrays, objects)
      const url = extractUrlFromKey(fetchKey);
      if (!url) {
        throw new Error('Invalid cache key: could not extract URL');
      }

      const fetchConfig: SWRKitRequestConfig = mergeConfigs(
        {
          url,
          method: 'GET',
          params,
        },
        stableRequestConfig,
      );

      const response = await contextFetcher<T>(fetchConfig);
      return response.data as T;
    },
    [params, stableRequestConfig, contextFetcher],
  );

  // Merge all SWR options
  const finalSWRConfig = useMemo(
    () => ({
      ...swrConfig,
      fallbackData,
      keepPreviousData,
      suspense,
      revalidateIfStale,
      revalidateOnMount,
      refreshInterval,
      refreshWhenHidden,
      refreshWhenOffline,
      shouldRetryOnError,
      errorRetryInterval,
      errorRetryCount,
      onErrorRetry,
      compare,
      isPaused,
      use,
      loadingTimeout,
      onLoadingSlow,
      onSuccess,
      onError,
      onDiscarded,
    }),
    [
      swrConfig,
      fallbackData,
      keepPreviousData,
      suspense,
      revalidateIfStale,
      revalidateOnMount,
      refreshInterval,
      refreshWhenHidden,
      refreshWhenOffline,
      shouldRetryOnError,
      errorRetryInterval,
      errorRetryCount,
      onErrorRetry,
      compare,
      isPaused,
      use,
      loadingTimeout,
      onLoadingSlow,
      onSuccess,
      onError,
      onDiscarded,
    ],
  );

  // Use SWR - cast finalSWRConfig to any to avoid complex type conflicts
  const { data, error, isValidating, mutate, isLoading } = useSWR<T, Error>(
    cacheKey as any,
    cacheKey ? fetcher : null,
    finalSWRConfig as any,
  );

  // Extract problem code and status from error
  const responseData = error ? extractResponseFromError(error) : null;
  const problem = responseData?.problem || null;
  const status = responseData?.status;
  const headers = responseData?.headers;

  return {
    data,
    isLoading: isLoading || (!data && !error && !suspense),
    isValidating,
    error,
    problem,
    status,
    headers,
    mutate,
  };
}

/**
 * Hook for mutations (POST, PUT, PATCH, DELETE) using SWR's useSWRMutation
 *
 * @template TData - The expected response data type
 * @template TVariables - The mutation variables type
 *
 * @param options - Mutation configuration
 *
 * @returns Object containing trigger function, loading state, data, and error
 *
 * @example
 * // Simple mutation
 * const { trigger, isMutating } = useMutation<User, CreateUserData>({
 *   url: '/api/users',
 *   method: 'POST',
 * });
 *
 * @example
 * // With optimistic updates
 * const { trigger } = useMutation<Post>({
 *   url: '/api/posts/123/like',
 *   method: 'POST',
 *   optimisticData: (current) => ({
 *     ...current,
 *     liked: true,
 *     likes: (current?.likes || 0) + 1,
 *   }),
 *   rollbackOnError: true,
 * });
 */
export function useMutation<TData = any, TVariables = any>(
  options: UseMutationOptions<TData, TVariables>,
): UseMutationReturn<TData, TVariables> {
  const { fetcher: contextFetcher } = useSWRKitContext();
  const {
    url,
    method = 'POST',
    request: requestConfig,
    onSuccess,
    onError,
    invalidateKeys = [],
    optimisticData,
    populateCache = false,
    rollbackOnError = true,
    revalidate = true,
    throwOnError = true,
  } = options;

  // Wrap fetcher for useSWRMutation
  const swrMutationFetcher = useCallback(
    async (_key: string, { arg }: { arg: TVariables }): Promise<TData> => {
      const fetchConfig: SWRKitRequestConfig = mergeConfigs(
        { url, method, data: arg },
        requestConfig,
      );

      const response = await contextFetcher<TData>(fetchConfig);

      if (!response.ok) {
        const error = response.originalError || new Error('Mutation failed');
        (error as any).response = response;
        throw error;
      }

      return response.data as TData;
    },
    [url, method, requestConfig, contextFetcher],
  );

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    url,
    swrMutationFetcher,
    {
      optimisticData,
      populateCache,
      rollbackOnError,
      revalidate,
      throwOnError,
      onSuccess: async (data, key) => {
        // Invalidate specified keys
        if (invalidateKeys.length > 0) {
          await Promise.all(invalidateKeys.map((k) => globalMutate(k)));
        }
        // Call user callback
        if (onSuccess) {
          await onSuccess(data as TData, key as TVariables);
        }
      },
      onError: async (err, key) => {
        if (onError) {
          await onError(err, key as TVariables);
        }
      },
    },
  );

  // Extract problem code from error
  const responseData = error ? extractResponseFromError(error) : null;
  const problem = responseData?.problem || null;

  // Wrap trigger to support override config
  const wrappedTrigger = useCallback(
    async (
      variables: TVariables,
      overrideConfig?: Partial<SWRKitRequestConfig>,
    ): Promise<SWRKitResponse<TData>> => {
      // If override config provided, bypass SWR and call fetcher directly
      if (overrideConfig) {
        const mergedConfig = mergeConfigs(
          { url, method, data: variables },
          requestConfig,
          overrideConfig,
        );
        const response = await contextFetcher<TData>(mergedConfig);
        return response;
      }

      // Use SWR mutation
      try {
        // Type cast to bypass union type issues
        const triggerFn = trigger as (arg: TVariables) => Promise<TData>;
        const result = await triggerFn(variables);

        // Return SWRKitResponse format
        return {
          ok: true,
          problem: null,
          originalError: null,
          data: result,
        } as SWRKitResponse<TData>;
      } catch (error) {
        // Extract response from error
        const responseData = extractResponseFromError(error);
        if (responseData) {
          return responseData as SWRKitResponse<TData>;
        }
        throw error;
      }
    },
    [trigger, url, method, requestConfig, contextFetcher],
  );

  return {
    trigger: wrappedTrigger,
    isMutating,
    data: data as TData | undefined,
    error,
    problem,
    reset,
  };
}

/**
 * Hook for infinite scroll / pagination
 *
 * @template T - The expected data type for each page
 *
 * @param options - Configuration options including getKey function
 *
 * @returns Object containing data array, loading states, and loadMore function
 *
 * @example
 * const { data, loadMore, hasMore, isLoadingMore } = useInfiniteScroll<User[]>({
 *   getKey: (pageIndex, previousPageData) => {
 *     if (previousPageData && previousPageData.length === 0) return null;
 *     return `/api/users?page=${pageIndex + 1}&limit=20`;
 *   },
 *   pageSize: 20,
 * });
 */
export function useInfiniteScroll<T = any>(
  options: UseInfiniteScrollOptions<T>,
): UseInfiniteScrollReturn<T> {
  const { fetcher: contextFetcher } = useSWRKitContext();
  const {
    getKey,
    swr: swrConfig,
    request: requestConfig,
    pageSize = 10,
  } = options;

  // Create fetcher for each page
  const fetcher = useCallback(
    async (key: string): Promise<T> => {
      // Extract URL from key (getKey should return full URL with params)
      const fetchConfig: SWRKitRequestConfig = mergeConfigs(
        {
          url: key,
          method: 'GET',
        },
        requestConfig,
      );

      const response = await contextFetcher<T>(fetchConfig);
      return response.data as T;
    },
    [requestConfig, contextFetcher],
  );

  // Use SWR infinite
  const { data, error, size, setSize, isValidating, mutate, isLoading } =
    useSWRInfinite<T, Error>(getKey, fetcher, swrConfig);

  // Calculate if there are more pages
  const hasMore = useMemo(() => {
    if (!data) return false;
    const lastPage = data[data.length - 1];

    // If last page is empty or has fewer items than pageSize, no more pages
    if (!lastPage) return false;
    if (Array.isArray(lastPage)) {
      return lastPage.length >= pageSize;
    }

    // For paginated responses with metadata
    if (typeof lastPage === 'object' && 'data' in lastPage) {
      const items = (lastPage as any).data;
      return Array.isArray(items) && items.length >= pageSize;
    }

    return true;
  }, [data, pageSize]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!isValidating && hasMore) {
      setSize(size + 1);
    }
  }, [isValidating, hasMore, size, setSize]);

  // Check if loading more
  const isLoadingMore = useMemo(() => {
    return isValidating && !!data && data.length > 0;
  }, [isValidating, data]);

  // Refresh all pages
  const refresh = useCallback(async () => {
    return mutate();
  }, [mutate]);

  return {
    data,
    isLoading: isLoading || (!data && !error),
    isValidating,
    error,
    loadMore,
    hasMore,
    isLoadingMore,
    refresh,
    size,
  };
}

/**
 * Imperative function to mutate cache
 *
 * @param key - Cache key to mutate
 * @param data - New data or function to update data
 * @param shouldRevalidate - Whether to revalidate after mutation
 *
 * @example
 * // Update cache imperatively
 * await mutate('/api/user/123', updatedUser);
 *
 * @example
 * // Invalidate cache (trigger revalidation)
 * await mutate('/api/user/123');
 */
export function mutate(
  key: CacheKey,
  data?: any,
  shouldRevalidate = true,
): Promise<any> {
  return globalMutate(key, data, shouldRevalidate);
}

/**
 * Preload data for a key
 *
 * Note: This function requires a fetcher. Use useSWRKitPreload() hook
 * for automatic fetcher integration.
 *
 * @param key - Cache key to preload
 * @param params - Query parameters
 * @param fetcher - Fetcher function
 *
 * @example
 * const fetcher = useSWRKitFetcher();
 * await preload('/api/user/123', undefined, fetcher);
 */
export async function preload<T = any>(
  key: CacheKey,
  params?: Record<string, any>,
  fetcher?: (config: SWRKitRequestConfig) => Promise<SWRKitResponse<T>>,
): Promise<void> {
  if (!fetcher) {
    throw new Error(
      'Fetcher is required for preload. Use useSWRKitPreload() hook to get one.',
    );
  }

  const cacheKey = buildCacheKey(key, params);
  if (!cacheKey) return;

  const url = extractUrlFromKey(cacheKey);
  if (!url) return;

  const fetchConfig: SWRKitRequestConfig = {
    url,
    method: 'GET',
    params,
  };

  const response = await fetcher(fetchConfig);

  if (response.ok && response.data) {
    await globalMutate(cacheKey, response.data, false);
  }
}
