<script lang="ts">
	import { api } from '$lib/api/client';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import ReportButton from '$lib/components/ui/ReportButton.svelte';
	import type { CommentSummary, ReportReason } from '@reverb/shared';

	interface Props {
		comment: CommentSummary;
		canDelete: boolean;
		onDelete: () => Promise<void>;
	}

	let { comment, canDelete, onDelete }: Props = $props();

	const formattedDate = $derived(
		new Date(comment.createdAt).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		})
	);

	function reportComment(reason: ReportReason) {
		return api.reportComment(comment.id, reason);
	}
</script>

<article class="comment">
	<Avatar name={comment.pseudo} size={32} />
	<div class="body">
		<p class="meta"><span class="pseudo">{comment.pseudo}</span> · {formattedDate}</p>
		<p class="content">{comment.content}</p>
		<div class="actions">
			<ReportButton onReport={reportComment} />
			{#if canDelete}
				<button type="button" class="delete" onclick={onDelete}>Supprimer</button>
			{/if}
		</div>
	</div>
</article>

<style>
	.comment {
		display: flex;
		gap: 0.75rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--line);
	}

	.body {
		flex: 1;
	}

	.meta {
		margin: 0 0 0.25rem;
		font-size: 0.8125rem;
		color: var(--ink-soft);
	}

	.pseudo {
		font-weight: 700;
		color: var(--ink);
	}

	.content {
		margin: 0 0 0.5rem;
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.875rem;
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
