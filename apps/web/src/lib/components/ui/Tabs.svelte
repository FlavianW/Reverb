<script lang="ts">
	interface Tab {
		id: string;
		label: string;
	}

	interface Props {
		tabs: Tab[];
		selected: string;
		label: string;
		onselect: (id: string) => void;
	}

	let { tabs, selected, label, onselect }: Props = $props();

	function onKeydown(event: KeyboardEvent, index: number) {
		if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
			return;
		}
		event.preventDefault();
		const delta = event.key === 'ArrowRight' ? 1 : -1;
		const nextIndex = (index + delta + tabs.length) % tabs.length;
		const nextTab = tabs[nextIndex];
		onselect(nextTab.id);
		document.getElementById(`tab-${nextTab.id}`)?.focus();
	}
</script>

<div class="tablist" role="tablist" aria-label={label}>
	{#each tabs as tab, index (tab.id)}
		<button
			type="button"
			role="tab"
			id="tab-{tab.id}"
			aria-selected={selected === tab.id}
			aria-controls="panel-{tab.id}"
			tabindex={selected === tab.id ? 0 : -1}
			class:active={selected === tab.id}
			onclick={() => onselect(tab.id)}
			onkeydown={(event) => onKeydown(event, index)}
		>
			{tab.label}
		</button>
	{/each}
</div>

<style>
	.tablist {
		display: flex;
		gap: 1.75rem;
		border-bottom: 1px solid var(--line);
		margin-bottom: 1.75rem;
	}

	button {
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		padding: 0.75rem 0.125rem;
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		color: var(--ink-soft);
		cursor: pointer;
	}

	button.active {
		color: var(--ink);
		border-bottom-color: var(--accent);
		font-weight: 600;
	}
</style>
