# SWRKit

A powerful, apisauce-inspired wrapper around SWR for standardized API data fetching in React/Next.js applications.

## Features

- **Automatic Authentication**: Automatically reads access tokens from cookies and adds to headers
- **Standardized Response Format**: Consistent response structure across all API calls
- **Error Classification**: Automatic error categorization (client, server, network, timeout)
- **Request/Response Transforms**: Modify requests and responses with middleware
- **Monitors**: Observe all API responses for logging and analytics
- **Context Provider**: Shared configuration across your entire app
- **TypeScript First**: Full type safety with generics
- **SWR Powered**: Built on top of SWR for optimal caching and revalidation
- **Multiple Hooks**: `useFetch`, `useMutation`, `useInfiniteScroll`
- **Cookie Utilities**: Helper functions for cookie management
- **Compatible with Refetch**: Uses the same error codes and response format

## Installation

Install SWRKit using your preferred package manager:

```bash
# npm
npm install @mshindi-labs/swrkit

# yarn
yarn add @mshindi-labs/swrkit

# pnpm
pnpm add @mshindi-labs/swrkit

# bun
bun add @mshindi-labs/swrkit
```

**Peer Dependencies:**

SWRKit requires the following peer dependencies:

```bash
# npm
npm install swr react react-dom

# yarn
yarn add swr react react-dom

# pnpm
pnpm add swr react react-dom

# bun
bun add swr react react-dom
```

## Quick Start

### 1. Wrap Your App with the Provider

```tsx
// app/layout.tsx or _app.tsx
import { SWRKitProvider } from '@/lib/swrkit';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRKitProvider
      config={{
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }}
    >
      {children}
    </SWRKitProvider>
  );
}
```

### 2. Use the Hooks in Your Components

```tsx
import { useFetch, useMutation } from '@/lib/swrkit';

// GET request
function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error, problem } = useFetch<User>(`/users/${userId}`);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {problem}</div>;

  return <div>Hello, {data?.name}!</div>;
}

// POST request
function CreateUserForm() {
  const { trigger, isMutating } = useMutation<User, CreateUserData>({
    url: '/users',
    method: 'POST',
    onSuccess: (data) => console.log('User created:', data),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await trigger({ name: 'John', email: 'john@example.com' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={isMutating}>
        {isMutating ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

## Automatic Authentication

SWRKit automatically reads access tokens from cookies and adds them to request headers. No manual configuration needed!

### Default Behavior

By default, SWRKit will:
1. Read the `access_token` cookie
2. Add it to the `Authorization` header with `Bearer` prefix
3. Apply to all requests automatically

```tsx
// Just wrap your app - authentication is automatic!
<SWRKitProvider
  config={{
    baseURL: process.env.NEXT_PUBLIC_API_URL,
  }}
>
  {children}
</SWRKitProvider>

// All requests will automatically include:
// Authorization: Bearer <token-from-cookie>
```

### Custom Auth Configuration

Customize the authentication behavior:

```tsx
<SWRKitProvider
  config={{
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    auth: {
      // Custom cookie name (default: 'access_token')
      accessTokenCookie: 'my_auth_token',

      // Custom header name (default: 'Authorization')
      authHeader: 'X-Auth-Token',

      // Custom token prefix (default: 'Bearer')
      tokenPrefix: 'Token',

      // Disable automatic auth (default: true)
      autoAuth: true,
    },
  }}
>
  {children}
</SWRKitProvider>
```

### Disable Auto Auth

If you want to handle authentication manually:

```tsx
<SWRKitProvider
  config={{
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    auth: {
      autoAuth: false,  // Disable automatic auth
    },
    requestTransforms: [
      // Add your custom auth logic
      (config) => {
        const token = getCustomToken();
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
      },
    ],
  }}
>
  {children}
</SWRKitProvider>
```

### Cookie Utilities

SWRKit provides SSR-safe cookie utilities using `cookies-next`:

```tsx
import {
  getCookie,
  setCookie,
  deleteCookie,
  getAccessToken,
  getRefreshToken
} from '@/lib/swrkit';

// Get any cookie (works in both client and server)
const value = getCookie('my_cookie');

// Set a cookie
setCookie('my_cookie', 'value', {
  days: 7,              // Automatically converted to maxAge
  path: '/',
  secure: true,
  sameSite: 'strict',   // lowercase for cookies-next compatibility
  httpOnly: false,      // Only works server-side
});

// Delete a cookie
deleteCookie('my_cookie');

