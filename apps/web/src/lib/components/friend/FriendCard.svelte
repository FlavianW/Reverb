<script lang="ts">
	import type { FriendshipSummary } from '@reverb/shared';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		friendship: FriendshipSummary;
		kind: 'friend' | 'received' | 'sent';
		onAccept?: () => Promise<void>;
		onRemove: () => Promise<void>;
	}

	let { friendship, kind, onAccept, onRemove }: Props = $props();

	let pending = $state(false);

	async function handle(action: () => Promise<void>) {
		pending = true;
		try {
			await action();
		} finally {
			pending = false;
		}
	}
</script>

<div class="card">
	<a class="identity" href="/profil/{friendship.user.pseudo}">
		<Avatar src={friendship.user.avatarUrl} name={friendship.user.pseudo} size={44} />
		<span class="pseudo">{friendship.user.pseudo}</span>
	</a>

	<div class="actions">
		{#if kind === 'friend'}
			<Button variant="ghost" disabled={pending} onclick={() => handle(onRemove)}>Retirer</Button>
		{:else if kind === 'received'}
			<Button variant="primary" disabled={pending} onclick={() => handle(() => onAccept!())}>
				Accepter
			</Button>
			<Button variant="ghost" disabled={pending} onclick={() => handle(onRemove)}>Refuser</Button>
		{:else}
			<span class="pending-label">Demande envoyée</span>
			<Button variant="ghost" disabled={pending} onclick={() => handle(onRemove)}>Annuler</Button>
		{/if}
	</div>
</div>

<style>
	.card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--paper-alt);
	}

	.identity {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		text-decoration: none;
		color: inherit;
		min-width: 0;
	}

	.pseudo {
		font-family: var(--font-serif);
		font-size: 1.0625rem;
		font-weight: 500;
		color: var(--ink);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.pending-label {
		color: var(--ink-soft);
		font-size: 0.8125rem;
	}
</style>
