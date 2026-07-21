<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';
	import ConcertListItem from '$lib/components/concert/ConcertListItem.svelte';
	import ConcertMap from '$lib/components/map/ConcertMap.svelte';
	import type { NearbyConcert } from '@reverb/shared';

	type Status = 'locating' | 'ready' | 'denied' | 'error';

	let status: Status = $state('locating');
	let position: { lat: number; lng: number } | null = $state(null);
	let concerts: NearbyConcert[] = $state([]);

	onMount(() => {
		if (!navigator.geolocation) {
			status = 'error';
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (geoPosition) => {
				const lat = geoPosition.coords.latitude;
				const lng = geoPosition.coords.longitude;
				position = { lat, lng };
				try {
					concerts = await api.getNearbyConcerts(lat, lng);
					status = 'ready';
				} catch {
					status = 'error';
				}
			},
			(geoError) => {
				status = geoError.code === geoError.PERMISSION_DENIED ? 'denied' : 'error';
			},
			{ enableHighAccuracy: false, timeout: 10000 }
		);
	});
</script>

<svelte:head>
	<title>Carte — Reverb</title>
</svelte:head>

<div class="page">
	<h1>Concerts à proximité</h1>

	{#if status === 'locating'}
		<p class="status">Localisation en cours…</p>
	{:else if status === 'denied'}
		<p class="status">
			Impossible d'accéder à votre position. Activez la géolocalisation dans les réglages de
			votre navigateur pour voir les concerts à proximité.
		</p>
	{:else if status === 'error'}
		<p class="status">Une erreur est survenue. Réessayez plus tard.</p>
	{:else if position}
		<p class="count" aria-live="polite">
			{concerts.length}
			{concerts.length > 1 ? 'concerts à proximité' : 'concert à proximité'}
		</p>
		<div class="layout">
			<div class="map-wrapper">
				<ConcertMap userPosition={position} {concerts} />
			</div>
			<!-- Équivalent texte de la carte (RGAA 1.3/12.7) : les marqueurs Leaflet
			     ne sont ni focusables ni consultables au clavier ou au lecteur
			     d'écran, cette liste porte donc la même information. -->
			<div class="list-wrapper">
				<h2 class="list-title">Liste des concerts</h2>
				{#if concerts.length === 0}
					<p class="status">Aucun concert à proximité pour l'instant.</p>
				{:else}
					<ul class="list">
						{#each concerts as concert (concert.id)}
							<li><ConcertListItem {concert} /></li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3.5rem 3rem 5rem;
	}

	h1 {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 400;
		font-size: 1.875rem;
		margin: 0 0 1.75rem;
	}

	.status {
		color: var(--ink-soft);
	}

	.count {
		color: var(--ink-soft);
		font-size: 0.8125rem;
		margin: 0 0 1.25rem;
	}

	.layout {
		display: grid;
		grid-template-columns: 1.6fr 1fr;
		gap: 2rem;
		align-items: start;
	}

	.map-wrapper {
		height: 600px;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.list-wrapper {
		max-height: 600px;
		overflow-y: auto;
	}

	.list-title {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 400;
		font-size: 1.25rem;
		margin: 0 0 1rem;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}

		.list-wrapper {
			max-height: none;
		}
	}

	@media (max-width: 640px) {
		.page {
			padding: 2rem 1.25rem 3rem;
		}

		.map-wrapper {
			height: 55vh;
			min-height: 320px;
		}
	}
</style>
