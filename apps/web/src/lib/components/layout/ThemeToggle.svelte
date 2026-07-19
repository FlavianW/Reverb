<script lang="ts">
	import { onMount } from 'svelte';
	import { currentTheme, setTheme } from '$lib/theme';

	let isDark = $state(false);

	onMount(() => {
		isDark = currentTheme() === 'dark';
	});

	function toggle() {
		const next = isDark ? 'light' : 'dark';
		setTheme(next);
		isDark = !isDark;
	}
</script>

<button
	type="button"
	class="toggle"
	onclick={toggle}
	aria-label={isDark ? 'Passer au thème clair' : 'Passer au thème sombre'}
	title={isDark ? 'Thème clair' : 'Thème sombre'}
>
	{#if isDark}
		<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
			<circle cx="12" cy="12" r="5" fill="currentColor" />
			<g stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<line x1="12" y1="1.5" x2="12" y2="4" />
				<line x1="12" y1="20" x2="12" y2="22.5" />
				<line x1="1.5" y1="12" x2="4" y2="12" />
				<line x1="20" y1="12" x2="22.5" y2="12" />
				<line x1="4.4" y1="4.4" x2="6.2" y2="6.2" />
				<line x1="17.8" y1="17.8" x2="19.6" y2="19.6" />
				<line x1="4.4" y1="19.6" x2="6.2" y2="17.8" />
				<line x1="17.8" y1="6.2" x2="19.6" y2="4.4" />
			</g>
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
			<path
				d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"
				fill="currentColor"
			/>
		</svg>
	{/if}
</button>

<style>
	.toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: 1px solid var(--line);
		border-radius: 50%;
		background: var(--paper-alt);
		color: var(--ink);
		cursor: pointer;
	}

	.toggle:hover {
		background: var(--accent-soft);
		color: var(--accent-deep);
	}
</style>
