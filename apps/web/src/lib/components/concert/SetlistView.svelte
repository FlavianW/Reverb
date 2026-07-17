<script lang="ts">
	import type { SetlistFmResult } from '@reverb/shared';

	interface Props {
		setlist: SetlistFmResult | null;
	}

	let { setlist }: Props = $props();
</script>

{#if setlist === null}
	<p class="empty">Setlist indisponible pour ce concert.</p>
{:else if setlist.songs.length === 0}
	<p class="empty">Aucun titre renseigné pour cette setlist.</p>
{:else}
	<ol class="songs">
		{#each setlist.songs as song, index (index)}
			<li>{song}</li>
		{/each}
	</ol>
{/if}

<style>
	.empty {
		color: var(--ink-soft);
	}

	.songs {
		max-width: 480px;
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: song;
	}

	.songs li {
		counter-increment: song;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--line);
		font-family: var(--font-serif);
		font-size: 1.0625rem;
	}

	.songs li::before {
		content: counter(song) '. ';
		color: var(--ink-soft);
		font-family: var(--font-sans);
		font-size: 0.875rem;
	}
</style>
