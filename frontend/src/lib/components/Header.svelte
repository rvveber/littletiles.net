<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import { authService } from "$lib/services/authService";

  onMount(() => {
    auth.checkAuth();
  });
</script>

<header class="flex p-3 gap-3 items-center sticky top-0 border-b">
  <div class="flex-1">
    <a href="/">LittleTiles.net</a>
    <span>|</span>
    <a href="/structures">Structures</a>
  </div>

  <div>
    <button
      class="border p-2 cursor-pointer"
      on:click={$auth.isAuthenticated ? auth.logout : authService.login}
    >
      {$auth.isAuthenticated ? "Logout" : "Login"}
    </button>
  </div>

  <pre class="flex flex-col">
    {#if $auth.loading}
      <p>Loading...</p>
    {:else if $auth.error}
      <p>❌ Error: {$auth.error}</p>
    {:else if $auth.isAuthenticated}
      <span>✅ {$auth.user?.email || "No E-Mail"}</span>      
      <span>🎮 {$auth.user?.minecraft_account?.name || "No Minecraft account"}</span>
    {:else}
      <span>Anonymous</span>
    {/if}
  </pre>
</header>

