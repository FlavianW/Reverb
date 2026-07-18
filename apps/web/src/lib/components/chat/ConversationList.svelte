<script lang="ts">
	import type { ConversationSummary } from '@reverb/shared';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	interface Props {
		conversations: ConversationSummary[];
	}

	let { conversations }: Props = $props();

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
	}
</script>

{#if conversations.length === 0}
	<p class="empty">Aucune conversation. Écrivez à un ami depuis son profil.</p>
{:else}
	<ul class="list">
		{#each conversations as conversation (conversation.id)}
			<li>
				<a
					class="row"
					class:unread={conversation.unreadCount > 0}
					href="/messages/{conversation.id}"
				>
					<Avatar
						src={conversation.otherUser.avatarUrl}
						name={conversation.otherUser.pseudo}
						size={40}
					/>
					<div class="details">
						<span class="pseudo">{conversation.otherUser.pseudo}</span>
						{#if conversation.lastMessage}
							<span class="preview">{conversation.lastMessage.content}</span>
						{/if}
					</div>
					<div class="meta">
						<span class="date">{formatDate(conversation.updatedAt)}</span>
						{#if conversation.unreadCount > 0}
							<span class="badge">{conversation.unreadCount}</span>
						{/if}
					</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.empty {
		color: var(--ink-soft);
		font-size: 0.875rem;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem;
		border-radius: var(--radius-sm);
		text-decoration: none;
		color: inherit;
	}

	.row:hover,
	.row:focus-visible {
		background: var(--paper);
	}

	.details {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.pseudo {
		font-family: var(--font-serif);
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--ink);
	}

	.row.unread .pseudo {
		font-weight: 700;
	}

	.preview {
		font-size: 0.8125rem;
		color: var(--ink-soft);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.date {
		font-size: 0.6875rem;
		color: var(--ink-soft);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.125rem;
		height: 1.125rem;
		padding: 0 0.3125rem;
		border-radius: 999px;
		background: var(--accent);
		color: var(--paper-alt);
		font-size: 0.6875rem;
		font-weight: 700;
	}
</style>
