import { createDirectus, authentication, rest } from "@directus/sdk";
import { type Schema } from '$lib/api/directusTypes';
import { PUBLIC_URL_BACKEND } from "$env/static/public";

const directus = createDirectus<Schema>(PUBLIC_URL_BACKEND)
	.with(authentication("session", { credentials: "include" }))
	.with(rest({ credentials: 'include' }));

export { directus };
