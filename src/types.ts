import type {
  SWRConfiguration,
  SWRResponse,
  Middleware,
} from 'swr';
import type { PROBLEM_CODE } from '@mshindi-labs/refetch';

/**
 * HTTP methods supported by SWRKit
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

/**
 * Cache key types supported by SWR
 */
export type CacheKey =
  | string
  | readonly unknown[]
  | Record<string, any>
  | null
  | undefined;

/**
 * Standardized API response (compatible with refetch)
 */
export interface SWRKitResponse<T> {
  /**
   * Whether the request was successful
   */
  ok: boolean;

  /**
   * The problem type (if any)
   */
  problem: PROBLEM_CODE | null;

  /**
   * The original error (if any)
   */
  originalError: Error | null;

  /**
   * Response data (if successful)
   */
  data?: T;

  /**
   * HTTP status code
   */
  status?: number;

  /**
   * Response headers
   */
  headers?: Record<string, string>;

  /**
   * Request duration in milliseconds
   */
  duration?: number;
}

/**
 * Request configuration for SWRKit
 */
export interface SWRKitRequestConfig {
  /**
   * Request URL (relative to baseURL if set)
   */
  url?: string;

  /**
   * HTTP method
   */
  method?: HttpMethod;

  /**
   * Request parameters (for query string)
   */
  params?: Record<string, any>;

  /**
   * Request body data
   */
  data?: any;

  /**
   * Request headers
   */
  headers?: HeadersInit;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Additional fetch options
   */
  options?: RequestInit;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /**
   * Cookie name for access token
   */
  accessTokenCookie?: string;

  /**
   * Header name for authorization (default: 'Authorization')
   */
  authHeader?: string;

  /**
   * Token prefix (e.g., 'Bearer')
   */
  tokenPrefix?: string;

  /**
   * Whether to automatically add auth token from cookies (default: true)
   */
  autoAuth?: boolean;
}

/**
 * SWRKit configuration
 */
export interface SWRKitConfig {
  /**
   * Base URL for all requests
   */
  baseURL?: string;

  /**
   * Default headers for all requests
   */
  headers?: HeadersInit;

  /**
   * Default timeout in milliseconds
   */
  timeout?: number;

  /**
   * Authentication configuration
   */
  auth?: AuthConfig;

  /**
   * SWR configuration options
   */
  swr?: SWRConfiguration;

  /**
   * Request transforms
   */
  requestTransforms?: Array<RequestTransform | AsyncRequestTransform>;

  /**
   * Response transforms
   */
  responseTransforms?: Array<ResponseTransform | AsyncResponseTransform>;

  /**
   * Monitors for observing responses
   */
  monitors?: Monitor[];

  /**
   * Custom fetcher function
   */
  fetcher?: Fetcher;
}

/**
 * Synchronous request transform
 */
export type RequestTransform = (config: SWRKitRequestConfig) => void;

/**
 * Asynchronous request transform
 */
export type AsyncRequestTransform = (
  config: SWRKitRequestConfig,
) => Promise<void>;

/**
 * Synchronous response transform
 */
export type ResponseTransform = <T>(response: SWRKitResponse<T>) => void;

/**
 * Asynchronous response transform
 */
export type AsyncResponseTransform = <T>(
  response: SWRKitResponse<T>,
) => Promise<void>;

/**
 * Monitor function for observing API responses
 */
export type Monitor = <T>(response: SWRKitResponse<T>) => void;

/**
 * Fetcher function type
 */
export type Fetcher = <T = any>(
  config: SWRKitRequestConfig,
) => Promise<SWRKitResponse<T>>;

/**
 * Hook options for useFetch
 */
export interface UseFetchOptions<T = any> {
  /**
   * SWR configuration (for advanced options)
   */
  swr?: SWRConfiguration<T>;

  /**
   * Request configuration
   */
  request?: Omit<SWRKitRequestConfig, 'url'>;

  /**
   * Query parameters
   */
  params?: Record<string, any>;

  /**
   * Skip the request (conditional fetching)
   */
  skip?: boolean;

  // Convenience options (passed through to SWR)

  /**
   * Initial data to use before first fetch completes
   */
  fallbackData?: T;

  /**
   * Keep previous data while revalidating with new key
   */
  keepPreviousData?: boolean;

  /**
   * Enable React Suspense mode
   */
  suspense?: boolean;

  /**
   * Auto-revalidate even with existing stale data
   */
  revalidateIfStale?: boolean;

  /**
   * Enable/disable revalidation on component mount
   */
  revalidateOnMount?: boolean;

  /**
   * Polling interval in milliseconds or dynamic function
   */
  refreshInterval?: number | ((data?: T) => number);

  /**
   * Allow polling when window is hidden
   */
  refreshWhenHidden?: boolean;

  /**
   * Allow polling when offline
   */
  refreshWhenOffline?: boolean;

  /**
   * Auto-retry failed requests
   */
  shouldRetryOnError?: boolean;

  /**
   * Milliseconds between retry attempts
   */
  errorRetryInterval?: number;

