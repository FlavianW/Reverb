<script lang="ts">
	import PhotoTile from './PhotoTile.svelte';
	import PhotoUploadTile from './PhotoUploadTile.svelte';
	import type { PhotoSummary } from '@reverb/shared';

	interface Props {
		photos: PhotoSummary[];
		concertId: string;
		currentUserPseudo: string;
		onUploaded: (photo: PhotoSummary) => void;
		onDelete: (id: string) => Promise<void>;
	}

	let { photos, concertId, currentUserPseudo, onUploaded, onDelete }: Props = $props();
</script>

<div class="grid">
	{#each photos as photo (photo.id)}
		<PhotoTile
			{photo}
			canDelete={photo.pseudo === currentUserPseudo}
			onDelete={() => onDelete(photo.id)}
		/>
	{/each}
	<PhotoUploadTile {concertId} {onUploaded} />
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1rem;
	}
</style>
