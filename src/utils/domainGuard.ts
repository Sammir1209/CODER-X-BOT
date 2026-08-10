export class UnauthorizedDomainError extends Error {
  constructor(public domain: string) {
    super(`Execution Blocked: The domain "${domain}" is not in the authorized QA allowlist.`);
    this.name = 'UnauthorizedDomainError';
  }
}

export function isDomainAuthorized(hostname: string, allowedDomains: string[]): boolean {
  const cleanHost = hostname.toLowerCase().trim();

  // Always allow localhost & 127.0.0.1 for QA local testing
  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost.endsWith('.localhost')) {
    return true;
  }

  for (const pattern of allowedDomains) {
    const cleanPattern = pattern.toLowerCase().trim();
    if (!cleanPattern) continue;

    if (cleanPattern.startsWith('*.')) {
      const rootDomain = cleanPattern.slice(2);
      if (cleanHost === rootDomain || cleanHost.endsWith('.' + rootDomain)) {
        return true;
      }
    } else if (cleanHost === cleanPattern) {
      return true;
    }
  }

  return false;
}

export function validateDomainOrThrow(hostname: string, allowedDomains: string[]): void {
  if (!isDomainAuthorized(hostname, allowedDomains)) {
    throw new UnauthorizedDomainError(hostname);
  }
}
