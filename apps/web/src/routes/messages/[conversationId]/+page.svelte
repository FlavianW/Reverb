<script lang="ts">
	import MessageThread from '$lib/components/chat/MessageThread.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<MessageThread
	conversationId={data.conversationId}
	initialItems={data.messages.items}
	initialCursor={data.messages.nextCursor}
/>
