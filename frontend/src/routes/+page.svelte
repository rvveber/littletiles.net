<script lang="ts">
  import { directus } from '$lib/api/directusClient';
  import { readMe, readItems } from '@directus/sdk'; // Korrigierter Import
  import { onMount } from 'svelte';
  import { PUBLIC_URL } from '$env/static/public';
  import { PUBLIC_URL_BACKEND } from '$env/static/public';

  let user = null;
  let minecraft_account = null;
  let error = null;

  onMount(async () => {
    try {
      await directus.refresh();
      user = await directus.request(readMe());
      if (user && user.minecraft_account) { // Sicherheitsprüfung
        minecraft_account = await directus.request(
          readItems('minecraft_accounts', {
            filter: { uuid: { _eq: user.minecraft_account } }
          })
        );
      }
    } catch (err) {
      error = err.message;
      console.error('Fehler beim Abrufen der Benutzerdaten:', err);
    }
    console.log(minecraft_account);
  });

  function handleLogin() {
    window.location.href = `${PUBLIC_URL_BACKEND}/auth/login/microsoft?redirect=${PUBLIC_URL}`;
  }

  async function handleLogout() {
    await directus.logout();
    user = null;
    minecraft_account = null;
    error = null;
  }
</script>

{#if user && minecraft_account}
  <p>Logged in.</p>
  <p>Minecraft Account: {minecraft_account[0].name}</p>
{:else if error}
  <p>Error while logging in.</p>
{:else}
  <p>Not logged in.</p>
{/if}

<hr />

<button on:click={handleLogin}>Login</button>
<br/>
<button on:click={handleLogout}>Logout</button>

<hr />
