<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PublicUser } from '@reverb/shared';
	import NavLink from './NavLink.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import UserMenu from './UserMenu.svelte';

	interface Props {
		user: PublicUser;
		unreadMessageCount: number;
		children: Snippet;
	}

	let { user, unreadMessageCount, children }: Props = $props();
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
				<NavLink href="/messages">
					<span class="nav-item">
						Messages
						{#if unreadMessageCount > 0}
							<span class="badge">{unreadMessageCount}</span>
						{/if}
					</span>
				</NavLink>
				<NavLink href="/amis">Amis</NavLink>
				<NavLink href="/profil/{user.pseudo}">Profil</NavLink>
			</nav>
			<div class="actions">
				<ThemeToggle />
				<UserMenu {user} />
			</div>
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

	.actions {
		display: flex;
		align-items: center;
		gap: 0.875rem;
	}

	.nav-item {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.125rem;
		height: 1.125rem;
		padding: 0 0.3125rem;
		border-radius: 999px;
		background: var(--accent);
		color: var(--paper-alt);
		font-size: 0.6875rem;
		font-weight: 700;
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
