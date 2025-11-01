'use client';

import useSWRSubscription from 'swr/subscription';
import type { SWRConfiguration } from 'swr';

/**
 * Options for useSubscription hook
 */
export interface UseSubscriptionOptions<T = any> {
  /**
   * SWR subscription configuration
   */
  swr?: SWRConfiguration<T>;
}

/**
 * Return type for useSubscription hook
 */
export interface UseSubscriptionReturn<T> {
  /**
   * Subscription data
   */
  data: T | undefined;

  /**
   * Subscription error
   */
  error: Error | undefined;

  /**
   * Whether the subscription is loading
   */
  isLoading: boolean;
}

/**
 * Hook for WebSocket subscriptions and real-time data
 *
 * @template T - The expected data type
 *
 * @param key - Subscription key
 * @param subscribe - Subscribe function that receives key and next callback
 * @param options - Configuration options
 *
 * @returns Object containing data, error, and loading state
 *
 * @example
 * // WebSocket subscription
 * const { data, error } = useSubscription(
 *   'ws://localhost:3000/live',
 *   (key, { next }) => {
 *     const socket = new WebSocket(key);
 *     socket.addEventListener('message', (event) => next(null, event.data));
 *     socket.addEventListener('error', (event) => next(event.error));
 *     return () => socket.close();
 *   }
 * );
 *
 * @example
 * // Server-Sent Events
 * const { data } = useSubscription(
 *   '/api/events',
 *   (key, { next }) => {
 *     const es = new EventSource(key);
 *     es.onmessage = (event) => next(null, JSON.parse(event.data));
 *     es.onerror = (error) => next(error);
 *     return () => es.close();
 *   }
 * );
 */
export function useSubscription<T = any>(
  key: string,
  subscribe: (
    key: string,
    options: { next: (error?: Error | null, data?: T) => void },
  ) => (() => void) | void,
  options: UseSubscriptionOptions<T> = {},
): UseSubscriptionReturn<T> {
  const { swr: swrConfig } = options;

  const { data, error } = useSWRSubscription(key, subscribe, swrConfig);

  return {
    data,
    error,
    isLoading: !data && !error,
  };
}
