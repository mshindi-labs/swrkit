# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SWRKit is a TypeScript library that provides a powerful, apisauce-inspired wrapper around SWR for standardized API data fetching in React/Next.js applications. It depends on `@mshindi-labs/refetch` for HTTP utilities and error classification.

## Development Commands

### Build
```bash
npm run build
```
Uses `tsup` to build the library into both CommonJS (`dist/index.cjs`) and ESM (`dist/index.js`) formats with TypeScript declarations, sourcemaps, and minification.

### Prepare for Publishing
```bash
npm run prepublishOnly
```
Automatically runs the build before publishing.

### Test
Currently there are no tests configured (`npm test` will exit with an error).

## Architecture

### Core Files

- **`src/index.ts`**: Main entry point that exports all public APIs (hooks, types, utilities, constants)
- **`src/types.ts`**: TypeScript type definitions for all interfaces and types
- **`src/swrkit.ts`**: Core hooks implementation (`useFetch`, `useMutation`, `useInfiniteScroll`)
- **`src/context.tsx`**: React context provider (`SWRKitProvider`) and context hooks
- **`src/utils.ts`**: Utility functions for fetching, transforms, monitors, and cache key building
- **`src/constants.ts`**: Default configuration values and constants

### Key Design Patterns

#### Provider Architecture
The library uses a React Context provider pattern:
- `SWRKitProvider` wraps the application and provides shared configuration
- Configuration includes: `baseURL`, `headers`, `timeout`, `auth`, request/response transforms, monitors
- The provider automatically injects an auth transform as the first request transform when `getAccessToken` is provided
- Context can be accessed via `useSWRKitContext()`, `useSWRKitConfig()`, or `useSWRKitFetcher()`

#### Automatic Authentication
Authentication is handled automatically through request transforms:
- The provider creates an `authTransform` that runs before user-defined transforms
- It reads tokens via the `getAccessToken` callback (passed to provider)
- Tokens are automatically added to headers using configurable cookie name, header name, and token prefix
- Can be disabled by setting `auth.autoAuth: false` in config

#### Standardized Response Format
All API responses follow the `SWRKitResponse<T>` interface:
```typescript
{
  ok: boolean;           // true if 200-299
  problem: PROBLEM_CODE | null;  // Error classification from @mshindi-labs/refetch
  originalError: Error | null;
  data?: T;
  status?: number;
  headers?: Record<string, string>;
  duration?: number;     // Request duration in ms
}
```

#### Transform Pipeline
Request and response transforms are applied in sequence:
1. **Request Transforms**: Applied before fetch (auth transform runs first, then user transforms)
2. **Response Transforms**: Applied after fetch (both success and error responses)
3. **Monitors**: Read-only observers called after transforms (don't modify response)

The `createFetcher()` function orchestrates this pipeline.

#### Error Handling
- Errors are classified using `PROBLEM_CODE` from `@mshindi-labs/refetch`
- Response data is attached to errors via `(error as any).response` for access in hooks
- `extractResponseFromError()` retrieves the `SWRKitResponse` from thrown errors
- All hooks expose both `error` (Error object) and `problem` (PROBLEM_CODE) for flexible error handling

#### Cache Key Strategy
Cache keys are built by `buildCacheKey(url, params, method)`:
- For GET requests: combines URL + serialized sorted params
- For non-GET: prefixes with method (e.g., `POST:/users`)
- Used by SWR for cache management and deduplication

### Hook Implementations

#### `useFetch<T>`
- Wraps `useSWR` for GET requests
- Returns typed data with loading/error states and problem code
- Supports conditional fetching (null URL or `skip` option)
- Cache key automatically includes URL and query params

#### `useMutation<TData, TVariables>`
- Uses React state (not SWR mutation) for POST/PUT/PATCH/DELETE
- Provides `trigger()` function that accepts variables and optional config override
- Supports `onSuccess`/`onError` callbacks and automatic cache invalidation via `invalidateKeys`
- Returns `isMutating` state and last mutation `data`/`error`/`problem`

#### `useInfiniteScroll<T>`
- Wraps `useSWRInfinite` for pagination
- Uses `getKey` function to generate URL for each page
- Automatically detects `hasMore` based on response length vs `pageSize`
- Provides `loadMore()`, `refresh()`, and `isLoadingMore` state

### Dependencies on @mshindi-labs/refetch

SWRKit delegates low-level HTTP concerns to `@mshindi-labs/refetch`:
- `buildUrl()`: Constructs full URL from baseURL, path, and params
- `mergeHeaders()`: Merges multiple HeadersInit objects
- `fetchWithTimeout()`: Fetch with timeout support
- `parseResponseBody()`: Parses response based on Content-Type
- `prepareRequestBody()`: Serializes request body (JSON/FormData/etc)
- `classifyProblem()`: Converts HTTP status codes to PROBLEM_CODE enum
- `PROBLEM_CODE`: Enum for error types (CLIENT_ERROR, SERVER_ERROR, TIMEOUT_ERROR, etc)

## Configuration

### Build Configuration (tsup.config.ts)
- Entry: `src/index.ts`
- Outputs: CJS + ESM
- Features: TypeScript declarations, sourcemaps, minification, tree-shaking
- External dependencies: react, react-dom, swr, @mshindi-labs/refetch

### TypeScript Configuration
- Target: ES2020
- Module: ESNext with bundler resolution
- Strict mode enabled
- JSX: react-jsx transform

## Important Patterns

### Adding New Hooks
1. Define types in `src/types.ts` (options interface + return interface)
2. Implement hook in `src/swrkit.ts` using `useSWRKitContext()` to access fetcher
3. Use `buildCacheKey()` for cache keys and `mergeConfigs()` for config merging
4. Export from `src/index.ts`

### Extending Configuration
Dynamic config updates are available via context methods:
- `addRequestTransform()`, `addResponseTransform()`, `addMonitor()`
- `setHeader()`, `setHeaders()`, `deleteHeader()`
- `setBaseURL()`

Note: These methods update React state, which triggers fetcher recreation via `useMemo`.

### Error Handling Pattern
Hooks should extract response data from errors:
```typescript
const responseData = error ? extractResponseFromError(error) : null;
const problem = responseData?.problem || null;
```
This ensures problem codes are accessible even when the fetcher throws.

## Library Design Philosophy

- **Type Safety**: All hooks and utilities use TypeScript generics for type inference
- **Compatibility**: Uses same error codes and response format as @mshindi-labs/refetch for consistency
- **Flexibility**: Supports both provider-level and per-request configuration overrides
- **Observability**: Monitors provide non-invasive way to observe all API calls
- **React Best Practices**: Uses 'use client' directive for Next.js App Router compatibility
