export function registerAugmentUserHooks({ filter }: any, _context: any) {
  function augmentNonDefaultOIDCUserInfo(payload: any, meta: any): any {
    // Even though officially documented (and oidc standard) "given_name" microsoft returns "givenname" from userinfo endpoint.
    const given_name = meta.providerPayload?.userInfo?.givenname?.trim();
    // Even though officially documented (and oidc standard) "family_name" microsoft returns "familyname" from userinfo endpoint.
    const family_name = meta.providerPayload?.userInfo?.familyname?.trim();

    if (given_name) {
      payload.first_name = given_name;
    }
    if (family_name) {
      payload.last_name = family_name;
    }
    return payload;
  }

  filter('auth.create', augmentNonDefaultOIDCUserInfo);
  filter('auth.update', augmentNonDefaultOIDCUserInfo);
} 