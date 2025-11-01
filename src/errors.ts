import type { SWRKitResponse } from './types';
import { PROBLEM_CODE } from '@mshindi-labs/refetch';

/**
 * Base error class for SWRKit errors
 */
export class SWRKitError extends Error {
  public readonly response?: SWRKitResponse<any>;
  public readonly problem: PROBLEM_CODE;
  public readonly status?: number;

  constructor(
    message: string,
    problem: PROBLEM_CODE,
    response?: SWRKitResponse<any>,
  ) {
    super(message);
    this.name = 'SWRKitError';
    this.problem = problem;
    this.response = response;
    this.status = response?.status;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SWRKitError);
    }
  }
}

/**
 * Client error (4xx status codes)
 */
export class SWRKitClientError extends SWRKitError {
  constructor(message: string, response?: SWRKitResponse<any>) {
    super(message, PROBLEM_CODE.CLIENT_ERROR, response);
    this.name = 'SWRKitClientError';
  }
}

/**
 * Server error (5xx status codes)
 */
export class SWRKitServerError extends SWRKitError {
  constructor(message: string, response?: SWRKitResponse<any>) {
    super(message, PROBLEM_CODE.SERVER_ERROR, response);
    this.name = 'SWRKitServerError';
  }
}

/**
 * Network error (no connection, DNS failure, etc.)
 */
export class SWRKitNetworkError extends SWRKitError {
  constructor(message: string, response?: SWRKitResponse<any>) {
    super(message, PROBLEM_CODE.NETWORK_ERROR, response);
    this.name = 'SWRKitNetworkError';
  }
}

/**
 * Connection error (cannot connect to server)
 */
export class SWRKitConnectionError extends SWRKitError {
  constructor(message: string, response?: SWRKitResponse<any>) {
    super(message, PROBLEM_CODE.CONNECTION_ERROR, response);
    this.name = 'SWRKitConnectionError';
  }
}

/**
 * Timeout error (request exceeded timeout)
 */
export class SWRKitTimeoutError extends SWRKitError {
  constructor(message: string, response?: SWRKitResponse<any>) {
    super(message, PROBLEM_CODE.TIMEOUT_ERROR, response);
    this.name = 'SWRKitTimeoutError';
  }
}

/**
 * Cancel error (request was cancelled)
 */
export class SWRKitCancelError extends SWRKitError {
  constructor(message: string, response?: SWRKitResponse<any>) {
    super(message, PROBLEM_CODE.CANCEL_ERROR, response);
    this.name = 'SWRKitCancelError';
  }
}

/**
 * Create appropriate error instance based on problem code
 */
export function createErrorFromResponse<T>(
  response: SWRKitResponse<T>,
): SWRKitError {
  const message =
    response.originalError?.message ||
    `Request failed with status ${response.status}`;

  switch (response.problem) {
    case PROBLEM_CODE.CLIENT_ERROR:
      return new SWRKitClientError(message, response);
    case PROBLEM_CODE.SERVER_ERROR:
      return new SWRKitServerError(message, response);
    case PROBLEM_CODE.NETWORK_ERROR:
      return new SWRKitNetworkError(message, response);
    case PROBLEM_CODE.CONNECTION_ERROR:
      return new SWRKitConnectionError(message, response);
    case PROBLEM_CODE.TIMEOUT_ERROR:
      return new SWRKitTimeoutError(message, response);
    case PROBLEM_CODE.CANCEL_ERROR:
      return new SWRKitCancelError(message, response);
    default:
      return new SWRKitError(message, PROBLEM_CODE.UNKNOWN_ERROR, response);
  }
}