  /**
   * Maximum retry attempts allowed
   */
  errorRetryCount?: number;

  /**
   * Custom error retry handler
   */
  onErrorRetry?: (
    error: Error,
    key: string,
    config: SWRConfiguration<T>,
    revalidate: any,
    revalidateOpts: any,
  ) => void;

  /**
   * Custom data comparison function
   */
  compare?: (a: T | undefined, b: T | undefined) => boolean;

  /**
   * Function to conditionally pause revalidations
   */
  isPaused?: () => boolean;

  /**
   * Array of middleware functions
   */
  use?: Middleware[];

  /**
   * Threshold for slow-load event (default: 3000ms)
   */
  loadingTimeout?: number;

  /**
   * Triggers when request exceeds loadingTimeout
   */
  onLoadingSlow?: (key: string, config: SWRConfiguration<T>) => void;

  /**
   * Fires when request completes successfully
   */
  onSuccess?: (data: T, key: string, config: SWRConfiguration<T>) => void;

  /**
   * Fires when request fails
   */
  onError?: (err: Error, key: string, config: SWRConfiguration<T>) => void;

  /**
   * Fires when request is ignored due to race conditions
   */
  onDiscarded?: (key: string) => void;
}

/**
 * Return type for useFetch hook
 */
export interface UseFetchReturn<T> extends Omit<SWRResponse<T>, 'data'> {
  /**
   * Response data
   */
  data: T | undefined;

  /**
   * Whether the request is loading
   */
  isLoading: boolean;

  /**
   * Whether the request is validating
   */
  isValidating: boolean;

  /**
   * Error object
   */
  error: Error | undefined;

  /**
   * Problem code (if any)
   */
  problem: PROBLEM_CODE | null;

  /**
   * HTTP status code
   */
  status?: number;

  /**
   * Response headers
   */
  headers?: Record<string, string>;

  /**
   * Mutate function to update cache
   */
  mutate: SWRResponse<T>['mutate'];
}

/**
 * Options for useMutation hook
 */
export interface UseMutationOptions<TData = any, TVariables = any> {
  /**
   * Request URL
   */
  url: string;

  /**
   * HTTP method
   */
  method?: Exclude<HttpMethod, 'GET' | 'HEAD'>;

  /**
   * Request configuration
   */
  request?: Omit<SWRKitRequestConfig, 'url' | 'method' | 'data'>;

  /**
   * Success callback
   */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;

  /**
   * Error callback
   */
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;

  /**
   * Keys to invalidate after successful mutation
   */
  invalidateKeys?: string[];

  /**
   * Immediate UI update before server confirmation
   */
  optimisticData?: TData | ((currentData?: TData) => TData);

  /**
   * Update cache with mutation response (default: false)
   */
  populateCache?: boolean | ((result: TData, currentData?: TData) => TData);

  /**
   * Revert optimistic changes on failure (default: true)
   */
  rollbackOnError?: boolean;

  /**
   * Refetch data after mutation completes (default: true)
   */
  revalidate?: boolean;

  /**
   * Propagate errors to caller (default: true)
   */
  throwOnError?: boolean;
}

/**
 * Return type for useMutation hook
 */
export interface UseMutationReturn<TData = any, TVariables = any> {
  /**
   * Trigger the mutation
   */
  trigger: (
    variables: TVariables,
    options?: Partial<SWRKitRequestConfig>,
  ) => Promise<SWRKitResponse<TData>>;

  /**
   * Whether the mutation is in progress
   */
  isMutating: boolean;

  /**
   * Last mutation response data
   */
  data: TData | undefined;

  /**
   * Last mutation error
   */
  error: Error | undefined;

  /**
   * Problem code from last mutation
   */
  problem: PROBLEM_CODE | null;

  /**
   * Reset mutation state
   */
  reset: () => void;
}

/**
 * Options for useInfiniteScroll hook
 */
export interface UseInfiniteScrollOptions<T = any> {
  /**
   * Function to get the next page key
   */
  getKey: (pageIndex: number, previousPageData: T | null) => string | null;

  /**
   * SWR infinite configuration
   */
  swr?: SWRConfiguration;

  /**
   * Request configuration
   */
  request?: Omit<SWRKitRequestConfig, 'url'>;

  /**
   * Initial page size
   */
  pageSize?: number;
}

/**
 * Return type for useInfiniteScroll hook
 */
export interface UseInfiniteScrollReturn<T> {
  /**
   * Array of all pages data
   */
  data: T[] | undefined;

  /**
   * Whether the first page is loading
   */
  isLoading: boolean;

  /**
   * Whether any page is validating
   */
  isValidating: boolean;

  /**
   * Error object
   */
  error: Error | undefined;

  /**
   * Load the next page
   */
  loadMore: () => void;

  /**
   * Whether there are more pages to load
   */
  hasMore: boolean;

  /**
   * Whether loading more pages
   */
  isLoadingMore: boolean;

  /**
   * Refresh all pages
   */
  refresh: () => Promise<any>;

  /**
   * Total number of pages loaded
   */
  size: number;
}
