import type { SWRConfiguration } from 'swr';
import type { SWRKitConfig } from './types';

/**
 * Default timeout in milliseconds (10 seconds)
 */
export const DEFAULT_TIMEOUT = 10000;

/**
 * Default headers
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
} as const;

/**
 * Default authentication configuration
 */
export const DEFAULT_AUTH_CONFIG = {
  /**
   * Cookie name for access token
   */
  accessTokenCookie: 'access_token',

  /**
   * Header name for authorization
   */
  authHeader: 'Authorization',

  /**
   * Token prefix (e.g., 'Bearer')
   */
  tokenPrefix: 'Bearer',

  /**
   * Whether to automatically add auth token from cookies
   */
  autoAuth: true,
} as const;

/**
 * Default SWR configuration
 */
export const DEFAULT_SWR_CONFIG: SWRConfiguration = {
  // Revalidate on window focus (default: true)
  revalidateOnFocus: true,

  // Revalidate on network reconnection (default: true)
  revalidateOnReconnect: true,

  // Dedupe requests with same key within this time window (default: 2000ms)
  dedupingInterval: 2000,

  // Cache time-to-live (default: 5 minutes)
  focusThrottleInterval: 5000,

  // Retry on error
  shouldRetryOnError: true,

  // Error retry count
  errorRetryCount: 3,

  // Error retry interval
  errorRetryInterval: 5000,

  // Keep previous data while revalidating
  keepPreviousData: false,
};

/**
 * Default SWRKit configuration
 */
export const DEFAULT_SWRKIT_CONFIG: SWRKitConfig = {
  headers: DEFAULT_HEADERS,
  timeout: DEFAULT_TIMEOUT,
  swr: DEFAULT_SWR_CONFIG,
  requestTransforms: [],
  responseTransforms: [],
  monitors: [],
};

/**
 * HTTP methods that should have a body
 */
export const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'] as const;

/**
 * HTTP methods for read operations
 */
export const READ_METHODS = ['GET', 'HEAD'] as const;

/**
 * HTTP methods for write operations
 */
export const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;
