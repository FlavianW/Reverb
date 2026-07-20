<script lang="ts">
	import MessageThread from '$lib/components/chat/MessageThread.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// `data.conversations` vient du +layout.server.ts parent (chargé pour la
	// liste latérale) : réutilisé ici pour titrer l'onglet avec l'interlocuteur
	// plutôt qu'un générique « Messages » identique sur toutes les conversations.
	const otherUserPseudo = $derived(
		data.conversations.find((conversation) => conversation.id === data.conversationId)?.otherUser
			.pseudo
	);
</script>

<svelte:head>
	<title>{otherUserPseudo ? `${otherUserPseudo} — Messages` : 'Messages'} — Reverb</title>
</svelte:head>

<MessageThread
	conversationId={data.conversationId}
	initialItems={data.messages.items}
	initialCursor={data.messages.nextCursor}
/>
