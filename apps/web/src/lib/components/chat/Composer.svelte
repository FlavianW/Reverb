<script lang="ts">
	interface Props {
		onSend: (content: string) => void;
	}

	let { onSend }: Props = $props();

	let content = $state('');

	function sendCurrentContent() {
		const trimmed = content.trim();
		if (!trimmed) return;
		onSend(trimmed);
		content = '';
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		sendCurrentContent();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendCurrentContent();
		}
	}
</script>

<form class="composer" onsubmit={handleSubmit}>
	<label for="composer-input" class="sr-only">Votre message</label>
	<textarea
		id="composer-input"
		placeholder="Écrire un message…"
		bind:value={content}
		rows="1"
		onkeydown={handleKeydown}
	></textarea>
	<button type="submit">Envoyer</button>
</form>

<style>
	.composer {
		display: flex;
		gap: 0.75rem;
		align-items: flex-end;
	}

	textarea {
		flex: 1;
		resize: none;
		padding: 0.75rem 0.875rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper-alt);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		color: var(--ink);
	}

	button {
		padding: 0.7rem 1.25rem;
		border: 1px solid var(--ink);
		border-radius: var(--radius-sm);
		background: var(--ink);
		color: var(--paper);
		font-family: var(--font-sans);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
