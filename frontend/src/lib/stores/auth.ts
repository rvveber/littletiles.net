import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { directus } from '$lib/api/directusClient';

import { readMe } from '@directus/sdk';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  async function checkAuth() {
    if (!browser) return;
    
    update(state => ({ ...state, loading: true, error: null }));

    try {
      const token = directus.getToken();
      const auth = await directus.refresh();
      
      if (auth) {
        // Fetch user with all related data in one query
        const user = await directus.request(
          readMe({
            fields: ['*', { minecraft_account: ['*'] }]
          })
        );

        set({
          isAuthenticated: true,
          user,
          loading: false,
          error: null
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null
        });
      }
    } catch (error: any) {
      set({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error?.message || 'Authentication failed'
      });
    }
  }

  async function logout() {
    if (!browser) return;
    
    try {
      await directus.logout();
      set({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  }

  return {
    subscribe,
    checkAuth,
    logout
  };
}

export const auth = createAuthStore();
