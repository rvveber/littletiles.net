# Use to test the oidc proxy locally
#
# hurl --test . --very-verbose --variable microsoft_client_id=<AUTH_MICROSOFT_CLIENT_ID> --variable microsoft_client_secret=<AUTH_MICROSOFT_CLIENT_SECRET> --interactive

GET https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize
[Options]
variable: microsoft_authorization_scopes = "xboxlive.signin xboxlive.offline_access profile email openid offline_access"
variable: microsoft_redirect_uri = "http://localhost:8055/auth/login/microsoft/callback"
[Query]
client_id: {{microsoft_client_id}}
response_type: code
redirect_uri: {{microsoft_redirect_uri}}
response_mode: query
scope: {{microsoft_authorization_scopes}}
state: 12345
HTTP 302
[Captures]
click_me: xpath "normalize-space(//a/@href)"


## Todo: find way to input the authorization code from command line mid execution (in interactive mode)


# ------------------------------------------------------------------------------
# Schritt 1: Autorisierungscode gegen Microsoft Access, Refresh und ID Tokens tauschen (OHNE Xbox Live Scopes)
# ------------------------------------------------------------------------------
POST https://login.microsoftonline.com/consumers/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded
[Form]
client_id:{{microsoft_client_id}}
scope:profile email openid offline_access
code:{{microsoft_authorization_code}}
redirect_uri:{{microsoft_redirect_uri}}
grant_type:authorization_code
client_secret:{{microsoft_client_secret}}
HTTP 200
[Captures]
oidc_access_token: jsonpath "$.access_token"
oidc_refresh_token: jsonpath "$.refresh_token"
oidc_id_token: jsonpath "$.id_token"
[Asserts]
jsonpath "$.access_token" exists
jsonpath "$.refresh_token" exists
jsonpath "$.id_token" exists
jsonpath "$.token_type" == "Bearer"


# ------------------------------------------------------------------------------
# Schritt 2: OIDC UserInfo Endpoint aufrufen (mit dem Token ohne Xbox Live Scopes)
# ------------------------------------------------------------------------------
GET https://graph.microsoft.com/oidc/userinfo
Authorization: Bearer {{oidc_access_token}}
Accept: application/json

HTTP 200
[Captures]
user_firstname: jsonpath "$.givenname"
user_familyname: jsonpath "$.familyname"
user_email: jsonpath "$.email"
user_locale: jsonpath "$.locale"
user_id_from_oidc: jsonpath "$.sub"
[Asserts]
jsonpath "$.sub" exists
jsonpath "$.givenname" exists
jsonpath "$.familyname" exists
jsonpath "$.email" exists
jsonpath "$.locale" exists

# ------------------------------------------------------------------------------
# Schritt 3: Refresh Token verwenden um Xbox Live Scopes zu bekommen
# Verwendet das Refresh Token aus Schritt 1 um ein Token mit Xbox Live Scopes zu erhalten
# ------------------------------------------------------------------------------
POST https://login.microsoftonline.com/{{microsoft_tenant}}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

[Form]
client_id:{{microsoft_client_id}}
scope:xboxlive.signin xboxlive.offline_access profile email openid offline_access
refresh_token:{{oidc_refresh_token}}
grant_type:refresh_token
client_secret:{{microsoft_client_secret}}

HTTP 200
[Captures]
xbox_access_token: jsonpath "$.access_token"
xbox_refresh_token: jsonpath "$.refresh_token"
[Asserts]
jsonpath "$.access_token" exists
jsonpath "$.refresh_token" exists
jsonpath "$.token_type" == "Bearer"

# ------------------------------------------------------------------------------
# Schritt 4: Authentifizierung bei Xbox Live (Erhalt eines XBL-Tokens)
# Verwendet das Xbox Access Token aus Schritt 3.
# ------------------------------------------------------------------------------
POST https://user.auth.xboxlive.com/user/authenticate
Content-Type: application/json
Accept: application/json

{
    "Properties": {
        "AuthMethod": "RPS",
        "SiteName": "user.auth.xboxlive.com",
        "RpsTicket": "d={{xbox_access_token}}"
    },
    "RelyingParty": "http://auth.xboxlive.com",
    "TokenType": "JWT"
}

HTTP 200
[Captures]
xbl_token: jsonpath "$.Token"
xbl_user_hash: jsonpath "$.DisplayClaims.xui[0].uhs"
[Asserts]
jsonpath "$.Token" exists
jsonpath "$.DisplayClaims.xui[0].uhs" exists

# ------------------------------------------------------------------------------
# Schritt 5: Anforderung eines XSTS-Tokens vom Xbox Secure Token Service
# Verwendet das XBL-Token aus Schritt 4.
# ------------------------------------------------------------------------------
POST https://xsts.auth.xboxlive.com/xsts/authorize
Content-Type: application/json
Accept: application/json

{
    "Properties": {
        "SandboxId": "RETAIL",
        "UserTokens": [
            "{{xbl_token}}"
        ]
    },
    "RelyingParty": "rp://api.minecraftservices.com/",
    "TokenType": "JWT"
}

HTTP 200
[Captures]
xsts_token: jsonpath "$.Token"
xsts_user_hash: jsonpath "$.DisplayClaims.xui[0].uhs"
[Asserts]
jsonpath "$.Token" exists
jsonpath "$.DisplayClaims.xui[0].uhs" exists

# ------------------------------------------------------------------------------
# Schritt 6: Anmeldung bei Minecraft-Diensten mit XSTS-Token (Erhalt Minecraft Access Token)
# Verwendet das XSTS-Token und den User Hash aus Schritt 5.
# ------------------------------------------------------------------------------
POST https://api.minecraftservices.com/authentication/login_with_xbox
Content-Type: application/json
Accept: application/json

{
    "identityToken": "XBL3.0 x={{xsts_user_hash}};{{xsts_token}}"
}

HTTP 200
[Captures]
minecraft_access_token: jsonpath "$.access_token"
[Asserts]
jsonpath "$.access_token" exists
jsonpath "$.token_type" == "Bearer"

# ------------------------------------------------------------------------------
# Schritt 7: Abrufen des Minecraft-Spielerprofils (UUID und Gamertag)
# Verwendet das Minecraft Access Token aus Schritt 6.
# ------------------------------------------------------------------------------
GET https://api.minecraftservices.com/minecraft/profile
Authorization: Bearer {{minecraft_access_token}}
Accept: application/json

HTTP 200
[Captures]
minecraft_uuid: jsonpath "$.id"
minecraft_gamertag: jsonpath "$.name"
minecraft_skins: jsonpath "$.skins"
[Asserts]
jsonpath "$.id" exists
jsonpath "$.name" exists
jsonpath "$.skins" exists