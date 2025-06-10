import type { Request, Response } from 'express';
import { XboxLiveAuthService } from '../services/xboxLiveAuth.js';

const xboxLiveAuthService = new XboxLiveAuthService();

/**
 * Shared handler for both GET and POST userinfo requests
 */
export async function handleUserinfoRequest(req: Request, res: Response): Promise<void> {
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] /modified-openid-userinfo - Request Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[${timestamp}] /modified-openid-userinfo - Request Body:`, JSON.stringify(req.body, null, 2));
  
  // Extract Microsoft access token from Authorization header
  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error(`[${timestamp}] /modified-openid-userinfo - No Authorization Bearer token found`);
    res.status(401).json({ error: 'No authorization token provided' });
    return;
  }
  
  const microsoftAccessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log(`[${timestamp}] /modified-openid-userinfo - Microsoft Access Token:`, microsoftAccessToken);
  
  try {
    const aggregatedUserInfo = await xboxLiveAuthService.authenticateWithXboxLive(
      microsoftAccessToken,
      timestamp
    );
    
    res.json(aggregatedUserInfo);
    
  } catch (error) {
    console.error(`[${timestamp}] /modified-openid-userinfo - Unexpected error:`, error);
    res.status(500).json({ 
      error: 'Internal server error during authentication flow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET handler for userinfo endpoint
 */
export async function getUserinfo(req: Request, res: Response): Promise<void> {
  await handleUserinfoRequest(req, res);
}
