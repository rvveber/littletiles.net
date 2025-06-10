import { defineHook } from '@directus/extensions-sdk';
import type { FilterHandler } from '@directus/types';

// Type definitions for auth event payloads
interface AuthCreatePayload {
	first_name?: string;
	last_name?: string;
	email?: string;
	external_identifier?: string;
	provider?: string;
	role?: string;
	[key: string]: any;
}

interface AuthUpdatePayload {
	first_name?: string;
	last_name?: string;
	email?: string;
	[key: string]: any;
}

// Type definitions for provider payload structure
interface UserInfo {
	name?: string;
	email?: string;
	sub?: string;
	oid?: string;
	preferred_username?: string;
	minecraft_uuid?: string;
	minecraft_gamertag?: string;
	[key: string]: any;
}

interface ProviderPayload {
	userInfo: UserInfo;
	[key: string]: any;
}

interface AuthEventMeta {
	providerPayload: ProviderPayload;
	provider?: string;
	[key: string]: any;
}

function augmentUser(payload: AuthCreatePayload | AuthUpdatePayload, meta: AuthEventMeta): void {
	const fullName = meta.providerPayload?.userInfo?.name?.trim();

	if (fullName) {
		const nameParts = fullName.split(/\s+/); // Split by any whitespace
		const lastName = nameParts.pop() || ''; // Remove and get last part
		const firstName = nameParts.join(' '); // Join remaining parts
		payload.first_name = firstName;
		payload.last_name = lastName;
	}

	console.log('User augmented!');
	console.log('Payload:', payload);
	console.log('Meta:', meta);	
}

export default defineHook(({ filter }) => {
	const handleAuthCreate: FilterHandler<AuthCreatePayload> = (payload, meta) => {
		console.log('User is being created!');
		console.log('Payload:', payload);
		console.log('Meta:', meta);
		augmentUser(payload, meta as AuthEventMeta);
		return payload;
	};

	const handleAuthUpdate: FilterHandler<AuthUpdatePayload> = (payload, meta) => {
		console.log('User is being updated!');
		console.log('Payload:', payload);
		console.log('Meta:', meta);
		augmentUser(payload, meta as AuthEventMeta);
		return payload;
	};

	filter('auth.create', handleAuthCreate);
	filter('auth.update', handleAuthUpdate);
});

