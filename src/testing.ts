import React from 'react';
import { SWRConfig } from 'swr';
import type { Cache } from 'swr';
import { SWRKitProvider } from './context';
import type {
  SWRKitConfig,
  SWRKitRequestConfig,
  SWRKitResponse,
  Fetcher,
} from './types';
import { PROBLEM_CODE } from '@mshindi-labs/refetch';

/**
 * Create an isolated cache for testing
 * Each test can have its own cache to avoid interference
 *
 * @example
 * const cache = createTestCache();
 */
export function createTestCache(): Cache {
  return new Map();
}

/**
 * Wrapper for testing SWRKit components
 * Provides isolated cache and configuration
 *
 * @example
 * import { render } from '@testing-library/react';
 *
 * test('fetches user data', () => {
 *   const cache = createTestCache();
 *   const { getByText } = render(
 *     <SWRKitTestProvider cache={cache}>
 *       <UserProfile userId="123" />
 *     </SWRKitTestProvider>
 *   );
 * });
 */
export function SWRKitTestProvider({
  children,
  cache = createTestCache(),
  config = {},
  getAccessToken,
}: {
  children: React.ReactNode;
  cache?: Cache;
  config?: Partial<SWRKitConfig>;
  getAccessToken?: (cookieName?: string) => string | null;
}) {
  return React.createElement(
    SWRConfig,
    {
      value: {
        provider: () => cache,
        dedupingInterval: 0, // Disable deduping for tests
      },
    },
    React.createElement(
      SWRKitProvider,
      { config, getAccessToken, children },
    ),
  );
}

/**
 * Create a mock fetcher for testing
 * Returns predefined responses for specific URLs
 *
 * @param responses - Map of URL to response data or error
 *
 * @example
 * const fetcher = createMockFetcher({
 *   '/api/user/123': { id: '123', name: 'John' },
 *   '/api/error': new Error('Not found'),
 * });
 */
export function createMockFetcher(
  responses: Record<string, any | Error>,
): Fetcher {
  return async (config: SWRKitRequestConfig): Promise<SWRKitResponse<any>> => {
    const url = config.url || '';
    const response = responses[url];

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    if (response instanceof Error) {
      return {
        ok: false,
        problem: PROBLEM_CODE.UNKNOWN_ERROR,
        originalError: response,
        data: undefined,
        status: 500,
        headers: {},
      };
    }

    return {
      ok: true,
      problem: null,
      originalError: null,
      data: response,
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    };
  };
}

/**
 * Create a mock fetcher with delay for testing loading states
 *
 * @param responses - Map of URL to response data or error
 * @param delay - Delay in milliseconds
 *
 * @example
 * const fetcher = createDelayedMockFetcher(
 *   { '/api/user': { name: 'John' } },
 *   1000
 * );
 */
export function createDelayedMockFetcher(
  responses: Record<string, any | Error>,
  delay: number,
): Fetcher {
  const baseFetcher = createMockFetcher(responses);

  return async (
    config: SWRKitRequestConfig,
  ): Promise<SWRKitResponse<any>> => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return baseFetcher(config);
  };
}

/**
 * Create a mock fetcher that tracks all requests
 * Useful for verifying that requests are made with correct parameters
 *
 * @param responses - Map of URL to response data or error
 *
 * @example
 * const { fetcher, requests } = createTrackingMockFetcher({
 *   '/api/user': { name: 'John' },
 * });
 *
 * // After test
 * expect(requests).toHaveLength(1);
 * expect(requests[0].url).toBe('/api/user');
 */
export function createTrackingMockFetcher(responses: Record<
  string,
  any | Error
>): {
  fetcher: Fetcher;
  requests: SWRKitRequestConfig[];
  clearRequests: () => void;
} {
  const requests: SWRKitRequestConfig[] = [];
  const baseFetcher = createMockFetcher(responses);

  const fetcher: Fetcher = async (
    config: SWRKitRequestConfig,
  ): Promise<SWRKitResponse<any>> => {
    requests.push({ ...config });
    return baseFetcher(config);
  };

  return {
    fetcher,
    requests,
    clearRequests: () => {
      requests.length = 0;
    },
  };
}

/**
 * Create a mock fetcher that fails after N successful requests
 * Useful for testing error recovery and retry logic
 *
 * @param successData - Data to return on success
 * @param failAfter - Number of successful requests before failing
 *
 * @example
 * const fetcher = createFailingMockFetcher({ name: 'John' }, 2);
 * // First 2 requests succeed, subsequent requests fail
 */
export function createFailingMockFetcher(
  successData: any,
  failAfter: number,
): Fetcher {
  let requestCount = 0;

  return async (
    config: SWRKitRequestConfig,
  ): Promise<SWRKitResponse<any>> => {
    requestCount++;

    await new Promise((resolve) => setTimeout(resolve, 10));

    if (requestCount > failAfter) {
      return {
        ok: false,
        problem: PROBLEM_CODE.SERVER_ERROR,
        originalError: new Error('Mock error'),
        data: undefined,
        status: 500,
        headers: {},
      };
    }

    return {
      ok: true,
      problem: null,
      originalError: null,
      data: successData,
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    };
  };
}

/**
 * Create a mock fetcher with HTTP status code control
 * Useful for testing different HTTP status scenarios
 *
 * @param responses - Map of URL to response with status
 *
 * @example
 * const fetcher = createStatusMockFetcher({
 *   '/api/success': { status: 200, data: { name: 'John' } },
 *   '/api/not-found': { status: 404, data: null },
 *   '/api/error': { status: 500, data: null },
 * });
 */
export function createStatusMockFetcher(responses: Record<
  string,
  { status: number; data: any | null }
>): Fetcher {
  return async (config: SWRKitRequestConfig): Promise<SWRKitResponse<any>> => {
    const url = config.url || '';
    const response = responses[url];

    await new Promise((resolve) => setTimeout(resolve, 10));

    if (!response) {
      return {
        ok: false,
        problem: PROBLEM_CODE.CLIENT_ERROR,
        originalError: new Error('Not found'),
        data: undefined,
        status: 404,
        headers: {},
      };
    }

    const isOk = response.status >= 200 && response.status < 300;
    const problem = isOk
      ? null
      : response.status >= 500
        ? PROBLEM_CODE.SERVER_ERROR
        : PROBLEM_CODE.CLIENT_ERROR;

    return {
      ok: isOk,
      problem,
      originalError: isOk ? null : new Error(`HTTP ${response.status}`),
      data: response.data,
      status: response.status,
      headers: {
        'content-type': 'application/json',
      },
    };
  };
}
