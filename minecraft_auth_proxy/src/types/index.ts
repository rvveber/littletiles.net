// Type definitions for the Minecraft auth proxy

export interface XboxLiveAuthRequest {
  Properties: {
    AuthMethod: string;
    SiteName: string;
    RpsTicket: string;
  };
  RelyingParty: string;
  TokenType: string;
}

export interface XboxLiveAuthResponse {
  Token: string;
  DisplayClaims: {
    xui: Array<{
      uhs: string;
    }>;
  };
}

export interface XSTSAuthRequest {
  Properties: {
    SandboxId: string;
    UserTokens: string[];
  };
  RelyingParty: string;
  TokenType: string;
}

export interface XSTSAuthResponse {
  Token: string;
  DisplayClaims: {
    xui: Array<{
      uhs: string;
    }>;
  };
}

export interface MinecraftLoginRequest {
  identityToken: string;
}

export interface MinecraftLoginResponse {
  access_token: string;
}

export interface MinecraftProfile {
  id: string;
  name: string;
  skins: any[];
}

export interface MicrosoftUserInfo {
  oid?: string;
  sub?: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

export interface AggregatedUserInfo {
  minecraft_uuid: string;
  minecraft_gamertag: string;
  minecraft_skins: any[];
  microsoft_oid?: string;
  microsoft_email?: string;
  microsoft_given_name?: string;
  microsoft_family_name?: string;
  microsoft_name?: string;
  xbox_user_hash: string;
  timestamp: string;
  auth_flow_completed: boolean;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: string;
  timestamp?: string;
  service?: string;
}
