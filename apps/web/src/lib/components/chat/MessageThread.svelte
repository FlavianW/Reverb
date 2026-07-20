<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/state';
	import { api } from '$lib/api/client';
	import { createChatSocket, type ChatSocket } from '$lib/realtime/socket';
	import type { MessageSummary } from '@reverb/shared';
	import MessageBubble from './MessageBubble.svelte';
	import Composer from './Composer.svelte';

	interface Props {
		conversationId: string;
		initialItems: MessageSummary[];
		initialCursor: string | null;
	}

	let { conversationId, initialItems, initialCursor }: Props = $props();

	let items = $state(initialItems);
	let cursor = $state(initialCursor);
	let loadingOlder = $state(false);
	let socket: ChatSocket | undefined;

	const currentUserId = $derived(page.data.user?.id);

	onMount(() => {
		socket = createChatSocket();
		// `ready` confirme que l'authentification du socket (vérification du
		// cookie de session) est terminée côté serveur : émettre avant risquerait
		// que `joinConversation` arrive trop tôt et soit silencieusement ignoré.
		socket.on('ready', () => {
			socket?.emit('joinConversation', { conversationId });
		});
		socket.on('message:new', (message) => {
			if (message.conversationId !== conversationId) return;
			items = [...items, message];
			void api.markConversationRead(conversationId);
		});
	});

	onDestroy(() => {
		socket?.disconnect();
	});

	async function loadOlder() {
		if (!cursor) return;
		loadingOlder = true;
		try {
			const olderPage = await api.getMessages(conversationId, cursor);
			items = [...olderPage.items, ...items];
			cursor = olderPage.nextCursor;
		} finally {
			loadingOlder = false;
		}
	}

	function send(content: string) {
		socket?.emit('sendMessage', { conversationId, content });
	}
</script>

<div class="thread">
	{#if cursor}
		<button type="button" class="load-older" onclick={loadOlder} disabled={loadingOlder}>
			{loadingOlder ? 'Chargement…' : 'Charger les messages plus anciens'}
		</button>
	{/if}

	<div class="messages" role="log" aria-live="polite" aria-label="Messages de la conversation">
		{#each items as message (message.id)}
			<MessageBubble {message} isOwn={message.senderId === currentUserId} />
		{/each}
	</div>

	<Composer onSend={send} />
</div>

<style>
	.thread {
		display: flex;
		flex-direction: column;
		flex: 1;
		padding: 1.5rem;
		gap: 1rem;
		min-height: 0;
	}

	.messages {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		overflow-y: auto;
	}

	.load-older {
		align-self: center;
		padding: 0.5rem 1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper-alt);
		color: var(--ink);
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.load-older:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
</style>
