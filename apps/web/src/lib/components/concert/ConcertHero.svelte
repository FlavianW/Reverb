<script lang="ts">
	import AttendanceButton from './AttendanceButton.svelte';
	import type { Concert } from '@reverb/shared';

	interface Props {
		concert: Concert;
		attending: boolean;
	}

	let { concert, attending }: Props = $props();

	const formattedDate = $derived(
		new Date(concert.date).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
	);
</script>

<header class="hero">
	<div class="text">
		<h1>{concert.artistName}</h1>
		<p class="venue">{concert.venueName}, {concert.city} — {formattedDate}</p>
	</div>
	<AttendanceButton concertId={concert.id} initialAttending={attending} />
</header>

<style>
	.hero {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 3rem 3rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 500;
		font-size: 2.375rem;
		margin: 0 0 0.5rem;
	}

	.venue {
		color: var(--ink-soft);
		font-size: 1rem;
		margin: 0;
	}

	@media (max-width: 640px) {
		.hero {
			flex-direction: column;
			padding: 2rem 1.25rem 1.5rem;
		}
	}
</style>
