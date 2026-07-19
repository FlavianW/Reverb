<script lang="ts">
	import ConcertCard from '$lib/components/concert/ConcertCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const now = Date.now();
	// À venir en premier (le concert qu'on cherche est rarement un souvenir),
	// du plus proche au plus lointain ; les passés du plus récent au plus ancien.
	const upcoming = $derived(
		data.concerts
			.filter((concert) => new Date(concert.date).getTime() >= now)
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
	);
	const past = $derived(
		data.concerts
			.filter((concert) => new Date(concert.date).getTime() < now)
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	);
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

		{#if data.q}
			<p class="result-summary" role="status">
				{data.concerts.length === 0
					? `Aucun concert pour « ${data.q} »`
					: `${data.concerts.length} concert${data.concerts.length > 1 ? 's' : ''} pour « ${data.q} »`}
			</p>
		{:else}
			<p class="result-summary">Les derniers concerts du catalogue — cherchez pour en importer d'autres.</p>
		{/if}
	</div>

	{#if data.concerts.length === 0}
		<p class="empty">
			{data.q
				? 'Vérifiez l’orthographe de l’artiste ou essayez le nom de la salle.'
				: 'Le catalogue est vide pour l’instant : recherchez un artiste pour l’alimenter.'}
		</p>
	{:else}
		{#if upcoming.length > 0}
			<section aria-labelledby="upcoming-title">
				<h2 class="section-label" id="upcoming-title">
					À venir <span class="count">{upcoming.length}</span>
				</h2>
				<div class="grid">
					{#each upcoming as concert (concert.id)}
						<ConcertCard {concert} />
					{/each}
				</div>
			</section>
		{/if}

		{#if past.length > 0}
			<section aria-labelledby="past-title">
				<h2 class="section-label" id="past-title">
					Déjà joués <span class="count">{past.length}</span>
				</h2>
				<div class="grid">
					{#each past as concert (concert.id)}
						<ConcertCard {concert} />
					{/each}
				</div>
			</section>
		{/if}
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
		margin: 0 auto 3rem;
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

	.result-summary {
		margin: 1.25rem 0 0;
		color: var(--ink-soft);
		font-size: 0.9375rem;
	}

	section + section {
		margin-top: 3rem;
	}

	.section-label {
		font-size: 0.8125rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-soft);
		font-weight: 400;
		margin: 0 0 1.125rem;
	}

	.count {
		display: inline-block;
		margin-left: 0.375rem;
		padding: 0.0625rem 0.5rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		font-size: 0.75rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1.25rem;
	}

	.empty {
		color: var(--ink-soft);
		text-align: center;
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
