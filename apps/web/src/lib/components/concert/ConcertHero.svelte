<script lang="ts">
	import AttendanceButton from './AttendanceButton.svelte';
	import type { ConcertPage } from '@reverb/shared';

	interface Props {
		concert: ConcertPage;
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

<!-- La photo est décorative (le nom de l'artiste est le titre) : fond CSS + aria-hidden.
     Le dégradé la fond dans le papier, le texte reste donc sur fond ~uni et garde
     ses couleurs de thème — contraste préservé en clair comme en sombre (RGAA). -->
<header class="hero" class:has-photo={concert.artistImageUrl}>
	{#if concert.artistImageUrl}
		<div
			class="backdrop"
			style:background-image="url({concert.artistImageUrl})"
			aria-hidden="true"
		></div>
	{/if}
	<div class="content">
		<div class="text">
			<h1>{concert.artistName}</h1>
			<p class="venue">{concert.venueName}, {concert.city} — {formattedDate}</p>
		</div>
		<AttendanceButton concertId={concert.id} initialAttending={attending} />
	</div>
</header>

<style>
	.hero {
		position: relative;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center 25%;
		mask-image: linear-gradient(to bottom, black 0%, transparent 96%);
		-webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 96%);
		opacity: 0.45;
	}

	.hero.has-photo {
		padding-top: 13rem;
	}

	.content {
		position: relative;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 3rem 3rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.text {
		flex: 1;
	}

	h1 {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 500;
		font-size: 2.375rem;
		margin: 0 0 0.5rem;
	}

	.hero.has-photo h1 {
		font-size: 3rem;
	}

	.venue {
		color: var(--ink-soft);
		font-size: 1rem;
		margin: 0;
	}

	@media (max-width: 640px) {
		.hero.has-photo {
			padding-top: 7rem;
		}

		.content {
			flex-direction: column;
			align-items: stretch;
			padding: 2rem 1.25rem 1.5rem;
		}

		.hero.has-photo h1 {
			font-size: 2.25rem;
		}
	}
</style>
