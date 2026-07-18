<script lang="ts">
	import { goto } from '$app/navigation';
	import { api, ApiError } from '$lib/api/client';
	import Button from '$lib/components/ui/Button.svelte';
	import type { ViewerFriendshipStatus } from '@reverb/shared';

	interface Props {
		pseudo: string;
		status: ViewerFriendshipStatus;
		friendshipId: string | null;
	}

	let { pseudo, status: initialStatus, friendshipId: initialFriendshipId }: Props = $props();

	let status = $state(initialStatus);
	let friendshipId = $state(initialFriendshipId);
	let pending = $state(false);
	let error = $state<string | null>(null);

	async function sendRequest() {
		pending = true;
		error = null;
		try {
			const friendship = await api.sendFriendRequest(pseudo);
			friendshipId = friendship.id;
			status = friendship.status === 'ACCEPTED' ? 'FRIENDS' : 'PENDING_SENT';
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Une erreur est survenue.';
		} finally {
			pending = false;
		}
	}

	async function accept() {
		if (!friendshipId) return;
		pending = true;
		try {
			await api.acceptFriendRequest(friendshipId);
			status = 'FRIENDS';
		} finally {
			pending = false;
		}
	}

	async function remove() {
		if (!friendshipId) return;
		pending = true;
		try {
			await api.removeFriendship(friendshipId);
			status = 'NONE';
			friendshipId = null;
		} finally {
			pending = false;
		}
	}

	async function message() {
		pending = true;
		error = null;
		try {
			const conversation = await api.startConversation(pseudo);
			await goto(`/messages/${conversation.id}`);
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Une erreur est survenue.';
		} finally {
			pending = false;
		}
	}
</script>

{#if status !== 'SELF'}
	<div class="friend-button">
		{#if status === 'NONE'}
			<Button variant="secondary" disabled={pending} onclick={sendRequest}>
				Ajouter en ami
			</Button>
		{:else if status === 'PENDING_SENT'}
			<Button variant="ghost" disabled={pending} onclick={remove}>Demande envoyée</Button>
		{:else if status === 'PENDING_RECEIVED'}
			<Button variant="secondary" disabled={pending} onclick={accept}>Accepter</Button>
			<Button variant="ghost" disabled={pending} onclick={remove}>Refuser</Button>
		{:else if status === 'FRIENDS'}
			<Button variant="secondary" disabled={pending} onclick={message}>Envoyer un message</Button>
			<Button variant="ghost" disabled={pending} onclick={remove}>Ami·e · Retirer</Button>
		{/if}
		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}
	</div>
{/if}

<style>
	.friend-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.error {
		color: var(--accent-deep);
		font-size: 0.8125rem;
		margin: 0;
	}
</style>
