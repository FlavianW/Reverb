<script lang="ts">
	import { api } from '$lib/api/client';
	import type { PostSummary } from '@reverb/shared';
	import PostCard from './PostCard.svelte';

	interface Props {
		items: PostSummary[];
		cursor: string | null;
		currentUserPseudo: string;
		source: { type: 'feed' } | { type: 'user'; pseudo: string };
	}

	let {
		items = $bindable(),
		cursor = $bindable(),
		currentUserPseudo,
		source
	}: Props = $props();

	let loading = $state(false);

	async function loadMore() {
		if (!cursor) return;
		loading = true;
		try {
			const page =
				source.type === 'feed'
					? await api.getFeed(cursor)
					: await api.getUserPosts(source.pseudo, cursor);
			items = [...items, ...page.items];
			cursor = page.nextCursor;
		} finally {
			loading = false;
		}
	}

	async function remove(id: string) {
		await api.deletePost(id);
		items = items.filter((item) => item.id !== id);
	}
</script>

{#if items.length === 0}
	<p class="empty">Aucun post pour l'instant.</p>
{:else}
	<div class="list">
		{#each items as post (post.id)}
			<PostCard
				{post}
				canDelete={post.type === 'PHOTO' && post.author.pseudo === currentUserPseudo}
				onDelete={() => remove(post.id)}
			/>
		{/each}
	</div>
	{#if cursor}
		<button type="button" class="load-more" onclick={loadMore} disabled={loading}>
			{loading ? 'Chargement…' : 'Charger plus'}
		</button>
	{/if}
{/if}

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.empty {
		color: var(--ink-soft);
	}

	.load-more {
		display: block;
		margin: 1.5rem auto 0;
		padding: 0.625rem 1.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper-alt);
		color: var(--ink);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.load-more:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
</style>
