import type { Request, Response } from 'express';

/**
 * Handler for token requests that are compatible with standard userinfo endpoints.
 * This function proxies token requests to Microsoft's token endpoint with explicit scopes
 * that exclude Xbox Live scopes, ensuring the resulting token works with standard OpenID userinfo.
 */
export async function getUserInfoCompatibleToken(req: Request, res: Response): Promise<void> {
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] /consumers/oauth2/v2.0/token - Request Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[${timestamp}] /consumers/oauth2/v2.0/token - Request Body:`, JSON.stringify(req.body, null, 2));

  try {
    // Use the original headers as base, only overriding what's necessary
    const proxyHeaders: Record<string, string> = {};
    
    // Copy all headers except hop-by-hop headers that shouldn't be forwarded
    const skipHeaders = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'upgrade']);
    
    Object.entries(req.headers).forEach(([key, value]) => {
      if (!skipHeaders.has(key.toLowerCase()) && value !== undefined) {
        // Handle both string and string[] values
        proxyHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
      }
    });
    
    // Ensure these headers are set correctly for the proxied request
    proxyHeaders['content-type'] = 'application/x-www-form-urlencoded';
    proxyHeaders['accept'] = 'application/json';

    // Extract and modify form data efficiently
    const formData = new URLSearchParams(req.body);
    
    // Only modify the scope if it exists
    // Note: Doesn't work because Directus is not actually sending any scopes to the token endpoint 
    // if (req.body.scope) {
    //   const authorizationScopes: string[] = req.body.scope.split(' ');
    //   const userInfoCompatibleScopes = authorizationScopes.filter(scope => !scope.toLowerCase().startsWith('xbox'));
    //   formData.set('scope', userInfoCompatibleScopes.join(' '));
    // }
    formData.set('scope', 'profile email openid offline_access');


    console.log(`[${timestamp}] /consumers/oauth2/v2.0/token - Modified form data:`, formData.toString());
    console.log(`[${timestamp}] /consumers/oauth2/v2.0/token - Proxy headers:`, JSON.stringify(proxyHeaders, null, 2));

    // Forward the request to Microsoft's token endpoint with modified scope
    const tokenResponse = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
      method: 'POST',
      headers: proxyHeaders,
      body: formData
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(`[${timestamp}] /userinfo-compatible-token - Token request failed:`, tokenData);
      res.status(tokenResponse.status).json(tokenData);
      return;
    }

    console.log(`[${timestamp}] /consumers/oauth2/v2.0/token - Token request successful`);

    // Return the token response directly to the client
    res.json(tokenData);

  } catch (error) {
    console.error(`[${timestamp}] /consumers/oauth2/v2.0/token - Unexpected error:`, error);
    res.status(500).json({
      error: 'Internal server error during token request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
