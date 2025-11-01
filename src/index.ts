/**
 * SWRKit - A SWR wrapper for standardized API data fetching
 *
 * @example
 * ```tsx
 * import { SWRKitProvider, useFetch, useMutation } from '@mshindi-labs/swrkit';
 *
 * // Wrap your app with the provider
 * <SWRKitProvider config={{ baseURL: 'https://api.example.com' }}>
 *   <App />
 * </SWRKitProvider>
 *
 * // Use in components
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, isLoading, error } = useFetch<User>(`/users/${userId}`);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <div>Hello, {data?.name}!</div>;
 * }
 *
 * // Mutations with optimistic updates
 * function LikeButton({ postId }: { postId: string }) {
 *   const { trigger, isMutating } = useMutation<Post>({
 *     url: `/posts/${postId}/like`,
 *     method: 'POST',
 *     optimisticData: (current) => ({
 *       ...current,
 *       liked: true,
 *       likes: (current?.likes || 0) + 1,
 *     }),
 *     rollbackOnError: true,
 *   });
 *
 *   return (
 *     <button onClick={() => trigger({})} disabled={isMutating}>
 *       {isMutating ? 'Liking...' : 'Like'}
 *     </button>
 *   );
 * }
 * ```
 */

// Provider and context exports
export {
  SWRKitProvider,
  useSWRKitContext,
  useSWRKitConfig,
  useSWRKitFetcher,
  useSWRKitCache,
  useSWRKitPreload,
  useSWRKitMutate,
} from './context';

// Hook exports
export {
  useFetch,
  useMutation,
  useInfiniteScroll,
  mutate,
  preload,
} from './swrkit';

// Subscription exports
export { useSubscription } from './subscription';
export type { UseSubscriptionOptions, UseSubscriptionReturn } from './subscription';

// Middleware exports
export {
  laggyMiddleware,
  loggerMiddleware,
  timingMiddleware,
  retryMiddleware,
  localStorageMiddleware,
  dedupeMiddleware,
  conditionalMiddleware,
} from './middleware';

// Error class exports
export {
  SWRKitError,
  SWRKitClientError,
  SWRKitServerError,
  SWRKitNetworkError,
  SWRKitConnectionError,
  SWRKitTimeoutError,
  SWRKitCancelError,
  createErrorFromResponse,
} from './errors';

// Testing utility exports
export {
  createTestCache,
  SWRKitTestProvider,
  createMockFetcher,
  createDelayedMockFetcher,
  createTrackingMockFetcher,
  createFailingMockFetcher,
  createStatusMockFetcher,
} from './testing';

// Type exports
export type {
  HttpMethod,
  CacheKey,
  SWRKitResponse,
  SWRKitRequestConfig,
  SWRKitConfig,
  AuthConfig,
  RequestTransform,
  AsyncRequestTransform,
  ResponseTransform,
  AsyncResponseTransform,
  Monitor,
  Fetcher,
  UseFetchOptions,
  UseFetchReturn,
  UseMutationOptions,
  UseMutationReturn,
  UseInfiniteScrollOptions,
  UseInfiniteScrollReturn,
} from './types';

// Utility exports
export {
  buildCacheKey,
  mergeConfigs,
  extractResponseFromError,
  extractUrlFromKey,
  PROBLEM_CODE,
  classifyProblem,
  buildUrl,
} from './utils';

// Constant exports
export {
  DEFAULT_TIMEOUT,
  DEFAULT_HEADERS,
  DEFAULT_AUTH_CONFIG,
  DEFAULT_SWR_CONFIG,
  DEFAULT_SWRKIT_CONFIG,
  METHODS_WITH_BODY,
  READ_METHODS,
  WRITE_METHODS,
} from './constants';
