<script lang="ts">
	import ConcertCard from '$lib/components/concert/ConcertCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Recherche — Reverb</title>
</svelte:head>

<div class="page">
	<h1>Rechercher un concert</h1>

	<form class="search-form" method="GET">
		<label for="q" class="sr-only">Artiste ou salle</label>
		<input
			id="q"
			name="q"
			type="search"
			placeholder="Artiste ou salle…"
			value={data.q}
			autocomplete="off"
		/>
		<button type="submit">Rechercher</button>
	</form>

	{#if data.concerts.length === 0}
		<p class="empty">Aucun concert ne correspond à cette recherche.</p>
	{:else}
		<div class="grid">
			{#each data.concerts as concert (concert.id)}
				<ConcertCard {concert} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3.5rem 3rem 5rem;
	}

	h1 {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 400;
		font-size: 1.875rem;
		margin: 0 0 1.75rem;
	}

	.search-form {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1.75rem;
	}

	.search-form input {
		flex: 1;
		padding: 0.75rem 0.875rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper-alt);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		color: var(--ink);
	}

	.search-form button {
		padding: 0.75rem 1.25rem;
		border: 1px solid var(--ink);
		border-radius: var(--radius-sm);
		background: var(--ink);
		color: var(--paper);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		cursor: pointer;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}

	.empty {
		color: var(--ink-soft);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
