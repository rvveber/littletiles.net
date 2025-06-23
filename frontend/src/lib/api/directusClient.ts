import { createDirectus, authentication, rest } from "@directus/sdk";
import type { ApiCollections } from '$lib/types/directus/api-collection';
import { PUBLIC_URL_BACKEND } from "$env/static/public";

const directus = createDirectus<ApiCollections>(PUBLIC_URL_BACKEND)
	.with(authentication("session", { credentials: "include" }))
	.with(rest({ credentials: 'include' }));

export { directus };
