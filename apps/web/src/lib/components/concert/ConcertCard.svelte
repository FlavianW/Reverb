<script lang="ts">
	import type { Concert } from '@reverb/shared';

	interface Props {
		/** `artistImageUrl` optionnel : les listes non enrichies (profil) affichent le repli. */
		concert: Concert & { artistImageUrl?: string | null };
	}

	let { concert }: Props = $props();

	const date = $derived(new Date(concert.date));
	const upcoming = $derived(date.getTime() >= Date.now());
	const day = $derived(date.toLocaleDateString('fr-FR', { day: 'numeric' }));
	const monthYear = $derived(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
	const initial = $derived(concert.artistName.charAt(0).toUpperCase());
</script>

<a class="card" href="/concerts/{concert.id}">
	<div class="media">
		{#if concert.artistImageUrl}
			<img src={concert.artistImageUrl} alt="" loading="lazy" />
		{:else}
			<div class="fallback" aria-hidden="true">{initial}</div>
		{/if}
		<div class="date-badge">
			<span class="day">{day}</span>
			<span class="month">{monthYear}</span>
		</div>
		{#if upcoming}
			<span class="upcoming-chip">À venir</span>
		{/if}
	</div>
	<div class="body">
		<p class="artist">{concert.artistName}</p>
		<p class="venue">{concert.venueName} · {concert.city}</p>
	</div>
</a>

<style>
	.card {
		display: block;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--paper-alt);
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		transition:
			border-color 0.15s ease,
			transform 0.15s ease;
	}

	.card:hover,
	.card:focus-visible {
		border-color: var(--accent);
		transform: translateY(-2px);
	}

	.media {
		position: relative;
		aspect-ratio: 16 / 10;
		background: var(--accent-soft);
	}

	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 3.5rem;
		color: var(--accent-deep);
	}

	.date-badge {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.375rem 0.625rem;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--paper) 88%, transparent);
		backdrop-filter: blur(4px);
		line-height: 1.1;
	}

	.date-badge .day {
		font-family: var(--font-serif);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.date-badge .month {
		font-size: 0.6875rem;
		color: var(--ink-soft);
		text-transform: capitalize;
	}

	.upcoming-chip {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.body {
		padding: 1rem 1.125rem 1.125rem;
	}

	.artist {
		font-family: var(--font-serif);
		font-size: 1.1875rem;
		font-weight: 500;
		margin: 0 0 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.venue {
		color: var(--ink-soft);
		font-size: 0.875rem;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
