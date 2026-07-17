<script lang="ts">
	import { api, ApiError } from '$lib/api/client';
	import type { PhotoSummary } from '@reverb/shared';

	interface Props {
		concertId: string;
		onUploaded: (photo: PhotoSummary) => void;
	}

	let { concertId, onUploaded }: Props = $props();

	const uid = $props.id();
	let uploading = $state(false);
	let error = $state('');

	async function onChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			return;
		}
		uploading = true;
		error = '';
		try {
			const photo = await api.uploadPhoto(concertId, file);
			onUploaded(photo);
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Une erreur est survenue.';
		} finally {
			uploading = false;
			input.value = '';
		}
	}
</script>

<div class="upload">
	<label class="upload-tile" class:disabled={uploading} for="photo-upload-{uid}">
		<span class="plus" aria-hidden="true">+</span>
		<span>{uploading ? 'Envoi…' : 'Ajouter une photo'}</span>
		<input
			id="photo-upload-{uid}"
			type="file"
			accept="image/*"
			class="sr-only"
			disabled={uploading}
			onchange={onChange}
		/>
	</label>
	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.upload-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		aspect-ratio: 1;
		border: 1px dashed var(--line);
		border-radius: var(--radius-md);
		color: var(--ink-soft);
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.upload-tile:hover,
	.upload-tile:focus-within {
		border-color: var(--accent);
		color: var(--accent);
	}

	.upload-tile.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.plus {
		font-size: 1.5rem;
	}

	.error {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: var(--accent-deep);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
