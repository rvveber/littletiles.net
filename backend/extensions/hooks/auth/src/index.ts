import { defineHook } from '@directus/extensions-sdk';
import { registerAugmentUserHooks } from './augment_microsoft_userinfo';
import { registerMinecraftUserHooks } from './fetch_minecraft_user';


export default defineHook((registerFns, context) => {
	registerAugmentUserHooks(registerFns, context);
	registerMinecraftUserHooks(registerFns, context);
});

