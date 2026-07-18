<script lang="ts">
	import type { MessageSummary } from '@reverb/shared';

	interface Props {
		message: MessageSummary;
		isOwn: boolean;
	}

	let { message, isOwn }: Props = $props();

	const time = new Date(message.createdAt).toLocaleTimeString('fr-FR', {
		hour: '2-digit',
		minute: '2-digit'
	});
</script>

<div class="bubble-row" class:own={isOwn}>
	<div class="bubble">
		<p class="content">{message.content}</p>
		<span class="time">{time}</span>
	</div>
</div>

<style>
	.bubble-row {
		display: flex;
	}

	.bubble-row.own {
		justify-content: flex-end;
	}

	.bubble {
		max-width: 70%;
		padding: 0.625rem 0.875rem;
		border-radius: var(--radius-md);
		background: var(--paper-alt);
		border: 1px solid var(--line);
	}

	.own .bubble {
		background: var(--accent-soft);
		border-color: transparent;
	}

	.content {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--ink);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.time {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.6875rem;
		color: var(--ink-soft);
		text-align: right;
	}
</style>
