<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Map as LeafletMap, TileLayer } from 'leaflet';
	import type { NearbyConcert } from '@reverb/shared';
	import 'leaflet/dist/leaflet.css';

	interface Props {
		userPosition: { lat: number; lng: number };
		concerts: NearbyConcert[];
	}

	let { userPosition, concerts }: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: LeafletMap | undefined;
	let tileLayer: TileLayer | undefined;
	let themeObserver: MutationObserver | undefined;

	/** Fond de carte CARTO assorti au thème de l'app (sombre par défaut). */
	const tileUrlFor = (theme: string | undefined) =>
		`https://{s}.basemaps.cartocdn.com/${theme === 'light' ? 'light_all' : 'dark_all'}/{z}/{x}/{y}{r}.png`;

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

		tileLayer = L.tileLayer(tileUrlFor(document.documentElement.dataset.theme), {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
			subdomains: 'abcd',
			maxZoom: 19
		}).addTo(map);

		// La bascule de thème pose `data-theme` sur <html> : on change le fond
		// de carte en direct pour qu'il reste assorti sans recharger la page.
		themeObserver = new MutationObserver(() => {
			tileLayer?.setUrl(tileUrlFor(document.documentElement.dataset.theme));
		});
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

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
		themeObserver?.disconnect();
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
</style>
