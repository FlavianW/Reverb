<script lang="ts">
	import ConcertCard from '$lib/components/concert/ConcertCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Recherche — Reverb</title>
</svelte:head>

<div class="page">
	<div class="search-hero">
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
	</div>

	{#if data.concerts.length === 0}
		<p class="empty">
			{data.q
				? 'Aucun concert ne correspond à cette recherche.'
				: 'Recherchez un artiste ou une salle pour commencer.'}
		</p>
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

	.search-hero {
		max-width: 720px;
		margin: 0 auto 3.5rem;
		text-align: center;
	}

	h1 {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 400;
		font-size: 2.75rem;
		margin: 0 0 2rem;
	}

	.search-form {
		display: flex;
		gap: 0.75rem;
	}

	.search-form input {
		flex: 1;
		padding: 1.25rem 1.75rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--paper-alt);
		font-family: var(--font-sans);
		font-size: 1.125rem;
		color: var(--ink);
	}

	.search-form button {
		padding: 1.25rem 2rem;
		border: 1px solid var(--ink);
		border-radius: 999px;
		background: var(--ink);
		color: var(--paper);
		font-family: var(--font-sans);
		font-size: 1.0625rem;
		cursor: pointer;
		flex-shrink: 0;
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

	@media (max-width: 640px) {
		.page {
			padding: 2.5rem 1.25rem 3rem;
		}

		h1 {
			font-size: 2rem;
		}

		.search-form {
			flex-direction: column;
		}

		.search-form input,
		.search-form button {
			font-size: 1rem;
			padding: 1rem 1.25rem;
		}
	}
</style>
