<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	interface Props {
		href: string;
		children: Snippet;
	}

	let { href, children }: Props = $props();

	const isActive = $derived(page.url.pathname === href);
</script>

<a {href} class="nav-link" class:active={isActive} aria-current={isActive ? 'page' : undefined}>
	{@render children()}
</a>

<style>
	.nav-link {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--ink);
		text-decoration: none;
		border-bottom: 2px solid transparent;
		padding-bottom: 0.25rem;
	}

	.nav-link:hover {
		color: var(--accent);
	}

	.nav-link.active {
		font-weight: 700;
		color: var(--accent);
		border-bottom-color: var(--accent);
	}
</style>
