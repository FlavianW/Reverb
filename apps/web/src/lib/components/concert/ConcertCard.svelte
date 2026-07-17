<script lang="ts">
	import type { Concert } from '@reverb/shared';

	interface Props {
		concert: Concert;
	}

	let { concert }: Props = $props();

	const formattedDate = $derived(
		new Date(concert.date).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		})
	);
</script>

<a class="card" href="/concerts/{concert.id}">
	<p class="artist">{concert.artistName}</p>
	<p class="venue">{concert.venueName}, {concert.city}</p>
	<p class="date">{formattedDate}</p>
</a>

<style>
	.card {
		display: block;
		padding: 1.5rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--paper-alt);
		text-decoration: none;
		color: inherit;
		transition: border-color 0.15s ease;
	}

	.card:hover,
	.card:focus-visible {
		border-color: var(--accent);
	}

	.artist {
		font-family: var(--font-serif);
		font-size: 1.1875rem;
		font-weight: 500;
		margin: 0 0 0.375rem;
	}

	.venue {
		color: var(--ink-soft);
		font-size: 0.875rem;
		margin: 0 0 0.25rem;
	}

	.date {
		color: var(--ink-soft);
		font-size: 0.8125rem;
		margin: 0;
	}
</style>
