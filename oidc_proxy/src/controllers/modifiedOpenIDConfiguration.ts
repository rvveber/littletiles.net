import type { Request, Response } from 'express';

const PORT = process.env.PORT || 8060;
const OPENID_CONFIGURATION_URL = "https://login.microsoftonline.com/consumers/v2.0/.well-known/openid-configuration";

// Cache for the modified OpenID configuration
let cachedOpenIDConfiguration: Record<string, any> | null = null;

/**
 * Fetches and caches the OpenID configuration on startup
 */
export async function initializeOpenIDConfiguration(): Promise<void> {
  try {
    console.log('Fetching OpenID configuration on startup...');
    const response = await fetch(OPENID_CONFIGURATION_URL) as globalThis.Response;
    
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenID configuration: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as Record<string, any>;

    // Modify the response to specify our custom token endpoint
    data.token_endpoint = `http://oidc_proxy:${PORT}/consumers/oauth2/v2.0/token`;

    cachedOpenIDConfiguration = data;
    console.log('OpenID configuration cached successfully');
  } catch (error) {
    console.error('Error fetching OpenID configuration on startup:', error);
    throw error; // Re-throw to prevent server startup if this fails
  }
}

/**
 * Route to serve the cached modified OpenID configuration
 */
export async function getModifiedOpenIDConfiguration(_req: Request, res: Response): Promise<void> {
  try {
    if (!cachedOpenIDConfiguration) {
      // Fallback: if cache is not available, fetch it now
      console.warn('OpenID configuration cache is empty, fetching now...');
      await initializeOpenIDConfiguration();
    }

    res.json(cachedOpenIDConfiguration);
  } catch (error) {
    console.error('Error serving OpenID configuration:', error);
    res.status(500).send('Error serving OpenID configuration');
  }
}
