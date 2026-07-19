<script lang="ts">
	import { api } from '$lib/api/client';
	import type { ArtistSuggestion } from '@reverb/shared';

	interface Props {
		id: string;
		label: string;
		value: string;
	}

	let { id, label, value = $bindable() }: Props = $props();

	let suggestions = $state<ArtistSuggestion[]>([]);
	let open = $state(false);
	let activeIndex = $state(-1);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	const listboxId = `${id}-listbox`;

	function onInput() {
		activeIndex = -1;
		clearTimeout(debounceTimer);

		const query = value.trim();
		if (query.length < 2) {
			suggestions = [];
			open = false;
			return;
		}

		debounceTimer = setTimeout(async () => {
			try {
				suggestions = await api.searchArtists(query);
			} catch {
				suggestions = [];
			}
			open = suggestions.length > 0;
		}, 300);
	}

	function select(suggestion: ArtistSuggestion) {
		value = suggestion.name;
		suggestions = [];
		open = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (!open || suggestions.length === 0) {
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = (activeIndex + 1) % suggestions.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
		} else if (event.key === 'Enter' && activeIndex >= 0) {
			event.preventDefault();
			select(suggestions[activeIndex]);
		} else if (event.key === 'Escape') {
			open = false;
		}
	}

	function onBlur() {
		// Laisse le temps au clic sur une suggestion de s'exécuter avant fermeture.
		setTimeout(() => {
			open = false;
		}, 150);
	}
</script>

<div class="field">
	<label for={id}>{label}</label>
	<div class="combobox">
		<input
			{id}
			type="text"
			bind:value
			oninput={onInput}
			onkeydown={onKeydown}
			onfocus={() => (open = suggestions.length > 0)}
			onblur={onBlur}
			role="combobox"
			aria-expanded={open}
			aria-controls={listboxId}
			aria-autocomplete="list"
			autocomplete="off"
		/>
		{#if open}
			<ul class="suggestions" id={listboxId} role="listbox">
				{#each suggestions as suggestion, index (suggestion.name)}
					<li role="option" aria-selected={index === activeIndex}>
						<button
							type="button"
							class="suggestion"
							class:active={index === activeIndex}
							onclick={() => select(suggestion)}
						>
							{#if suggestion.imageUrl}
								<img src={suggestion.imageUrl} alt="" width="28" height="28" />
							{:else}
								<span class="placeholder" aria-hidden="true"
									>{suggestion.name.charAt(0).toUpperCase()}</span
								>
							{/if}
							<span>{suggestion.name}</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
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

	.combobox {
		position: relative;
	}

	input {
		width: 100%;
		padding: 0.75rem 0.875rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper-alt);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		color: var(--ink);
	}

	.suggestions {
		position: absolute;
		z-index: 10;
		top: calc(100% + 0.25rem);
		left: 0;
		right: 0;
		margin: 0;
		padding: 0.25rem;
		list-style: none;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper-alt);
		box-shadow: 0 4px 16px rgba(28, 26, 23, 0.12);
		max-height: 260px;
		overflow-y: auto;
	}

	.suggestion {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		font-family: var(--font-sans);
		font-size: 0.875rem;
		color: var(--ink);
		text-align: left;
		cursor: pointer;
	}

	.suggestion.active,
	.suggestion:hover {
		background: var(--accent-soft);
	}

	.suggestion img {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.placeholder {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--accent-soft);
		color: var(--accent-deep);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		flex-shrink: 0;
	}
</style>
