import { live, xnet } from '@xboxreplay/xboxlive-auth';
import type { AggregatedUserInfo, MicrosoftUserInfo } from '../types/index.js';
import { decodeJWT } from '../utils/jwt.js';

export class XboxLiveAuthService {
  /**
   * Complete Xbox Live and Minecraft authentication flow using Microsoft access token
   * @param microsoftAccessToken The Microsoft OAuth access token from Directus
   * @param timestamp Current timestamp for logging
   * @returns Aggregated user information including Minecraft and Microsoft data
   */
  async authenticateWithXboxLive(microsoftAccessToken: string, timestamp: string): Promise<AggregatedUserInfo> {
    try {
      console.log(`[${timestamp}] Starting Xbox Live authentication flow with @xboxreplay/xboxlive-auth`);
      
      // Step 1: Exchange Microsoft access token for Xbox Live RPS ticket, then for user token
      console.log(`[${timestamp}] Step 1: Exchanging Microsoft token for Xbox Live user token`);
      const rpsTicket = `d=${microsoftAccessToken}`;
      const userTokenResponse = await xnet.exchangeRpsTicketForUserToken(rpsTicket);
      console.log(`[${timestamp}] Xbox Live user token obtained`);
      
      // Step 2: Exchange user token for XSTS token for Minecraft services
      console.log(`[${timestamp}] Step 2: Getting XSTS token for Minecraft services`);
      const xstsResponse = await xnet.exchangeTokenForXSTSToken(userTokenResponse.Token, {
        XSTSRelyingParty: 'rp://api.minecraftservices.com/',
        sandboxId: 'RETAIL'
      });
      console.log(`[${timestamp}] XSTS token obtained`);
      
      // Step 3: Exchange XSTS token for Minecraft token
      console.log(`[${timestamp}] Step 3: Exchanging XSTS token for Minecraft token`);
      const userHash = xstsResponse.DisplayClaims.xui[0]?.uhs;
      if (!userHash) {
        throw new Error('XSTS authentication failed: Invalid user hash');
      }
      const identityToken = `XBL3.0 x=${userHash};${xstsResponse.Token}`;
      
      const minecraftAuthResponse = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          identityToken: identityToken
        })
      }) as globalThis.Response;
      
      if (!minecraftAuthResponse.ok) {
        const errorText = await minecraftAuthResponse.text();
        throw new Error(`Minecraft authentication failed: ${errorText}`);
      }
      
      const minecraftAuth = await minecraftAuthResponse.json() as { access_token: string };
      console.log(`[${timestamp}] Minecraft authentication successful`);
      
      // Step 4: Get Minecraft profile
      console.log(`[${timestamp}] Step 4: Getting Minecraft profile`);
      const profileResponse = await fetch('https://api.minecraftservices.com/minecraft/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${minecraftAuth.access_token}`,
          'Accept': 'application/json',
        }
      }) as globalThis.Response;
      
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        throw new Error(`Minecraft profile fetch failed: ${errorText}`);
      }
      
      const minecraftProfile = await profileResponse.json() as {
        id: string;
        name: string;
        skins?: any[];
      };
      
      console.log(`[${timestamp}] Minecraft profile retrieved:`, {
        uuid: minecraftProfile.id,
        name: minecraftProfile.name
      });
      
 
      // Aggregate user information
      const aggregatedUserInfo: AggregatedUserInfo = {
        // Minecraft information
        minecraft_uuid: minecraftProfile.id,
        minecraft_gamertag: minecraftProfile.name,
        minecraft_skins: minecraftProfile.skins || [],
        xbox_user_hash: userHash,
        
        // Metadata
        timestamp: timestamp,
        auth_flow_completed: true
      };
      
      console.log(`[${timestamp}] Authentication flow completed successfully using @xboxreplay/xboxlive-auth`);
      return aggregatedUserInfo;
      
    } catch (error) {
      console.error(`[${timestamp}] Xbox Live authentication failed:`, error);
      throw new Error(`Xbox Live authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}