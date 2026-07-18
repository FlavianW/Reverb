<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PublicUser } from '@reverb/shared';
	import NavLink from './NavLink.svelte';
	import UserMenu from './UserMenu.svelte';

	interface Props {
		user: PublicUser;
		children: Snippet;
	}

	let { user, children }: Props = $props();
</script>

<div class="shell">
	<header class="topbar">
		<div class="topbar-inner">
			<a href="/" class="logo">Reverb</a>
			<nav aria-label="Navigation principale">
				<NavLink href="/">Accueil</NavLink>
				<NavLink href="/fil">Fil</NavLink>
				<NavLink href="/recherche">Recherche</NavLink>
				<NavLink href="/carte">Carte</NavLink>
				<NavLink href="/amis">Amis</NavLink>
				<NavLink href="/profil/{user.pseudo}">Profil</NavLink>
			</nav>
			<UserMenu {user} />
		</div>
	</header>
	<main>
		{@render children()}
	</main>
</div>

<style>
	.shell {
		min-height: 100vh;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--paper);
		border-bottom: 1px solid var(--line);
	}

	.topbar-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.125rem 3rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
	}

	.logo {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 500;
		font-size: 1.5rem;
		color: var(--ink);
		text-decoration: none;
	}

	nav {
		display: flex;
		gap: 2.25rem;
		flex: 1;
	}

	@media (max-width: 640px) {
		.topbar-inner {
			padding: 1rem 1.25rem;
		}

		nav {
			gap: 1rem;
		}
	}
</style>
