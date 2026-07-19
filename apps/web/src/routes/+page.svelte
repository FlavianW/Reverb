<script lang="ts">
	import { api } from '$lib/api/client';
	import ConcertListItem from '$lib/components/concert/ConcertListItem.svelte';
	import PostCard from '$lib/components/post/PostCard.svelte';
	import type { NearbyConcert } from '@reverb/shared';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const MAX_ARTIST_CONCERTS = 5;
	const MAX_NEARBY_CONCERTS = 5;

	type NearbyStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'error';

	let nearbyStatus: NearbyStatus = $state('idle');
	let nearbyConcerts: NearbyConcert[] = $state([]);

	function locate() {
		if (!navigator.geolocation) {
			nearbyStatus = 'error';
			return;
		}

		nearbyStatus = 'locating';
		navigator.geolocation.getCurrentPosition(
			async (geoPosition) => {
				try {
					const concerts = await api.getNearbyConcerts(
						geoPosition.coords.latitude,
						geoPosition.coords.longitude
					);
					nearbyConcerts = concerts.slice(0, MAX_NEARBY_CONCERTS);
					nearbyStatus = 'ready';
				} catch {
					nearbyStatus = 'error';
				}
			},
			(geoError) => {
				nearbyStatus = geoError.code === geoError.PERMISSION_DENIED ? 'denied' : 'error';
			},
			{ enableHighAccuracy: false, timeout: 10000 }
		);
	}
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

	<div class="columns">
		<div class="main">
			<section aria-labelledby="artist-heading">
				{#if data.favoriteArtist}
					<h2 id="artist-heading" class="section-label">
						Les concerts de {data.favoriteArtist}
					</h2>
					{#await data.favoriteArtistConcerts}
						<p class="muted">Recherche des concerts sur Setlist.fm…</p>
					{:then concerts}
						{#if concerts.length === 0}
							<p class="muted">Aucun concert trouvé pour {data.favoriteArtist}.</p>
						{:else}
							<div>
								{#each concerts.slice(0, MAX_ARTIST_CONCERTS) as concert (concert.id)}
									<ConcertListItem {concert} />
								{/each}
							</div>
							<a class="more" href="/recherche?q={encodeURIComponent(data.favoriteArtist)}">
								Voir tous les concerts de {data.favoriteArtist}
							</a>
						{/if}
					{/await}
				{:else}
					<h2 id="artist-heading" class="section-label">Ton artiste favori</h2>
					<p class="muted">
						Renseigne ton artiste favori sur
						<a href="/profil/{data.user?.pseudo}">ton profil</a> pour retrouver ici ses concerts,
						importés automatiquement depuis Setlist.fm.
					</p>
				{/if}
			</section>

			<section aria-labelledby="friends-heading">
				<h2 id="friends-heading" class="section-label">Du côté de tes amis</h2>
				{#if data.feedPreview.items.length === 0}
					<p class="muted">
						Rien à afficher pour l'instant — <a href="/amis">ajoute des amis</a> ou
						<a href="/fil">publie ton premier post</a>.
					</p>
				{:else}
					<div class="feed-preview">
						{#each data.feedPreview.items as post (post.id)}
							<PostCard {post} canDelete={false} onDelete={async () => {}} />
						{/each}
					</div>
					<a class="more" href="/fil">Voir tout le fil</a>
				{/if}
			</section>
		</div>

		<aside class="side" aria-labelledby="nearby-heading">
			<h2 id="nearby-heading" class="section-label">Autour de toi</h2>
			{#if nearbyStatus === 'idle'}
				<p class="muted">Découvre les concerts à venir près de chez toi.</p>
				<button type="button" class="locate" onclick={locate}>Me localiser</button>
			{:else if nearbyStatus === 'locating'}
				<p class="muted" aria-live="polite">Localisation en cours…</p>
			{:else if nearbyStatus === 'denied'}
				<p class="muted">
					Géolocalisation refusée. Active-la dans les réglages de ton navigateur pour voir les
					concerts à proximité.
				</p>
			{:else if nearbyStatus === 'error'}
				<p class="muted">Impossible de récupérer les concerts à proximité. Réessaie plus tard.</p>
			{:else if nearbyConcerts.length === 0}
				<p class="muted">Aucun concert à proximité pour l'instant.</p>
			{:else}
				<div>
					{#each nearbyConcerts as concert (concert.id)}
						<ConcertListItem {concert} />
					{/each}
				</div>
			{/if}
			{#if nearbyStatus !== 'idle'}
				<a class="more" href="/carte">Ouvrir la carte</a>
			{/if}
		</aside>
	</div>
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

	.columns {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
		gap: 3rem;
		align-items: start;
	}

	.main section + section {
		margin-top: 3rem;
	}

	.side {
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		padding: 1.5rem;
	}

	.section-label {
		font-size: 0.8125rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-soft);
		font-weight: 400;
		margin-bottom: 1.125rem;
	}

	.muted {
		color: var(--ink-soft);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.muted a {
		color: inherit;
	}

	.feed-preview {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.more {
		display: inline-block;
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--accent);
	}

	.locate {
		margin-top: 0.75rem;
		padding: 0.625rem 1.25rem;
		border: 1px solid var(--accent);
		border-radius: var(--radius-md);
		background: none;
		color: var(--accent);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.locate:hover {
		background: var(--accent-soft);
	}

	@media (max-width: 900px) {
		.columns {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.page {
			padding: 2rem 1.25rem 3rem;
		}
	}
</style>
