<script lang="ts">
	import CommentItem from './CommentItem.svelte';
	import type { CommentSummary } from '@reverb/shared';

	interface Props {
		comments: CommentSummary[];
		currentUserPseudo: string;
		onDelete: (id: string) => Promise<void>;
	}

	let { comments, currentUserPseudo, onDelete }: Props = $props();
</script>

{#if comments.length === 0}
	<p class="empty">Aucun commentaire pour l'instant.</p>
{:else}
	<div class="comments">
		{#each comments as comment (comment.id)}
			<CommentItem
				{comment}
				canDelete={comment.pseudo === currentUserPseudo}
				onDelete={() => onDelete(comment.id)}
			/>
		{/each}
	</div>
{/if}

<style>
	.empty {
		color: var(--ink-soft);
	}
</style>
