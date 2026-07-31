/**
 * Returns the RFC 8414 authorization-server metadata path for an issuer.
 *
 * @param issuerPath the issuer path beneath the origin.
 * @returns the authorization-server metadata path.
 */
export function authorizationServerMetadataPath(issuerPath: string): string {
  return `/.well-known/oauth-authorization-server${issuerPath}`;
}

/**
 * Returns the RFC 9728 protected-resource metadata path for a resource.
 *
 * @param resourcePath the protected resource path beneath the origin.
 * @returns the protected-resource metadata path.
 */
export function protectedResourceMetadataPath(resourcePath: string): string {
  return `/.well-known/oauth-protected-resource${resourcePath}`;
}
