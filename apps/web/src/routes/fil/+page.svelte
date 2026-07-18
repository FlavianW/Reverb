<script lang="ts">
	import ComposePostForm from '$lib/components/post/ComposePostForm.svelte';
	import PostList from '$lib/components/post/PostList.svelte';
	import type { PostSummary } from '@reverb/shared';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let items = $state(data.feed.items);
	let cursor = $state(data.feed.nextCursor);

	function handlePosted(post: PostSummary) {
		items = [post, ...items];
	}
</script>

<svelte:head>
	<title>Fil — Reverb</title>
</svelte:head>

<div class="page">
	<h1>Fil d'actualité</h1>

	<ComposePostForm onPosted={handlePosted} />

	<PostList
		bind:items
		bind:cursor
		currentUserPseudo={data.user?.pseudo ?? ''}
		source={{ type: 'feed' }}
	/>
</div>

<style>
	.page {
		max-width: 640px;
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

	@media (max-width: 640px) {
		.page {
			padding: 2rem 1.25rem 3rem;
		}
	}
</style>
