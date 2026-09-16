<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Map as LeafletMap } from 'leaflet';
	import type { NearbyConcert } from '@reverb/shared';
	import 'leaflet/dist/leaflet.css';

	interface Props {
		userPosition: { lat: number; lng: number };
		concerts: NearbyConcert[];
	}

	let { userPosition, concerts }: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: LeafletMap | undefined;

	// Tuiles OpenStreetMap brutes : CARTO a fermé son accès anonyme aux fonds
	// de carte (`basemaps.cartocdn.com` renvoie désormais un visuel « API key
	// required » à la place des tuiles). Pas de variante sombre officielle
	// sans clé : le mode sombre est simulé par un filtre CSS plus bas.
	const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

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

		map = L.map(mapContainer).setView([userPosition.lat, userPosition.lng], 11);

		L.tileLayer(TILE_URL, {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19
		}).addTo(map);

		// Marqueurs aux couleurs de Reverb (divIcon + CSS) plutôt que les
		// épingles bleues par défaut de Leaflet.
		const userIcon = L.divIcon({ className: 'user-marker', iconSize: [18, 18] });
		L.marker([userPosition.lat, userPosition.lng], { icon: userIcon })
			.addTo(map)
			.bindPopup('Votre position');

		const concertIcon = L.divIcon({
			className: 'concert-marker',
			html: '♪',
			iconSize: [34, 34],
			popupAnchor: [0, -20]
		});

		for (const concert of concerts) {
			if (concert.latitude == null || concert.longitude == null) {
				continue;
			}

			L.marker([concert.latitude, concert.longitude], { icon: concertIcon })
				.addTo(map)
				.bindPopup(
					`<strong>${escapeHtml(concert.artistName)}</strong><br>` +
						`${escapeHtml(concert.venueName)}, ${escapeHtml(concert.city)}<br>` +
						`${formatDate(concert.date)}<br>` +
						`<a href="/concerts/${concert.id}">Voir le concert</a>`
				);
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

	/* :global() obligatoire : les icônes divIcon sont injectées par Leaflet
	   hors de la portée des styles du composant. */
	.map :global(.user-marker) {
		background: var(--accent);
		border: 3px solid #fff;
		border-radius: 50%;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
	}

	.map :global(.concert-marker) {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--accent);
		color: var(--on-accent);
		border: 2px solid #fff;
		border-radius: 50%;
		font-size: 17px;
		line-height: 1;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
	}

	/* Popups aux couleurs du thème plutôt que le blanc par défaut de Leaflet. */
	.map :global(.leaflet-popup-content-wrapper),
	.map :global(.leaflet-popup-tip) {
		background: var(--paper-alt);
		color: var(--ink);
	}

	.map :global(.leaflet-popup-content a) {
		color: var(--accent);
	}

	/* OpenStreetMap n'a pas de variante sombre en accès libre (contrairement
	   à CARTO) : on approche le thème sombre par inversion de couleurs des
	   tuiles plutôt que d'ajouter une dépendance à un fournisseur payant. */
	:global(html:not([data-theme='light']) .map .leaflet-tile-pane) {
		filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9);
	}
</style>
