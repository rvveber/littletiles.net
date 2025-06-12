import type { Request, Response } from 'express';
// import { XboxLiveAuthService } from '../services/xboxLiveAuth.js';

// const xboxLiveAuthService = new XboxLiveAuthService();

// /**
//  * Shared handler for both GET and POST userinfo requests (DEPRECATED - using Xbox Live auth)
//  */
// export async function handleUserinfoRequest(req: Request, res: Response): Promise<void> {
//   const timestamp = new Date().toISOString();
//   
//   console.log(`[${timestamp}] /modified-openid-userinfo - Request Headers:`, JSON.stringify(req.headers, null, 2));
//   console.log(`[${timestamp}] /modified-openid-userinfo - Request Body:`, JSON.stringify(req.body, null, 2));
//   
//   // Extract Microsoft access token from Authorization header
//   const authHeader = req.get('Authorization');
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.error(`[${timestamp}] /modified-openid-userinfo - No Authorization Bearer token found`);
//     res.status(401).json({ error: 'No authorization token provided' });
//     return;
//   }
//   
//   const microsoftAccessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
//   console.log(`[${timestamp}] /modified-openid-userinfo - Microsoft Access Token:`, microsoftAccessToken);
//   
//   try {
//     const aggregatedUserInfo = await xboxLiveAuthService.authenticateWithXboxLive(
//       microsoftAccessToken,
//       timestamp
//     );
//     
//     res.json(aggregatedUserInfo);
//     
//   } catch (error) {
//     console.error(`[${timestamp}] /modified-openid-userinfo - Unexpected error:`, error);
//     res.status(500).json({ 
//       error: 'Internal server error during authentication flow',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// }

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
    // Extract the original form data from the request
    const formData = new URLSearchParams();
    
    // Copy all form fields from the original request
    Object.keys(req.body).forEach(key => {
      formData.append(key, req.body[key]);
    });
    
    // Override the scope to exclude Xbox Live scopes and use only standard OpenID scopes
    // This ensures the token is compatible with standard userinfo endpoints
    formData.set('scope', 'profile email openid offline_access');

    console.log(`[${timestamp}] /consumers/oauth2/v2.0/token - Modified form data:`, formData.toString());

    // Prepare headers for the proxied request, preserving important headers from the original request
    const proxyHeaders: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    };

    // Preserve the Authorization header if present (contains client credentials)
    if (req.headers.authorization) {
      proxyHeaders['Authorization'] = req.headers.authorization;
    }

    // Preserve User-Agent if present
    if (req.headers['user-agent']) {
      proxyHeaders['User-Agent'] = req.headers['user-agent'];
    }

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
