<script lang="ts">
	import { page } from '$app/state';
	import ConversationList from '$lib/components/chat/ConversationList.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// Sur mobile, le panneau des conversations cède la place au fil ouvert.
	const threadOpen = $derived(Boolean(page.params.conversationId));
</script>

<svelte:head>
	<title>Messages — Reverb</title>
</svelte:head>

<div class="layout" class:thread-open={threadOpen}>
	<aside class="sidebar">
		<h1>Messages</h1>
		<ConversationList conversations={data.conversations} />
	</aside>
	<div class="thread">
		{@render children()}
	</div>
</div>

<style>
	.layout {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 320px 1fr;
		/* Hauteur de la fenêtre moins la topbar et, sur mobile, la barre de
		   navigation basse (variable posée par AppShell) — sans quoi le
		   composer du fil de discussion passerait dessous. `dvh` suit la
		   barre d'URL mobile qui se replie ; `vh` reste en secours. */
		min-height: calc(100vh - 73px - var(--bottom-nav-height, 0px));
		min-height: calc(100dvh - 73px - var(--bottom-nav-height, 0px));
	}

	.sidebar {
		border-right: 1px solid var(--line);
		padding: 2rem 1.5rem;
		overflow-y: auto;
	}

	h1 {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 400;
		font-size: 1.5rem;
		margin: 0 0 1.5rem;
	}

	.thread {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	@media (max-width: 720px) {
		.layout {
			grid-template-columns: 1fr;
		}

		.layout.thread-open .sidebar {
			display: none;
		}

		.layout:not(.thread-open) .thread {
			display: none;
		}
	}
</style>