// Get auth tokens
const accessToken = getAccessToken();  // default: 'access_token' cookie
const refreshToken = getRefreshToken();  // default: 'refresh_token' cookie

// With custom cookie names
const customToken = getAccessToken('custom_token_name');
```

**Note**: These utilities are SSR-compatible and work in both client and server components thanks to `cookies-next`.

### Auth Config Interface

```tsx
interface AuthConfig {
  // Cookie name for access token (default: 'access_token')
  accessTokenCookie?: string;

  // Header name for authorization (default: 'Authorization')
  authHeader?: string;

  // Token prefix (default: 'Bearer')
  tokenPrefix?: string;

  // Enable automatic auth from cookies (default: true)
  autoAuth?: boolean;
}
```

### Example: Login Flow

```tsx
import { setCookie, useMutation } from '@/lib/swrkit';

function LoginForm() {
  const { trigger, isMutating } = useMutation<{ token: string }, LoginData>({
    url: '/auth/login',
    method: 'POST',
    onSuccess: (data) => {
      // Save token to cookie
      setCookie('access_token', data.token, {
        days: 7,
        secure: true,
        sameSite: 'strict',  // lowercase for cookies-next
      });

      // All subsequent requests will now include the token automatically!
      router.push('/dashboard');
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      trigger({ email, password });
    }}>
      <button disabled={isMutating}>Login</button>
    </form>
  );
}
```

### Example: Logout Flow

```tsx
import { deleteCookie, mutate } from '@/lib/swrkit';

