<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Map as LeafletMap, Marker } from 'leaflet';
	import type { NearbyConcert } from '@reverb/shared';
	import 'leaflet/dist/leaflet.css';
	import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
	import markerIcon from 'leaflet/dist/images/marker-icon.png';
	import markerShadow from 'leaflet/dist/images/marker-shadow.png';

	interface Props {
		userPosition: { lat: number; lng: number };
		concerts: NearbyConcert[];
	}

	let { userPosition, concerts }: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: LeafletMap | undefined;
	const markers: Marker[] = [];

	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

	function escapeHtml(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	onMount(async () => {
		// Chargé dynamiquement : le module leaflet touche `window` à l'import,
		// incompatible avec le rendu SSR de SvelteKit (onMount ne s'exécute
		// jamais côté serveur, donc cet import ne l'est jamais non plus).
		const L = await import('leaflet');

		// Correctif connu Leaflet + bundlers : les icônes par défaut pointent
		// vers des chemins relatifs non résolus par Vite.
		delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
			._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconRetinaUrl: markerIcon2x,
			iconUrl: markerIcon,
			shadowUrl: markerShadow
		});

		map = L.map(mapContainer).setView([userPosition.lat, userPosition.lng], 11);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(map);

		L.marker([userPosition.lat, userPosition.lng])
			.addTo(map)
			.bindPopup('Votre position')
			.openPopup();

		for (const concert of concerts) {
			if (concert.latitude == null || concert.longitude == null) {
				continue;
			}

			const marker = L.marker([concert.latitude, concert.longitude]).addTo(map);
			marker.bindPopup(
				`<strong>${escapeHtml(concert.artistName)}</strong><br>` +
					`${escapeHtml(concert.venueName)}, ${escapeHtml(concert.city)}<br>` +
					`${formatDate(concert.date)}<br>` +
					`<a href="/concerts/${concert.id}">Voir le concert</a>`
			);
			markers.push(marker);
		}
	});

	onDestroy(() => {
		map?.remove();
	});
</script>

<div class="map" bind:this={mapContainer}></div>

<style>
	.map {
		width: 100%;
		height: 100%;
	}
</style>
