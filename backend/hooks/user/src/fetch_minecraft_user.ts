import { xnet, live } from '@xboxreplay/xboxlive-auth';
import type { HookExtensionContext } from '@directus/extensions/dist/index';
import type { RegisterFunctions } from '@directus/extensions/dist/index';
import type { FilterHandler } from '@directus/types/dist/events';

export function registerMinecraftUserHooks({ filter }: RegisterFunctions, context: HookExtensionContext) {
  const clientId = context.env.AUTH_MICROSOFT_CLIENT_ID;
  const clientSecret = context.env.AUTH_MICROSOFT_CLIENT_SECRET;
  
  const fetchMinecraftUser: FilterHandler<Record<string, any>> = async (payload, meta, context) => {
    // 1. Microsoft Refresh Token auslesen
    const authData = typeof payload?.auth_data === 'string' ? JSON.parse(payload?.auth_data) : payload?.auth_data;
    const refreshToken = authData?.refreshToken;
    if (!refreshToken) {
      throw new Error('Kein Microsoft Refresh Token im Payload gefunden!');
    }

    // 2. Neues Access Token mit den richtigen Scopes holen
    const tokenData = await live.refreshAccessToken(
      refreshToken, 
      clientId, 
      'XboxLive.signin XboxLive.offline_access', 
      clientSecret
    );
    
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error('Kein Access Token erhalten!');
    }
    // Neues Refresh Token zurückschreiben
    if (tokenData.refresh_token) {
      payload.auth_data = `{"refreshToken":"${tokenData.refresh_token}"}`;
    }

    // 3. Xbox Live User Token mit @xboxreplay/xboxlive-auth holen
    const rpsTicket = `d=${accessToken}`;
    const userTokenResponse = await xnet.exchangeRpsTicketForUserToken(rpsTicket);
    const userToken = userTokenResponse.Token;
    if (!userToken) {
      throw new Error('Kein Xbox Live User Token erhalten!');
    }

    // 4. XSTS Token mit @xboxreplay/xboxlive-auth holen
    const xstsResponse = await xnet.exchangeTokenForXSTSToken(userToken, {
      XSTSRelyingParty: 'rp://api.minecraftservices.com/',
      sandboxId: 'RETAIL'
    });
    const xstsToken = xstsResponse.Token;
    const userHash = xstsResponse.DisplayClaims?.xui?.[0]?.uhs;
    if (!xstsToken || !userHash) {
      throw new Error('Kein XSTS Token oder UserHash erhalten!');
    }

    // 5. Minecraft Access Token holen
    const mcLoginRequest = {
      identityToken: `XBL3.0 x=${userHash};${xstsToken}`
    };
    const mcLoginResponse = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(mcLoginRequest)
    });
    if (!mcLoginResponse.ok) {
      const errorText = await mcLoginResponse.text();
      throw new Error('Minecraft Login fehlgeschlagen: ' + errorText);
    }
    const mcLoginData = await mcLoginResponse.json();
    const mcAccessToken = mcLoginData.access_token;
    if (!mcAccessToken) {
      throw new Error('Kein Minecraft Access Token erhalten!');
    }

    // 6. Minecraft Profil holen
    const mcProfileResponse = await fetch('https://api.minecraftservices.com/minecraft/profile', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${mcAccessToken}`, 'Accept': 'application/json' }
    });
    if (!mcProfileResponse.ok) {
      const errorText = await mcProfileResponse.text();
      throw new Error('Minecraft Profil konnte nicht geladen werden: ' + errorText);
    }
    const mcProfile = await mcProfileResponse.json();

    // Debug-Logging für die Struktur von mcProfile
    // console.log('Minecraft Profile:', JSON.stringify(mcProfile, null, 2));

    // 7. Skin-Textur-URL als String speichern (nur erster Skin mit state 'ACTIVE')
    const activeSkin = Array.isArray(mcProfile.skins)
      ? mcProfile.skins.find((skin: any) => skin.state === 'ACTIVE')
      : null;
    const skinTextureUrl = activeSkin?.url || null;

    // 8. In die Datenbank schreiben
    const minecraftUser = {
      uuid: mcProfile.id, // Das ist die echte UUID
      gamertag: mcProfile.name,
      skin_texture: skinTextureUrl,
      date_created: new Date().toISOString(),
      date_updated: new Date().toISOString(),
    };
    const { database } = context;
    await database('minecraft_users')
      .insert(minecraftUser)
      .onConflict('uuid')
      .merge({
        gamertag: minecraftUser.gamertag,
        skin_texture: minecraftUser.skin_texture,
        date_updated: minecraftUser.date_updated,
      });
    payload.minecraft_user = minecraftUser.uuid;
    return payload;
  };

  filter('auth.create', fetchMinecraftUser);
  filter('auth.update', fetchMinecraftUser);
}


