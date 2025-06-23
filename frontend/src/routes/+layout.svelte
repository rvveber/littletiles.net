<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
</script>


<Header />

<main class="p-4 h-full">
	{@render children()}
</main>
