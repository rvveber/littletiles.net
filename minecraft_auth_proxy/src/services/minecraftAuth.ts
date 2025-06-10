import type {
  XboxLiveAuthRequest,
  XboxLiveAuthResponse,
  XSTSAuthRequest,
  XSTSAuthResponse,
  MinecraftLoginRequest,
  MinecraftLoginResponse,
  MinecraftProfile,
  AggregatedUserInfo
} from '../types/index.js';
import { decodeJWT } from '../utils/jwt.js';

export class MinecraftAuthService {
  /**
   * Complete Minecraft authentication flow using Microsoft access token
   * @param microsoftAccessToken The Microsoft OAuth access token
   * @param timestamp Current timestamp for logging
   * @returns Aggregated user information including Minecraft and Microsoft data
   */
  async authenticateWithMinecraft(microsoftAccessToken: string, timestamp: string): Promise<AggregatedUserInfo> {
    // Step 1: Authenticate with Xbox Live
    console.log(`[${timestamp}] Step 1: Authenticating with Xbox Live`);
    const xblData = await this.authenticateWithXboxLive(microsoftAccessToken, timestamp);
    
    // Step 2: Get XSTS token
    console.log(`[${timestamp}] Step 2: Getting XSTS token`);
    const xstsData = await this.getXSTSToken(xblData.Token, timestamp);
    
    // Step 3: Login to Minecraft services
    console.log(`[${timestamp}] Step 3: Logging into Minecraft services`);
    const userHash = xstsData.DisplayClaims.xui[0]?.uhs;
    if (!userHash) {
      throw new Error('XSTS authentication failed: Invalid user hash');
    }
    const minecraftAccessToken = await this.loginToMinecraft(xstsData.Token, userHash, timestamp);
    
    // Step 4: Get Minecraft profile
    console.log(`[${timestamp}] Step 4: Getting Minecraft profile`);
    const mcProfile = await this.getMinecraftProfile(minecraftAccessToken, timestamp);
    
    // Decode Microsoft user info from JWT
    const microsoftUserInfo = decodeJWT(microsoftAccessToken);
    console.log(`[${timestamp}] Microsoft JWT decoded:`, JSON.stringify(microsoftUserInfo, null, 2));
    
    // Aggregate all user information
    const aggregatedUserInfo: AggregatedUserInfo = {
      // Minecraft information
      minecraft_uuid: mcProfile.id,
      minecraft_gamertag: mcProfile.name,
      minecraft_skins: mcProfile.skins,
      
      // Microsoft information from JWT (if available)
      microsoft_oid: microsoftUserInfo.oid || microsoftUserInfo.sub,
      microsoft_email: microsoftUserInfo.email || microsoftUserInfo.preferred_username,
      microsoft_given_name: microsoftUserInfo.given_name,
      microsoft_family_name: microsoftUserInfo.family_name,
      microsoft_name: microsoftUserInfo.name,
      
      // Xbox information
      xbox_user_hash: userHash,
      
      // Metadata
      timestamp: timestamp,
      auth_flow_completed: true
    };
    
    console.log(`[${timestamp}] Final aggregated user info:`, JSON.stringify(aggregatedUserInfo, null, 2));
    
    return aggregatedUserInfo;
  }

  /**
   * Step 1: Authenticate with Xbox Live
   */
  private async authenticateWithXboxLive(microsoftAccessToken: string, timestamp: string): Promise<XboxLiveAuthResponse> {
    const requestBody: XboxLiveAuthRequest = {
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: `d=${microsoftAccessToken}`
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    };

    const response = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody)
    }) as globalThis.Response;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${timestamp}] Xbox Live auth failed:`, response.status, errorText);
      throw new Error(`Xbox Live authentication failed: ${errorText}`);
    }
    
    const xblData = await response.json() as XboxLiveAuthResponse;
    const xblUserHash = xblData.DisplayClaims.xui[0]?.uhs;
    if (!xblUserHash) {
      throw new Error('Xbox Live authentication failed: Invalid user hash');
    }
    console.log(`[${timestamp}] XBL Token obtained, User Hash:`, xblUserHash);
    
    return xblData;
  }

  /**
   * Step 2: Get XSTS token
   */
  private async getXSTSToken(xblToken: string, timestamp: string): Promise<XSTSAuthResponse> {
    const requestBody: XSTSAuthRequest = {
      Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [xblToken]
      },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT'
    };

    const response = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody)
    }) as globalThis.Response;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${timestamp}] XSTS auth failed:`, response.status, errorText);
      throw new Error(`XSTS authentication failed: ${errorText}`);
    }
    
    const xstsData = await response.json() as XSTSAuthResponse;
    const xstsUserHash = xstsData.DisplayClaims.xui[0]?.uhs;
    if (!xstsUserHash) {
      throw new Error('XSTS authentication failed: Invalid user hash');
    }
    console.log(`[${timestamp}] XSTS Token obtained, User Hash:`, xstsUserHash);
    
    return xstsData;
  }

  /**
   * Step 3: Login to Minecraft services
   */
  private async loginToMinecraft(xstsToken: string, xstsUserHash: string, timestamp: string): Promise<string> {
    const requestBody: MinecraftLoginRequest = {
      identityToken: `XBL3.0 x=${xstsUserHash};${xstsToken}`
    };

    const response = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody)
    }) as globalThis.Response;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${timestamp}] Minecraft login failed:`, response.status, errorText);
      throw new Error(`Minecraft authentication failed: ${errorText}`);
    }
    
    const mcLoginData = await response.json() as MinecraftLoginResponse;
    console.log(`[${timestamp}] Minecraft Access Token obtained`);
    
    return mcLoginData.access_token;
  }

  /**
   * Step 4: Get Minecraft profile
   */
  private async getMinecraftProfile(minecraftAccessToken: string, timestamp: string): Promise<MinecraftProfile> {
    const response = await fetch('https://api.minecraftservices.com/minecraft/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${minecraftAccessToken}`,
        'Accept': 'application/json',
      }
    }) as globalThis.Response;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${timestamp}] Minecraft profile fetch failed:`, response.status, errorText);
      throw new Error(`Minecraft profile fetch failed: ${errorText}`);
    }
    
    const mcProfileData = await response.json() as MinecraftProfile;
    
    console.log(`[${timestamp}] Minecraft profile obtained:`, {
      uuid: mcProfileData.id,
      gamertag: mcProfileData.name,
      skins: mcProfileData.skins
    });
    
    return mcProfileData;
  }
}
