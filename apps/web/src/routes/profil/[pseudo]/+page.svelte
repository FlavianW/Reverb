<script lang="ts">
	import ConcertCard from '$lib/components/concert/ConcertCard.svelte';
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.profile.pseudo} — Reverb</title>
</svelte:head>

<ProfileHeader
	profile={data.profile}
	editableAs={data.isOwnProfile ? data.user : null}
	friendshipStatus={data.friendshipStatus}
/>

<div class="page">
	<h2 class="section-label">Concerts assistés</h2>
	{#if data.profile.attendedConcerts.length === 0}
		<p class="empty">Aucun concert assisté pour l'instant.</p>
	{:else}
		<div class="grid">
			{#each data.profile.attendedConcerts as concert (concert.id)}
				<ConcertCard {concert} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem 3rem 5rem;
	}

	.section-label {
		font-size: 0.8125rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-soft);
		font-weight: 400;
		margin: 0 0 1.125rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}

	.empty {
		color: var(--ink-soft);
	}

	@media (max-width: 640px) {
		.page {
			padding: 1.5rem 1.25rem 3rem;
		}
	}
</style>
