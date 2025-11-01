# Contributing to SWRKit

Thank you for your interest in contributing to SWRKit! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background or experience level.

### Expected Behavior

- Be respectful and considerate in communication
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what's best for the community and project

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting remarks, or personal attacks
- Publishing private information without permission
- Any conduct that could be considered inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- TypeScript knowledge
- Familiarity with React and SWR

### Finding Issues to Work On

1. Check the [issue tracker](https://github.com/mshindi-labs/swrkit/issues)
2. Look for issues labeled `good first issue` or `help wanted`
3. Comment on the issue to express interest before starting work
4. Wait for maintainer approval to avoid duplicate efforts

### Reporting Bugs

Before creating a bug report:

1. **Search existing issues** to avoid duplicates
2. **Verify the bug** can be reproduced
3. **Collect information** about your environment

When creating a bug report, include:

```markdown
**Description**
A clear description of the bug

**To Reproduce**
Steps to reproduce the behavior:
1. Install SWRKit
2. Create a component with...
3. Call useFetch...
4. See error

**Expected Behavior**
What you expected to happen

**Actual Behavior**
What actually happened

**Environment**
- SWRKit version: 1.0.0
- React version: 19.0.0
- SWR version: 2.3.6
- Node version: 18.0.0
- OS: macOS 14.0

**Additional Context**
- Error messages
- Screenshots
- Code samples
```

### Suggesting Features

Before suggesting a feature:

1. Check if it aligns with SWR's philosophy
2. Search existing feature requests
3. Consider if it can be implemented via middleware

When suggesting a feature, include:

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
What other approaches did you consider?

**Use Cases**
Real-world scenarios where this would be helpful

**Implementation Ideas**
(Optional) Technical approach
```

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/swrkit.git
cd swrkit

# Add upstream remote
git remote add upstream https://github.com/mshindi-labs/swrkit.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

### 4. Verify Setup

```bash
# Check that TypeScript compiles
npx tsc --noEmit

# Check build output
ls -la dist/
```

## Project Structure

```
swrkit/
├── src/
│   ├── index.ts           # Main entry point, all exports
│   ├── types.ts           # TypeScript type definitions
│   ├── constants.ts       # Constants and defaults
│   ├── context.tsx        # React context and provider
│   ├── swrkit.ts          # Core hooks (useFetch, useMutation, etc.)
│   ├── utils.ts           # Utility functions (cache keys, fetchers)
│   ├── errors.ts          # Error classes
│   ├── middleware.ts      # Built-in middleware
│   ├── subscription.ts    # WebSocket/SSE subscription hook
│   └── testing.ts         # Testing utilities
├── dist/                  # Build output (generated)
├── README.md              # Main documentation
├── CLAUDE.md              # Architecture documentation for Claude Code
├── IMPROVEMENTS.md        # Analysis of improvements from v1 to v2
├── CHANGELOG.md           # Version history
├── CONTRIBUTING.md        # This file
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
└── tsup.config.ts         # Build configuration

Key Files:
- types.ts: All TypeScript interfaces and types
- swrkit.ts: Core hooks implementation
- context.tsx: Provider and context hooks
- utils.ts: Fetcher creation, cache key building
- middleware.ts: Reusable middleware functions
```

## Development Workflow

### Branch Strategy

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bugfix branch
git checkout -b fix/issue-description

# Keep your branch up to date
git fetch upstream
git rebase upstream/main
```

### Making Changes

1. **Write code** following our [coding standards](#coding-standards)
2. **Add tests** for new functionality
3. **Update documentation** as needed
4. **Build and verify**:

```bash
# Build the project
npm run build

# Run type checking
npx tsc --noEmit

# Format code (if using a formatter)
npx prettier --write src/
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style changes (formatting, etc.)
refactor: Code refactoring
perf:     Performance improvements
test:     Adding or updating tests
chore:    Maintenance tasks

# Examples
feat(useFetch): add support for dynamic cache keys
fix(useMutation): resolve race condition in optimistic updates
docs(readme): add WebSocket subscription examples
refactor(utils): simplify cache key building logic
perf(middleware): optimize laggy middleware memory usage
```

### Commit Best Practices

- Keep commits atomic (one logical change per commit)
- Write clear, descriptive commit messages
- Reference issue numbers: `fix(useFetch): handle null keys (#123)`
- Avoid "WIP" or "temp" commits in PRs

## Coding Standards

### TypeScript

```typescript
// ✅ Good: Explicit types, generics, JSDoc
/**
 * Fetches data from an API endpoint using SWR
 *
 * @template T - The expected data type
 * @param key - Cache key (URL, array, or object)
 * @param options - Configuration options
 * @returns Object containing data, loading state, and error
 *
 * @example
 * const { data, isLoading } = useFetch<User>('/api/user/123');
 */
export function useFetch<T = any>(
  key: CacheKey | (() => CacheKey),
  options: UseFetchOptions<T> = {},
): UseFetchReturn<T> {
  // Implementation
}

// ❌ Bad: No types, no documentation
export function useFetch(key, options) {
  // Implementation
}
```

### Naming Conventions

```typescript
// Hooks: useCamelCase
export function useFetch() {}
export function useMutation() {}
export function useInfiniteScroll() {}

// Components: PascalCase
export function SWRKitProvider() {}
export function SWRKitTestProvider() {}

// Types/Interfaces: PascalCase
export interface UseFetchOptions<T> {}
export type CacheKey = string | readonly unknown[] | Record<string, any>;

// Constants: UPPER_SNAKE_CASE
export const DEFAULT_TIMEOUT = 10000;
export const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'] as const;

// Functions: camelCase
export function buildCacheKey() {}
export function createMockFetcher() {}

// Middleware: camelCase + "Middleware" suffix
export function laggyMiddleware() {}
export function loggerMiddleware() {}
```

### Code Style

```typescript
// ✅ Good: Consistent formatting, clear logic
export function useFetch<T = any>(
  key: CacheKey | (() => CacheKey),
  options: UseFetchOptions<T> = {},
): UseFetchReturn<T> {
  const { fetcher: contextFetcher } = useSWRKitContext();
  const { swr: swrConfig, request: requestConfig, params, skip } = options;

  // Resolve key if it's a function
  const resolvedKey = typeof key === 'function' ? key() : key;

  // Build cache key with stable reference
  const cacheKey = useMemo(() => {
    if (skip || !resolvedKey) return null;
    return buildCacheKey(resolvedKey, params);
  }, [resolvedKey, params, skip]);

  // Use SWR
  const { data, error, isValidating, mutate, isLoading } = useSWR<T, Error>(
    cacheKey as any,
    cacheKey ? fetcher : null,
    finalSWRConfig as any,
  );

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

// ❌ Bad: Inconsistent formatting, unclear logic
export function useFetch<T = any>(key: CacheKey|(() => CacheKey),options: UseFetchOptions<T>= {}): UseFetchReturn<T>{
const {fetcher:contextFetcher}=useSWRKitContext();
const resolvedKey=typeof key==='function'?key():key;
const cacheKey=useMemo(()=>skip||!resolvedKey?null:buildCacheKey(resolvedKey,params),[resolvedKey,params,skip]);
const {data,error}=useSWR(cacheKey,fetcher);
return {data,error};
}
```

### Error Handling

```typescript
// ✅ Good: Typed errors, proper error handling
export function createFetcher() {
  return async function fetcher<T = any>(
    config: SWRKitRequestConfig,
  ): Promise<SWRKitResponse<T>> {
    try {
      const response = await fetchWithTimeout(fullUrl, fetchConfig);
      const data = await parseResponseBody<T>(response);
      const swrKitResponse = normalizeResponse(data as T, response, duration);

      if (!swrKitResponse.ok) {
        const error = createErrorFromResponse(swrKitResponse);
        throw error;
      }

      return swrKitResponse;
    } catch (error) {
      const swrKitResponse = normalizeErrorResponse<T>(error as Error);
      const typedError = createErrorFromResponse(swrKitResponse);
      throw typedError;
    }
  };
}

// ❌ Bad: Generic errors, poor error handling
export function createFetcher() {
  return async function fetcher(config) {
    try {
      const response = await fetch(config.url);
      return response.json();
    } catch (error) {
      throw error; // No error normalization
    }
  };
}
```

### React Best Practices

```typescript
// ✅ Good: Proper hooks usage, memoization
export function useFetch<T = any>(key: CacheKey, options = {}) {
  // Stable references with useMemo/useCallback
  const stableConfig = useMemo(
    () => requestConfig,
    [JSON.stringify(requestConfig)],
  );

  const fetcher = useCallback(
    async (fetchKey: CacheKey): Promise<T> => {
      // Implementation
    },
    [params, stableConfig, contextFetcher],
  );

  // Early returns after all hooks
  const { data, error } = useSWR(cacheKey, fetcher);

  return { data, error };
}

// ❌ Bad: Conditional hooks, missing memoization
export function useFetch(key, options) {
  if (!key) return { data: null }; // ❌ Early return before hooks

  const fetcher = async () => {}; // ❌ New function every render

  const { data } = useSWR(key, fetcher); // ❌ Will re-fetch unnecessarily
  return { data };
}
```

## Testing Guidelines

### Unit Testing Philosophy

While SWRKit doesn't currently have a test suite, here are guidelines for future testing:

```typescript
// Example test structure (for future implementation)
import { renderHook, waitFor } from '@testing-library/react';
import { useFetch } from '../src/swrkit';
import { SWRKitTestProvider, createMockFetcher } from '../src/testing';

describe('useFetch', () => {
  it('should fetch data successfully', async () => {
    const fetcher = createMockFetcher({
      '/api/user': { id: '1', name: 'John' },
    });

    const wrapper = ({ children }) => (
      <SWRKitTestProvider config={{ fetcher }}>{children}</SWRKitTestProvider>
    );

    const { result } = renderHook(() => useFetch('/api/user'), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual({ id: '1', name: 'John' });
  });

  it('should handle errors', async () => {
    const fetcher = createMockFetcher({
      '/api/user': new Error('Not found'),
    });

    const wrapper = ({ children }) => (
      <SWRKitTestProvider config={{ fetcher }}>{children}</SWRKitTestProvider>
    );

    const { result } = renderHook(() => useFetch('/api/user'), { wrapper });

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.problem).toBe(PROBLEM_CODE.UNKNOWN_ERROR);
  });
});
```

### Manual Testing

When adding new features:

1. **Create test cases** in a separate Next.js project
2. **Test all scenarios**: success, error, loading states
3. **Test edge cases**: null keys, conditional fetching, race conditions
4. **Test with real APIs** when possible
5. **Test in both development and production builds**

## Documentation

### Code Documentation

```typescript
/**
 * Hook for fetching data with SWR
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
 * @see {@link https://swr.vercel.app/docs/api SWR API Documentation}
 */
export function useFetch<T = any>(
  key: CacheKey | (() => CacheKey),
  options: UseFetchOptions<T> = {},
): UseFetchReturn<T> {
  // Implementation
}
```

### README Updates

When adding features, update relevant sections:

- **Quick Start**: If API changes
- **Core Hooks**: For new hooks
- **Advanced Features**: For middleware, transforms, etc.
- **TypeScript Types**: For new types
- **Examples**: Add usage examples

### CHANGELOG Updates

For every change, update CHANGELOG.md:

```markdown
## [Unreleased]

### Added
- New `useWebSocket` hook for WebSocket connections (#123)
- Support for retry strategies in `useMutation` (#124)

### Changed
- Improved error messages in `useFetch` (#125)
- Updated TypeScript types for better inference (#126)

### Fixed
- Race condition in optimistic updates (#127)
- Memory leak in `laggyMiddleware` (#128)

### Deprecated
- `oldFunction` in favor of `newFunction` (#129)
```

## Submitting Changes

### Pull Request Process

1. **Update documentation** (README, CHANGELOG, JSDoc)
2. **Ensure build succeeds**: `npm run build`
3. **Run type checking**: `npx tsc --noEmit`
4. **Create pull request** with clear description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issue
Fixes #(issue number)

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
How has this been tested?
- [ ] Manual testing in development
- [ ] Manual testing in production build
- [ ] Tested with Next.js App Router
- [ ] Tested with Next.js Pages Router

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added examples that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to demonstrate the changes

## Additional Notes
Any additional information about the changes
```

### Review Process

1. **Maintainer review**: Wait for feedback from maintainers
2. **Address comments**: Make requested changes
3. **Re-request review**: After making changes
4. **Merge**: Maintainer will merge when approved

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **Major (X.0.0)**: Breaking changes
- **Minor (0.X.0)**: New features, backwards-compatible
- **Patch (0.0.X)**: Bug fixes, backwards-compatible

### Release Checklist

1. Update CHANGELOG.md with release notes
2. Update package.json version
3. Build and verify: `npm run build`
4. Create git tag: `git tag v1.0.0`
5. Push tag: `git push origin v1.0.0`
6. Publish to npm: `npm publish`
7. Create GitHub release with changelog

## Getting Help

### Communication Channels

- **Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Email**: For security issues (security@mshindi-labs.com)

### Resources

- [SWR Documentation](https://swr.vercel.app/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)

## Recognition

Contributors will be recognized in:

- README.md contributors section
- CHANGELOG.md for their contributions
- GitHub contributors page

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to SWRKit! 🎉

Your contributions help make API data fetching better for everyone.
