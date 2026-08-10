import { describe, it, expect } from 'vitest';
import { isDomainAuthorized, validateDomainOrThrow, UnauthorizedDomainError } from '../../src/utils/domainGuard';

describe('domainGuard security allowlist engine', () => {
  const allowed = ['localhost', '127.0.0.1', '*.staging.example.com', 'test.checkout.org'];

  it('allows localhost and 127.0.0.1 by default', () => {
    expect(isDomainAuthorized('localhost', allowed)).toBe(true);
    expect(isDomainAuthorized('127.0.0.1', allowed)).toBe(true);
  });

  it('allows exact domain matches', () => {
    expect(isDomainAuthorized('test.checkout.org', allowed)).toBe(true);
  });

  it('allows wildcard domain matches', () => {
    expect(isDomainAuthorized('app.staging.example.com', allowed)).toBe(true);
    expect(isDomainAuthorized('checkout.staging.example.com', allowed)).toBe(true);
  });

  it('blocks unauthorized domains', () => {
    expect(isDomainAuthorized('google.com', allowed)).toBe(false);
    expect(isDomainAuthorized('malicious-site.net', allowed)).toBe(false);
  });

  it('throws UnauthorizedDomainError on blocked domains', () => {
    expect(() => validateDomainOrThrow('unauthorized.com', allowed)).toThrow(UnauthorizedDomainError);
  });
});
