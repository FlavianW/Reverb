<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props {
		id: string;
		label: string;
		type?: string;
		value: string;
		placeholder?: string;
		error?: string;
		multiline?: boolean;
		required?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
	}

	let {
		id,
		label,
		type = 'text',
		value = $bindable(),
		placeholder,
		error,
		multiline = false,
		required = false,
		autocomplete
	}: Props = $props();

	const errorId = $derived(`${id}-error`);
</script>

<div class="field">
	<label for={id}>{label}</label>
	{#if multiline}
		<textarea
			{id}
			bind:value
			{placeholder}
			{required}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? errorId : undefined}
		></textarea>
	{:else}
		<input
			{id}
			{type}
			bind:value
			{placeholder}
			{required}
			{autocomplete}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? errorId : undefined}
		/>
	{/if}
	{#if error}
		<p id={errorId} class="error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.field {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		font-size: 0.8125rem;
		color: var(--ink-soft);
		margin-bottom: 0.375rem;
	}

	input,
	textarea {
		width: 100%;
		padding: 0.75rem 0.875rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper-alt);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		color: var(--ink);
	}

	textarea {
		min-height: 5rem;
		resize: vertical;
	}

	input[aria-invalid='true'],
	textarea[aria-invalid='true'] {
		border-color: var(--accent);
	}

	.error {
		margin: 0.375rem 0 0;
		font-size: 0.8125rem;
		color: var(--accent-deep);
	}
</style>
