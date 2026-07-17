<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { api } from '$lib/api/client';
	import ConcertHero from '$lib/components/concert/ConcertHero.svelte';
	import SetlistView from '$lib/components/concert/SetlistView.svelte';
	import StarRating from '$lib/components/concert/StarRating.svelte';
	import CommentForm from '$lib/components/concert/CommentForm.svelte';
	import CommentList from '$lib/components/concert/CommentList.svelte';
	import PhotoGrid from '$lib/components/concert/PhotoGrid.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import type { CommentSummary, PhotoSummary } from '@reverb/shared';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const tabs = [
		{ id: 'setlist', label: 'Setlist' },
		{ id: 'media', label: 'Médias' },
		{ id: 'notes', label: 'Notes' }
	];

	let activeTab = $state<string>(data.initialTab);
	let comments = $state(data.concert.comments);
	let photos = $state(data.concert.photos);

	function selectTab(id: string) {
		activeTab = id;
		replaceState(`?onglet=${id}`, {});
	}

	function addComment(comment: CommentSummary) {
		comments = [comment, ...comments];
	}

	async function deleteComment(id: string) {
		await api.deleteComment(id);
		comments = comments.filter((comment) => comment.id !== id);
	}

	function addPhoto(photo: PhotoSummary) {
		photos = [photo, ...photos];
	}

	async function deletePhoto(id: string) {
		await api.deletePhoto(id);
		photos = photos.filter((photo) => photo.id !== id);
	}
</script>

<svelte:head>
	<title>{data.concert.artistName} — Reverb</title>
</svelte:head>

<ConcertHero concert={data.concert} attending={data.attending} />

<div class="page">
	<Tabs {tabs} selected={activeTab} label="Sections du concert" onselect={selectTab} />

	{#if activeTab === 'setlist'}
		<div role="tabpanel" id="panel-setlist" aria-labelledby="tab-setlist" tabindex="0">
			<SetlistView setlist={data.concert.setlist} />
		</div>
	{:else if activeTab === 'media'}
		<div role="tabpanel" id="panel-media" aria-labelledby="tab-media" tabindex="0">
			<PhotoGrid
				{photos}
				concertId={data.concert.id}
				currentUserPseudo={data.user.pseudo}
				onUploaded={addPhoto}
				onDelete={deletePhoto}
			/>
		</div>
	{:else}
		<div role="tabpanel" id="panel-notes" aria-labelledby="tab-notes" tabindex="0">
			<StarRating concertId={data.concert.id} summary={data.concert.rating} />
			<h2 class="section-label">Commentaires</h2>
			<CommentForm
				concertId={data.concert.id}
				currentUserPseudo={data.user.pseudo}
				onAdded={addComment}
			/>
			<CommentList {comments} currentUserPseudo={data.user.pseudo} onDelete={deleteComment} />
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 3rem 5rem;
	}

	.section-label {
		font-size: 0.8125rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-soft);
		font-weight: 400;
		margin: 2rem 0 1.125rem;
	}

	@media (max-width: 640px) {
		.page {
			padding: 0 1.25rem 3rem;
		}
	}
</style>
