# Changelog

## [1.0.0] - 2025-11-01

### Breaking Changes

#### `useMutation` now uses `useSWRMutation`
- **Before**: Custom React state implementation
- **After**: Native `useSWRMutation` from SWR
- **Migration**: API remains mostly compatible, but now supports `optimisticData`, `populateCache`, `rollbackOnError`, and `revalidate` options

```typescript
// Old (still works)
const { trigger } = useMutation({ url: '/api/data', method: 'POST' });

// New (with optimistic updates)
const { trigger } = useMutation({
  url: '/api/data',
  method: 'POST',
  optimisticData: (current) => ({ ...current, updated: true }),
  rollbackOnError: true,
});
```

#### `useFetch` key parameter now supports arrays and objects
- **Before**: Only string URLs
- **After**: Supports string, array, object, or function

```typescript
// Old (still works)
const { data } = useFetch('/api/user');

// New (multiple arguments)
const { data } = useFetch(['/api/user', userId, token]);

// New (object keys)
const { data } = useFetch({ url: '/api/orders', status: 'pending' });

// New (conditional fetching with function)
const { data } = useFetch(() => shouldFetch ? '/api/data' : null);
```

### New Features

#### Optimistic Updates
`useMutation` now supports built-in optimistic updates with automatic rollback on error.

```typescript
const { trigger } = useMutation<Post>({
  url: `/posts/${postId}/like`,
  method: 'POST',
  optimisticData: (current) => ({
    ...current,
    liked: true,
    likes: (current?.likes || 0) + 1,
  }),
  rollbackOnError: true,
  populateCache: true,
});
```

#### Middleware System
Expose SWR's middleware system with 7 built-in middleware options:

```typescript
import { useFetch, laggyMiddleware, loggerMiddleware } from '@mshindi-labs/swrkit';

const { data } = useFetch('/api/user', {
  use: [
    laggyMiddleware(), // Keep previous data during revalidation
    loggerMiddleware(), // Log all requests
  ],
});
```

**Built-in Middleware:**
- `laggyMiddleware()` - Keep previous data during revalidation
- `loggerMiddleware()` - Log requests, responses, and errors
- `timingMiddleware()` - Measure and warn on slow requests
- `retryMiddleware()` - Exponential backoff for failed requests
- `localStorageMiddleware()` - Persist cache to localStorage
- `dedupeMiddleware()` - Custom deduplication intervals
- `conditionalMiddleware()` - Conditional fetching based on predicate

#### Enhanced Error Handling
New typed error classes for better error handling:

```typescript
import { SWRKitClientError, SWRKitServerError } from '@mshindi-labs/swrkit';

const { error } = useFetch('/api/data');

if (error instanceof SWRKitClientError) {
  // Handle 4xx errors
} else if (error instanceof SWRKitServerError) {
  // Handle 5xx errors
}
```

**Error Classes:**
- `SWRKitError` - Base error class
- `SWRKitClientError` - 4xx errors
- `SWRKitServerError` - 5xx errors
- `SWRKitNetworkError` - Network errors
- `SWRKitConnectionError` - Connection errors
- `SWRKitTimeoutError` - Timeout errors
- `SWRKitCancelError` - Cancelled requests

#### WebSocket Subscriptions
New `useSubscription` hook for real-time data:

```typescript
import { useSubscription } from '@mshindi-labs/swrkit';

const { data, error } = useSubscription(
  'ws://localhost:3000/live',
  (key, { next }) => {
    const socket = new WebSocket(key);
    socket.addEventListener('message', (event) => next(null, event.data));
    socket.addEventListener('error', (event) => next(event.error));
    return () => socket.close();
  }
);
```

#### Testing Utilities
Comprehensive testing utilities for easy unit testing:

```typescript
import {
  createTestCache,
  SWRKitTestProvider,
  createMockFetcher,
  createTrackingMockFetcher,
} from '@mshindi-labs/swrkit';

// Isolated test environment
test('fetches user data', () => {
  const cache = createTestCache();
  const fetcher = createMockFetcher({
    '/api/user': { name: 'John' },
  });

  render(
    <SWRKitTestProvider cache={cache} config={{ fetcher }}>
      <UserProfile userId="123" />
    </SWRKitTestProvider>
  );
});

// Track requests
const { fetcher, requests } = createTrackingMockFetcher({
  '/api/user': { name: 'John' },
});

// After test
expect(requests).toHaveLength(1);
expect(requests[0].url).toBe('/api/user');
```

**Testing Utilities:**
- `createTestCache()` - Isolated cache for tests
- `SWRKitTestProvider` - Test wrapper component
- `createMockFetcher()` - Simple mock fetcher
- `createDelayedMockFetcher()` - Mock with delay
- `createTrackingMockFetcher()` - Track all requests
- `createFailingMockFetcher()` - Simulate failures
- `createStatusMockFetcher()` - Control HTTP status codes

#### Enhanced Context Hooks
New utility hooks for advanced use cases:

```typescript
import {
  useSWRKitCache,
  useSWRKitPreload,
  useSWRKitMutate,
} from '@mshindi-labs/swrkit';

// Access cache and mutate function
const { cache, mutate } = useSWRKitCache();

// Preload data on hover
const preload = useSWRKitPreload();
<Link onMouseEnter={() => preload('/api/data')}>Link</Link>

// Imperative cache mutation
const mutateCache = useSWRKitMutate();
await mutateCache('/api/user', updatedUser);
```

#### All SWR Options Exposed
`useFetch` now exposes all SWR configuration options directly:

```typescript
const { data } = useFetch('/api/user', {
  // All these are now available
  fallbackData: initialData,
  keepPreviousData: true,
  suspense: false,
  revalidateIfStale: true,
  revalidateOnMount: true,
  refreshInterval: 5000,
  refreshWhenHidden: false,
  refreshWhenOffline: false,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  onErrorRetry: (error, key, config, revalidate, opts) => {
    // Custom retry logic
  },
  compare: (a, b) => dequal(a, b),
  isPaused: () => !isOnline,
  use: [middleware1, middleware2],
  loadingTimeout: 3000,
  onLoadingSlow: (key) => console.log('Slow:', key),
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error),
  onDiscarded: (key) => console.log('Discarded:', key),
});
```

#### Suspense Support
Full support for React Suspense mode:

```typescript
const { data } = useFetch('/api/user', {
  suspense: true, // Component will suspend until data loads
});

// data is always present (never undefined) in Suspense mode
return <div>{data.name}</div>;
```

### Improvements

- **Performance**: Stable request config references prevent unnecessary re-renders
- **Type Safety**: Better TypeScript types and generics throughout
- **Documentation**: Comprehensive JSDoc comments on all exports
- **Bundle Size**: Efficient tree-shaking and code splitting
- **DX**: Better error messages and developer experience

### Deprecations

None. All existing APIs remain compatible.

### Under the Hood

- Replaced custom mutation state management with `useSWRMutation`
- Improved cache key generation to support SWR's native serialization
- Enhanced error handling with typed error classes
- Added middleware support for extensibility
- Improved memoization for better performance

---

## [1.0.0] - 2024-XX-XX

Initial release with:
- `useFetch` hook for GET requests
- `useMutation` hook for mutations
- `useInfiniteScroll` hook for pagination
- Automatic authentication
- Request/response transforms
- Monitors
- TypeScript support
