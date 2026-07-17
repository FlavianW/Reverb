<script lang="ts">
	import { api } from '$lib/api/client';
	import ReportButton from '$lib/components/ui/ReportButton.svelte';
	import type { PhotoSummary, ReportReason } from '@reverb/shared';

	interface Props {
		photo: PhotoSummary;
		canDelete: boolean;
		onDelete: () => Promise<void>;
	}

	let { photo, canDelete, onDelete }: Props = $props();

	function reportPhoto(reason: ReportReason) {
		return api.reportPhoto(photo.id, reason);
	}
</script>

<figure class="tile">
	<img src={photo.url} alt="Photo du concert ajoutée par {photo.pseudo}" loading="lazy" />
	<figcaption>
		<span class="pseudo">{photo.pseudo}</span>
		<span class="actions">
			<ReportButton onReport={reportPhoto} />
			{#if canDelete}
				<button type="button" class="delete" onclick={onDelete}>Supprimer</button>
			{/if}
		</span>
	</figcaption>
</figure>

<style>
	.tile {
		margin: 0;
		border-radius: var(--radius-md);
		overflow: hidden;
		border: 1px solid var(--line);
		background: var(--paper-alt);
	}

	.tile img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		display: block;
	}

	figcaption {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		font-size: 0.8125rem;
	}

	.pseudo {
		font-weight: 700;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex-shrink: 0;
	}

	.delete {
		background: none;
		border: none;
		padding: 0;
		color: var(--ink-soft);
		font-size: 0.8125rem;
		text-decoration: underline;
		cursor: pointer;
	}
</style>
