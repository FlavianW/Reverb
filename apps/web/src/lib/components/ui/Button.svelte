<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost';
		type?: 'button' | 'submit';
		href?: string;
		disabled?: boolean;
		fullWidth?: boolean;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		type = 'button',
		href,
		disabled = false,
		fullWidth = false,
		onclick,
		children
	}: Props = $props();
</script>

{#if href}
	<a {href} class="btn {variant}" class:full-width={fullWidth}>
		{@render children()}
	</a>
{:else}
	<button {type} class="btn {variant}" class:full-width={fullWidth} {disabled} {onclick}>
		{@render children()}
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.7rem 1.25rem;
		border-radius: var(--radius-sm);
		font-weight: 700;
		font-size: 0.9375rem;
		letter-spacing: 0.01em;
		cursor: pointer;
		border: 1px solid transparent;
		text-decoration: none;
	}

	.btn:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.full-width {
		width: 100%;
	}

	.primary {
		background: var(--accent);
		color: #fbf6ee;
	}

	.primary:hover:not(:disabled) {
		background: var(--accent-deep);
	}

	.secondary {
		background: var(--paper-alt);
		border-color: var(--line);
		color: var(--ink);
	}

	.secondary:hover:not(:disabled) {
		border-color: var(--accent);
	}

	.ghost {
		background: transparent;
		color: var(--ink-soft);
	}

	.ghost:hover:not(:disabled) {
		color: var(--accent);
	}
</style>
