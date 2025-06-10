import type { Request, Response } from 'express';

const PORT = process.env.PORT || 8060;

/**
 * Route to modify OpenID configuration
 */
export async function getModifiedOpenIDConfiguration(_req: Request, res: Response): Promise<void> {
  try {
    const openidConfiguration = "https://login.microsoftonline.com/consumers/v2.0/.well-known/openid-configuration";
    const response = await fetch(openidConfiguration) as globalThis.Response;
    const data = await response.json() as Record<string, any>;
    
    // Modify the response to specify our custom userinfo endpoint
    data.userinfo_endpoint = `http://minecraft_auth_proxy:${PORT}/modified-openid-userinfo`;

    res.json(data);
  } catch (error) {
    console.error('Error fetching OpenID configuration:', error);
    res.status(500).send('Error fetching OpenID configuration');
  }
}
