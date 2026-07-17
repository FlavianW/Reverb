<script lang="ts">
	import ConcertListItem from '$lib/components/concert/ConcertListItem.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Reverb</title>
</svelte:head>

<div class="page">
	<div class="intro">
		<h1>Le concert ne s'arrête plus quand les lumières se rallument.</h1>
		<p>
			Retrouvez les concerts qui comptent, gardez-en la mémoire, et connectez-vous avec ceux qui y
			étaient.
		</p>
	</div>

	<section aria-labelledby="recent-heading">
		<h2 id="recent-heading" class="section-label">Concerts récents</h2>
		{#if data.concerts.length === 0}
			<p class="empty">Aucun concert pour l'instant.</p>
		{:else}
			<div>
				{#each data.concerts as concert (concert.id)}
					<ConcertListItem {concert} />
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3.5rem 3rem 5rem;
	}

	.intro {
		max-width: 640px;
		margin-bottom: 3rem;
	}

	.intro h1 {
		font-style: italic;
		font-weight: 400;
		font-size: 2.375rem;
		line-height: 1.3;
		margin-bottom: 0.875rem;
	}

	.intro p {
		color: var(--ink-soft);
		font-size: 1rem;
		line-height: 1.6;
		margin: 0;
	}

	.section-label {
		font-size: 0.8125rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-soft);
		font-weight: 400;
		margin-bottom: 1.125rem;
	}

	.empty {
		color: var(--ink-soft);
	}
</style>
