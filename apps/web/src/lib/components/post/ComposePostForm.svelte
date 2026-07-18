<script lang="ts">
	import { api, ApiError } from '$lib/api/client';
	import type { Concert, PostSummary } from '@reverb/shared';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		onPosted: (post: PostSummary) => void;
	}

	let { onPosted }: Props = $props();

	let content = $state('');
	let photos = $state<File[]>([]);
	let concertQuery = $state('');
	let concertResults = $state<Concert[]>([]);
	let selectedConcert = $state<Concert | null>(null);
	let submitting = $state(false);
	let error = $state<string | null>(null);

	function handleFiles(event: Event) {
		const input = event.target as HTMLInputElement;
		photos = input.files ? Array.from(input.files).slice(0, 4) : [];
	}

	async function searchConcerts() {
		if (!concertQuery.trim()) {
			concertResults = [];
			return;
		}
		concertResults = await api.searchConcerts(concertQuery.trim());
	}

	function pickConcert(concert: Concert) {
		selectedConcert = concert;
		concertResults = [];
		concertQuery = '';
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!content.trim() && photos.length === 0) {
			error = 'Ajoutez du texte ou au moins une photo.';
			return;
		}

		submitting = true;
		error = null;
		try {
			const post = await api.createPost({
				content: content.trim() || undefined,
				concertId: selectedConcert?.id,
				photos
			});
			content = '';
			photos = [];
			selectedConcert = null;
			onPosted(post);
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Une erreur est survenue.';
		} finally {
			submitting = false;
		}
	}
</script>

<form class="compose" onsubmit={submit}>
	<label for="compose-content" class="sr-only">Quoi de neuf ?</label>
	<textarea
		id="compose-content"
		placeholder="Quoi de neuf ?"
		bind:value={content}
		rows="3"
	></textarea>

	{#if selectedConcert}
		<p class="selected-concert">
			À propos de <strong>{selectedConcert.artistName}</strong>
			<button type="button" onclick={() => (selectedConcert = null)}>Retirer</button>
		</p>
	{:else}
		<div class="concert-search">
			<label for="compose-concert" class="sr-only">Associer un concert (facultatif)</label>
			<input
				id="compose-concert"
				type="text"
				placeholder="Associer un concert (facultatif)…"
				bind:value={concertQuery}
				oninput={searchConcerts}
				autocomplete="off"
			/>
			{#if concertResults.length > 0}
				<ul class="concert-results">
					{#each concertResults as concert (concert.id)}
						<li>
							<button type="button" onclick={() => pickConcert(concert)}>
								{concert.artistName} — {concert.venueName}, {concert.city}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}

	<div class="photo-input">
		<label for="compose-photos">Ajouter des photos (4 maximum)</label>
		<input
			id="compose-photos"
			type="file"
			accept="image/jpeg,image/png,image/webp"
			multiple
			onchange={handleFiles}
		/>
		{#if photos.length > 0}
			<p class="photo-count">
				{photos.length} photo{photos.length > 1 ? 's' : ''} sélectionnée{photos.length > 1
					? 's'
					: ''}
			</p>
		{/if}
	</div>

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}

	<Button type="submit" disabled={submitting}>Publier</Button>
</form>

<style>
	.compose {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		padding: 1.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--paper-alt);
		margin-bottom: 2rem;
	}

	textarea {
		resize: vertical;
		padding: 0.75rem 0.875rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		color: var(--ink);
	}

	.concert-search {
		position: relative;
	}

	.concert-search input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper);
		font-family: var(--font-sans);
		font-size: 0.875rem;
		color: var(--ink);
	}

	.concert-results {
		position: absolute;
		z-index: 10;
		top: 100%;
		left: 0;
		right: 0;
		margin: 0.25rem 0 0;
		padding: 0.25rem;
		list-style: none;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper-alt);
		max-height: 200px;
		overflow-y: auto;
	}

	.concert-results button {
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.625rem;
		border: none;
		background: none;
		font-size: 0.8125rem;
		color: var(--ink);
		cursor: pointer;
		border-radius: var(--radius-sm);
	}

	.concert-results button:hover,
	.concert-results button:focus-visible {
		background: var(--accent-soft);
	}

	.selected-concert {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--ink-soft);
		margin: 0;
	}

	.selected-concert button {
		border: none;
		background: none;
		color: var(--accent-deep);
		text-decoration: underline;
		font-size: 0.8125rem;
		cursor: pointer;
		padding: 0;
	}

	.photo-input label {
		display: block;
		font-size: 0.8125rem;
		color: var(--ink-soft);
		margin-bottom: 0.375rem;
	}

	.photo-count {
		font-size: 0.8125rem;
		color: var(--ink-soft);
		margin: 0.375rem 0 0;
	}

	.error {
		color: var(--accent-deep);
		font-size: 0.875rem;
		margin: 0;
	}
</style>
