<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PublicUser } from '@reverb/shared';
	import BottomNav from './BottomNav.svelte';
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

<a href="#main-content" class="skip-link">Aller au contenu principal</a>
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
	<main id="main-content" tabindex="-1">
		{@render children()}
	</main>
	<BottomNav {user} {unreadMessageCount} />
</div>

<style>
	.shell {
		min-height: 100vh;
		/* Hauteur de la barre de navigation basse mobile (0 sur desktop) :
		   lue par `main` ici et par le layout messages pour caler la hauteur
		   du fil de discussion — une seule source de vérité pour ne jamais
		   laisser la barre recouvrir du contenu. */
		--bottom-nav-height: 0px;
	}

	/* Masqué hors focus, visible dès l'arrivée au clavier : permet d'éviter
	   la navigation (logo + 6 liens + bascule de thème + menu) à chaque page. */
	.skip-link {
		position: absolute;
		top: -3rem;
		left: 1rem;
		z-index: 100;
		padding: 0.625rem 1rem;
		border-radius: var(--radius-sm);
		background: var(--accent);
		color: var(--on-accent);
		text-decoration: none;
		font-weight: 700;
		font-size: 0.875rem;
		transition: top 0.15s ease;
	}

	.skip-link:focus {
		top: 1rem;
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

	/* Sous 800px, les 7 liens ne tiennent plus sur une ligne : la navigation
	   bascule sur une barre basse (BottomNav, miroir de l'app mobile), la
	   topbar ne garde que le logo, la bascule de thème et le menu du compte. */
	@media (max-width: 800px) {
		.shell {
			--bottom-nav-height: calc(3.375rem + env(safe-area-inset-bottom, 0px));
		}

		main {
			padding-bottom: var(--bottom-nav-height);
		}

		.topbar-inner {
			padding: 0.875rem 1.25rem;
		}

		nav {
			display: none;
		}
	}
</style>
