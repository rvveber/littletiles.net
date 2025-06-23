export function registerAugmentUserHooks({ filter }: any, _context: any) {

  function augmentNonDefaultOIDCUserInfo(payload: any, meta: any): any {
    console.log('hello');

    // Even though officially documented (and oidc standard) "given_name" microsoft returns "givenname" from userinfo endpoint.
    payload.first_name = payload.first_name || meta.providerPayload?.userInfo?.givenname?.trim() || null;
    // Even though officially documented (and oidc standard) "family_name" microsoft returns "familyname" from userinfo endpoint.
    payload.last_name = payload.last_name || meta.providerPayload?.userInfo?.familyname?.trim() || null;
    payload.language = payload.language || meta.providerPayload?.userInfo?.locale?.trim() || null;

    return payload;
  }

  filter('auth.create', augmentNonDefaultOIDCUserInfo);
} 
