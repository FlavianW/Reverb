<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import type { PublicUser } from '@reverb/shared';

	interface Props {
		user: PublicUser;
	}

	let { user }: Props = $props();
	let open = $state(false);

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}

	async function logout() {
		close();
		await api.logout();
		await goto('/connexion');
	}
</script>

<svelte:window onclick={close} />

<div class="menu-wrapper">
	<button
		type="button"
		class="trigger"
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={(event) => {
			event.stopPropagation();
			toggle();
		}}
	>
		<Avatar src={user.avatarUrl} name={user.pseudo} size={36} />
		<span class="sr-only">Menu du compte de {user.pseudo}</span>
	</button>

	{#if open}
		<div class="menu" role="menu" tabindex="-1" onkeydown={onKeydown}>
			<a role="menuitem" href="/profil/{user.pseudo}" onclick={close}>Mon profil</a>
			<button role="menuitem" type="button" onclick={logout}>Se déconnecter</button>
		</div>
	{/if}
</div>

<style>
	.menu-wrapper {
		position: relative;
	}

	.trigger {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: 50%;
	}

	.menu {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5rem);
		background: var(--paper-alt);
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		min-width: 180px;
		padding: 0.375rem;
		box-shadow: 0 8px 24px rgba(28, 26, 23, 0.12);
		z-index: 20;
	}

	.menu a,
	.menu button {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.625rem;
		border-radius: var(--radius-sm);
		border: none;
		background: none;
		font-size: 0.875rem;
		font-family: var(--font-sans);
		color: var(--ink);
		text-decoration: none;
		cursor: pointer;
	}

	.menu a:hover,
	.menu button:hover {
		background: var(--paper);
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
