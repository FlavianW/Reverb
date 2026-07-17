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

<a class="row" href="/concerts/{concert.id}">
	<div>
		<p class="artist">{concert.artistName}</p>
		<p class="venue">{concert.venueName}, {concert.city} — {formattedDate}</p>
	</div>
</a>

<style>
	.row {
		display: block;
		padding: 1.25rem 0;
		border-bottom: 1px solid var(--line);
		text-decoration: none;
		color: inherit;
	}

	.artist {
		font-family: var(--font-serif);
		font-size: 1.3125rem;
		font-weight: 500;
		margin: 0 0 0.25rem;
	}

	.venue {
		color: var(--ink-soft);
		font-size: 0.875rem;
		margin: 0;
	}
</style>