function LogoutButton() {
  const handleLogout = () => {
    // Delete the token cookie
    deleteCookie('access_token');

    // Clear all SWR cache
    mutate(() => true, undefined, { revalidate: false });

    // Redirect to login
    router.push('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

## Core Hooks

### `useFetch<T>` - GET Requests

The main hook for fetching data with automatic caching and revalidation.

```tsx
const { data, isLoading, error, problem, mutate } = useFetch<User>(
  '/users/1',
  {
    params: { include: 'posts' },
    swr: {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  }
);
```

**Parameters:**
- `url` (string | null): The API endpoint (null to skip fetching)
- `options` (UseFetchOptions): Configuration options

**Returns:**
- `data`: Response data (typed)
- `isLoading`: Whether the initial load is happening
- `isValidating`: Whether a revalidation is happening
- `error`: Error object if request failed
- `problem`: Problem code (PROBLEM_CODE enum)
- `status`: HTTP status code
- `headers`: Response headers
- `mutate`: Function to manually update the cache

**Options:**

```tsx
interface UseFetchOptions<T> {
  swr?: SWRConfiguration<T>;  // SWR-specific config
  request?: SWRKitRequestConfig;  // Request config
  params?: Record<string, any>;  // Query parameters
  skip?: boolean;  // Skip the request conditionally
}
```

### `useMutation<TData, TVariables>` - POST/PUT/PATCH/DELETE

Hook for data mutations with automatic cache invalidation.

```tsx
const { trigger, isMutating, data, error, problem, reset } = useMutation<
  User,
  UpdateUserData
>({
  url: '/users/1',
  method: 'PUT',
  onSuccess: (data, variables) => {
    console.log('Updated:', data);
  },
  onError: (error, variables) => {
    console.error('Failed:', error);
  },
  invalidateKeys: ['/users', '/users/1'],
});

// Trigger the mutation
await trigger({ name: 'Jane Doe' });
```

**Parameters:**
- `options` (UseMutationOptions): Mutation configuration

**Options:**

```tsx
interface UseMutationOptions<TData, TVariables> {
  url: string;  // API endpoint
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';  // HTTP method
  request?: SWRKitRequestConfig;  // Additional config
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;
  invalidateKeys?: string[];  // Keys to revalidate on success
}
```

**Returns:**
- `trigger`: Function to trigger the mutation
- `isMutating`: Whether mutation is in progress
- `data`: Last successful mutation data
- `error`: Last mutation error
- `problem`: Problem code from last mutation
- `reset`: Reset mutation state

### `useInfiniteScroll<T>` - Pagination

Hook for infinite scrolling and pagination.

```tsx
const { data, isLoading, loadMore, hasMore, isLoadingMore } = useInfiniteScroll<User>({
  getKey: (pageIndex, previousPageData) => {
    if (previousPageData && previousPageData.length === 0) return null;
    return `/users?page=${pageIndex + 1}&limit=20`;
  },
  pageSize: 20,
});

// Load more when scrolling
<button onClick={loadMore} disabled={!hasMore || isLoadingMore}>
  {isLoadingMore ? 'Loading...' : 'Load More'}
</button>
```

**Options:**

```tsx
interface UseInfiniteScrollOptions<T> {
  getKey: (pageIndex: number, previousPageData: T | null) => string | null;
  swr?: SWRConfiguration;
  request?: SWRKitRequestConfig;
  pageSize?: number;
}
```

**Returns:**
- `data`: Array of all pages
- `isLoading`: Whether first page is loading
- `isValidating`: Whether any page is validating
- `error`: Error object
- `loadMore`: Function to load next page
- `hasMore`: Whether there are more pages
- `isLoadingMore`: Whether loading additional pages
- `refresh`: Refresh all pages
- `size`: Number of pages loaded

## Advanced Features

### Request Transforms

Modify requests before they're sent (e.g., add authentication):

```tsx
import { SWRKitProvider, useSWRKitContext } from '@/lib/swrkit';

// In provider setup
<SWRKitProvider
  config={{
    baseURL: 'https://api.example.com',
    requestTransforms: [
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
      },
    ],
  }}
>
  {children}
</SWRKitProvider>

// Or add dynamically in components
function App() {
  const { addRequestTransform } = useSWRKitContext();

  useEffect(() => {
    addRequestTransform(async (config) => {
      const token = await getAuthToken();
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    });
  }, [addRequestTransform]);

  return <YourApp />;
}
```

### Response Transforms

Modify responses after they're received:

```tsx
<SWRKitProvider
  config={{
    responseTransforms: [
      (response) => {
        // Transform snake_case to camelCase
        if (response.ok && response.data) {
          response.data = transformKeys(response.data, camelCase);
        }
      },
    ],
  }}
>
  {children}
</SWRKitProvider>
```

### Monitors

Observe all API responses for logging, analytics, or error tracking:

```tsx
<SWRKitProvider
  config={{
    monitors: [
      // Logging monitor
      (response) => {
        console.log('API Response:', {
          url: response.data,
          status: response.status,
          problem: response.problem,
          duration: response.duration,
        });
      },

      // Error tracking monitor
      (response) => {
        if (!response.ok) {
          trackError({
            type: response.problem,
            error: response.originalError,
            status: response.status,
          });
        }
      },

      // Performance monitoring
      (response) => {
        if (response.duration && response.duration > 3000) {
          console.warn('Slow request detected:', response.duration);
        }
      },
    ],
  }}
>
  {children}
</SWRKitProvider>
```

### Dynamic Configuration

Update configuration at runtime:

```tsx
function Settings() {
  const { setHeader, setBaseURL, addMonitor } = useSWRKitContext();

  const updateApiKey = (apiKey: string) => {
    setHeader('X-API-Key', apiKey);
  };

  const switchEnvironment = (env: 'prod' | 'dev') => {
    setBaseURL(env === 'prod'
      ? 'https://api.example.com'
      : 'https://dev-api.example.com'
    );
  };

  return (
    <div>
      <button onClick={() => updateApiKey('new-key')}>Update API Key</button>
      <button onClick={() => switchEnvironment('dev')}>Switch to Dev</button>
    </div>
  );
}
```

## Response Format

All responses follow a standardized format:

```tsx
interface SWRKitResponse<T> {
  ok: boolean;  // true if 200-299
  problem: PROBLEM_CODE | null;  // Error classification
  originalError: Error | null;  // Original error object
  data?: T;  // Response data
  status?: number;  // HTTP status code
  headers?: Record<string, string>;  // Response headers
  duration?: number;  // Request duration in ms
}
```

## Error Handling

### Problem Codes

```tsx
export enum PROBLEM_CODE {
  NONE = 'NONE',  // 200-299 (success)
  CLIENT_ERROR = 'CLIENT_ERROR',  // 400-499
  SERVER_ERROR = 'SERVER_ERROR',  // 500-599
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',  // Request timeout
  CONNECTION_ERROR = 'CONNECTION_ERROR',  // Cannot connect
  NETWORK_ERROR = 'NETWORK_ERROR',  // Network unavailable
  CANCEL_ERROR = 'CANCEL_ERROR',  // Request cancelled
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',  // Unknown error
}
```

### Error Handling Patterns

```tsx
const { data, error, problem } = useFetch<User>('/users/1');

// Check for specific errors
if (problem === PROBLEM_CODE.CLIENT_ERROR) {
  return <div>Client error (4xx)</div>;
}

if (problem === PROBLEM_CODE.SERVER_ERROR) {
  return <div>Server error (5xx)</div>;
}

if (problem === PROBLEM_CODE.NETWORK_ERROR) {
  return <div>No internet connection</div>;
}

// Or use switch
switch (problem) {
  case PROBLEM_CODE.TIMEOUT_ERROR:
    return <div>Request timed out. Please try again.</div>;
  case PROBLEM_CODE.CLIENT_ERROR:
    return <div>Invalid request</div>;
  default:
    return <div>Something went wrong</div>;
}
```

## Integration Patterns

### With TanStack Query

You can use both SWRKit and TanStack Query in the same app:

```tsx
// Use SWRKit for real-time data with auto-revalidation
const { data: liveData } = useFetch('/live-feed');

// Use TanStack Query for complex data fetching
const { data: complexData } = useQuery({
  queryKey: ['complex'],
  queryFn: () => fetchComplex(),
});
```

### With Next.js Server Components

```tsx
// Server Component (for initial data)
async function UserPage({ params }: { params: { id: string } }) {
  const initialData = await fetch(`/api/users/${params.id}`).then(r => r.json());

  return <UserClient userId={params.id} initialData={initialData} />;
}

// Client Component (with SWR for real-time updates)
'use client';
function UserClient({ userId, initialData }: Props) {
  const { data = initialData } = useFetch<User>(`/users/${userId}`);

  return <div>{data.name}</div>;
}
```

### Conditional Fetching

```tsx
function UserPosts({ userId }: { userId: string | null }) {
  // Fetch only when userId is available
  const { data } = useFetch<Post[]>(
    userId ? `/users/${userId}/posts` : null
  );

  // Or use skip option
  const { data: data2 } = useFetch<Post[]>('/posts', {
    skip: !userId,
  });

  return <PostList posts={data} />;
}
```

### Dependent Queries

```tsx
function UserWithPosts({ userId }: { userId: string }) {
  // First fetch user
  const { data: user } = useFetch<User>(`/users/${userId}`);

  // Then fetch posts only when user is loaded
  const { data: posts } = useFetch<Post[]>(
    user ? `/users/${user.id}/posts` : null
  );

  return (
    <div>
      <h1>{user?.name}</h1>
      <PostList posts={posts} />
    </div>
  );
}
```

### Optimistic Updates

```tsx
function LikeButton({ postId }: { postId: string }) {
  const { data, mutate } = useFetch<Post>(`/posts/${postId}`);
  const { trigger } = useMutation({
    url: `/posts/${postId}/like`,
    method: 'POST',
  });

  const handleLike = async () => {
    // Optimistically update UI
    mutate(
      (current) => current ? { ...current, liked: true, likes: current.likes + 1 } : current,
      false
    );

    // Send request
    await trigger({});

    // Revalidate
    mutate();
  };

  return (
    <button onClick={handleLike}>
      {data?.liked ? 'Unlike' : 'Like'} ({data?.likes})
    </button>
  );
}
```

### Cache Manipulation

```tsx
import { mutate } from '@/lib/swrkit';

// Update cache imperatively
await mutate('/users/1', updatedUser);

// Invalidate cache (trigger revalidation)
await mutate('/users/1');

// Update multiple keys
await Promise.all([
  mutate('/users'),
  mutate('/users/1'),
]);
```

### Preloading Data

```tsx
import { preload, useSWRKitFetcher } from '@/lib/swrkit';

function HomePage() {
  const fetcher = useSWRKitFetcher();

  const handleMouseEnter = () => {
    // Preload user profile before navigation
    preload('/users/1', undefined, fetcher);
  };

  return (
    <Link href="/users/1" onMouseEnter={handleMouseEnter}>
      View Profile
    </Link>
  );
}
```

## Configuration Options

### Provider Config

```tsx
interface SWRKitConfig {
  baseURL?: string;  // Base URL for all requests
  headers?: HeadersInit;  // Default headers
  timeout?: number;  // Default timeout (ms)
  swr?: SWRConfiguration;  // SWR config
  requestTransforms?: RequestTransform[];  // Request middleware
  responseTransforms?: ResponseTransform[];  // Response middleware
  monitors?: Monitor[];  // Response observers
  fetcher?: Fetcher;  // Custom fetcher function
}
```

### SWR Configuration

You can pass any SWR configuration through the provider:

```tsx
<SWRKitProvider
  config={{
    swr: {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      focusThrottleInterval: 5000,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      keepPreviousData: false,
    },
  }}
>
  {children}
</SWRKitProvider>
```

## Best Practices

1. **Use the Provider**: Always wrap your app with `SWRKitProvider`
2. **Type Your Responses**: Use generics for type safety
3. **Handle Errors Gracefully**: Use problem codes for consistent error handling
4. **Use Transforms**: Add auth tokens and transform data with transforms
5. **Monitor Performance**: Use monitors for logging and analytics
6. **Invalidate Smartly**: Use `invalidateKeys` in mutations to keep cache fresh
7. **Conditional Fetching**: Use `skip` or `null` URL for conditional requests
8. **Optimize Bundle**: Import only what you need

## TypeScript Types

```tsx
import type {
  SWRKitResponse,
  SWRKitConfig,
  UseFetchOptions,
  UseFetchReturn,
  UseMutationOptions,
  UseMutationReturn,
  PROBLEM_CODE,
} from '@/lib/swrkit';
```

## Why Use SWRKit?

SWRKit bridges the gap between the simplicity of SWR and the structure needed for production applications. Here's why you should use it:

### 1. Standardized API Response Format
Consistent error handling across your entire application with predictable response structures. No more guessing what shape errors will take.

```tsx
const { data, problem, status } = useFetch('/api/user');

// Always know what went wrong
if (problem === PROBLEM_CODE.CLIENT_ERROR) {
  // Handle 4xx errors
} else if (problem === PROBLEM_CODE.NETWORK_ERROR) {
  // Handle offline state
}
```

### 2. Automatic Authentication
Stop copying auth logic to every API call. SWRKit automatically reads tokens from cookies and adds them to headers.

```tsx
// Just wrap your app - authentication is automatic
<SWRKitProvider config={{ baseURL: process.env.NEXT_PUBLIC_API_URL }}>
  <App />
</SWRKitProvider>

// All requests automatically include: Authorization: Bearer <token>
```

### 3. Built-in Optimistic Updates
Update UI instantly, roll back on errors automatically. No manual state juggling.

```tsx
const { trigger } = useMutation({
  url: '/api/posts/123/like',
  method: 'POST',
  optimisticData: (current) => ({ ...current, liked: true, likes: current.likes + 1 }),
  rollbackOnError: true, // Automatically reverts on error
});
```

### 4. Powerful Middleware System
Extend functionality without modifying core code. Log requests, cache to localStorage, keep stale data visible - all with simple middleware.

```tsx
const { data } = useFetch('/api/user', {
  use: [
    laggyMiddleware(), // No loading spinners during revalidation
    loggerMiddleware(), // Debug all requests
    localStorageMiddleware({ key: 'user-cache' }), // Persist offline
  ],
});
```

### 5. Compatible with Refetch
Already using @mshindi-labs/refetch? SWRKit uses the same `PROBLEM_CODE` enum and response format, making migration seamless.

```tsx
// Refetch (imperative)
const response = await api.get('/users/1');

// SWRKit (declarative with automatic caching)
const { data } = useFetch('/users/1');
```

### 6. Production-Ready Features Out of the Box
- **TypeScript-first** - Full type safety with generics
- **Error classification** - CLIENT_ERROR, SERVER_ERROR, NETWORK_ERROR, TIMEOUT_ERROR
- **Request/response transforms** - Modify data at a global level
- **Monitors** - Track all API calls for analytics
- **Testing utilities** - Mock fetchers and test providers
- **WebSocket support** - `useSubscription` for real-time data
- **Infinite scroll** - `useInfiniteScroll` with automatic pagination

### 7. Better Developer Experience
- Comprehensive TypeScript types
- Detailed JSDoc documentation
- Built-in testing utilities
- Works seamlessly with Next.js App Router
- SWR DevTools support

### Who Should Use SWRKit?

**Perfect for:**
- Next.js applications needing standardized API patterns
- Teams wanting consistent error handling across the app
- Projects requiring automatic authentication
- Applications with real-time data requirements
- Codebases migrating from @mshindi-labs/refetch

**Consider alternatives if:**
- You need a non-React solution (SWR is React-only)
- You prefer imperative API calls over hooks
- Your app doesn't benefit from automatic revalidation

## Migration from Refetch

SWRKit is compatible with Refetch and uses the same problem codes:

```tsx
// Refetch
const response = await api.get<User>('/users/1');
if (response.ok) {
  console.log(response.data);
}

// SWRKit
const { data, problem } = useFetch<User>('/users/1');
if (!problem) {
  console.log(data);
}
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](https://github.com/swrkit/refetch/blob/main/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

MIT License - see [LICENSE](https://github.com/mshindi-labs/refetch/swrkit/main/LICENSE) file for details.
