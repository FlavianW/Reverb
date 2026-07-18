<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';
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
		<div class="map-wrapper">
			<ConcertMap userPosition={position} {concerts} />
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

	.map-wrapper {
		height: 600px;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
</style>
