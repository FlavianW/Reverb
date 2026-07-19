<script lang="ts">
	import { goto } from '$app/navigation';
	import { api, ApiError } from '$lib/api/client';
	import ArtistAutocomplete from '$lib/components/ui/ArtistAutocomplete.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import ImageCropModal from '$lib/components/ui/ImageCropModal.svelte';
	import type { PublicUser } from '@reverb/shared';

	type CropTarget = { kind: 'avatar' | 'banner'; file: File };

	interface Props {
		user: PublicUser;
	}

	let { user }: Props = $props();

	const uid = $props.id();

	let dialogEl: HTMLDialogElement | undefined = $state();
	let pseudo = $state(user.pseudo);
	let bio = $state(user.bio ?? '');
	let favoriteArtist = $state(user.favoriteArtist ?? '');
	let avatarFile = $state<File | null>(null);
	let avatarPreview = $state<string | null>(user.avatarUrl);
	let bannerFile = $state<File | null>(null);
	let bannerPreview = $state<string | null>(user.bannerUrl);
	let cropTarget = $state<CropTarget | null>(null);
	let submitting = $state(false);
	let error = $state('');

	function openDialog() {
		pseudo = user.pseudo;
		bio = user.bio ?? '';
		favoriteArtist = user.favoriteArtist ?? '';
		avatarFile = null;
		avatarPreview = user.avatarUrl;
		bannerFile = null;
		bannerPreview = user.bannerUrl;
		error = '';
		dialogEl?.showModal();
	}

	function closeDialog() {
		dialogEl?.close();
	}

	function onAvatarChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) {
			return;
		}
		cropTarget = { kind: 'avatar', file };
	}

	function onBannerChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) {
			return;
		}
		cropTarget = { kind: 'banner', file };
	}

	function onCropConfirm(blob: Blob) {
		if (!cropTarget) return;
		const cropped = new File([blob], `${cropTarget.kind}.jpg`, { type: 'image/jpeg' });
		if (cropTarget.kind === 'avatar') {
			avatarFile = cropped;
			avatarPreview = URL.createObjectURL(cropped);
		} else {
			bannerFile = cropped;
			bannerPreview = URL.createObjectURL(cropped);
		}
		cropTarget = null;
	}

	function onCropCancel() {
		cropTarget = null;
	}

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		error = '';
		try {
			if (avatarFile) {
				await api.uploadAvatar(avatarFile);
			}
			if (bannerFile) {
				await api.uploadBanner(bannerFile);
			}
			const updated = await api.updateProfile({ pseudo, bio, favoriteArtist });
			dialogEl?.close();
			await goto(`/profil/${updated.pseudo}`, { invalidateAll: true });
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Une erreur est survenue.';
		} finally {
			submitting = false;
		}
	}
</script>

<Button variant="secondary" onclick={openDialog}>Modifier le profil</Button>

<dialog bind:this={dialogEl} aria-labelledby="edit-profile-heading-{uid}">
	<form onsubmit={onSubmit}>
		<h2 id="edit-profile-heading-{uid}">Modifier le profil</h2>

		<div
			class="banner-field"
			style:background-image={bannerPreview ? `url(${bannerPreview})` : undefined}
		>
			<label class="banner-upload" for="banner-upload-{uid}">
				Changer la bannière
				<input
					id="banner-upload-{uid}"
					type="file"
					accept="image/*"
					class="sr-only"
					onchange={onBannerChange}
				/>
			</label>
		</div>

		<div class="avatar-field">
			<Avatar src={avatarPreview} name={pseudo} size={64} />
			<label class="avatar-upload" for="avatar-upload-{uid}">
				Changer la photo
				<input
					id="avatar-upload-{uid}"
					type="file"
					accept="image/*"
					class="sr-only"
					onchange={onAvatarChange}
				/>
			</label>
		</div>

		<FormField id="edit-pseudo-{uid}" label="Pseudo" bind:value={pseudo} required />
		<FormField id="edit-bio-{uid}" label="Bio" bind:value={bio} multiline />
		<ArtistAutocomplete
			id="edit-favorite-artist-{uid}"
			label="Artiste favori"
			bind:value={favoriteArtist}
		/>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<div class="actions">
			<button type="button" onclick={closeDialog}>Annuler</button>
			<Button type="submit" disabled={submitting}>Enregistrer</Button>
		</div>
	</form>
</dialog>

{#if cropTarget}
	{#if cropTarget.kind === 'avatar'}
		<ImageCropModal
			file={cropTarget.file}
			title="Recadrer la photo de profil"
			aspectRatio={1}
			outputWidth={480}
			outputHeight={480}
			circular
			onConfirm={onCropConfirm}
			onCancel={onCropCancel}
		/>
	{:else}
		<ImageCropModal
			file={cropTarget.file}
			title="Recadrer la bannière"
			aspectRatio={3}
			outputWidth={1500}
			outputHeight={500}
			onConfirm={onCropConfirm}
			onCancel={onCropCancel}
		/>
	{/if}
{/if}

<style>
	dialog {
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		padding: 1.75rem;
		max-width: 400px;
		width: 90vw;
		color: var(--ink);
		background: var(--paper-alt);
	}

	dialog::backdrop {
		background: rgba(28, 26, 23, 0.4);
	}

	h2 {
		font-size: 1.125rem;
		margin: 0 0 1.25rem;
	}

	.banner-field {
		height: 90px;
		border-radius: var(--radius-sm);
		margin-bottom: 1rem;
		background-color: var(--accent-soft);
		background-size: cover;
		background-position: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.banner-upload {
		font-size: 0.875rem;
		color: var(--accent-deep);
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-sm);
		background: var(--paper-alt);
	}

	.avatar-field {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.avatar-upload {
		font-size: 0.875rem;
		color: var(--accent);
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
	}

	.error {
		margin: -0.5rem 0 1rem;
		font-size: 0.8125rem;
		color: var(--accent-deep);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.625rem;
		margin-top: 0.5rem;
	}

	.actions button[type='button'] {
		padding: 0.7rem 1.25rem;
		border-radius: var(--radius-sm);
		font-size: 0.9375rem;
		background: none;
		border: 1px solid var(--line);
		color: var(--ink);
		cursor: pointer;
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
