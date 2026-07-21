<script lang="ts">
	import { page } from '$app/state';
	import type { PublicUser } from '@reverb/shared';

	interface Props {
		user: PublicUser;
		unreadMessageCount: number;
	}

	let { user, unreadMessageCount }: Props = $props();

	// Miroir des onglets de la barre basse de l'app mobile (root_shell.dart) :
	// mêmes destinations, même ordre, pour une navigation identique entre les
	// deux plateformes (cf. manuel d'utilisation).
	const items = $derived([
		{ href: '/', label: 'Accueil', icon: 'home' },
		{ href: '/fil', label: 'Fil', icon: 'feed' },
		{ href: '/recherche', label: 'Recherche', icon: 'search' },
		{ href: '/carte', label: 'Carte', icon: 'map' },
		{ href: '/messages', label: 'Messages', icon: 'chat' },
		{ href: '/amis', label: 'Amis', icon: 'people' },
		{ href: `/profil/${user.pseudo}`, label: 'Profil', icon: 'person' }
	]);

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<nav class="bottom-nav" aria-label="Navigation principale">
	{#each items as item (item.href)}
		<a
			href={item.href}
			class="item"
			class:active={isActive(item.href)}
			aria-current={isActive(item.href) ? 'page' : undefined}
		>
			<span class="icon-wrap">
				<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
					{#if item.icon === 'home'}
						<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1Z" />
					{:else if item.icon === 'feed'}
						<rect x="3" y="7.5" width="14" height="12" rx="2" />
						<path d="M7.5 3.5H19a2 2 0 0 1 2 2V15" />
					{:else if item.icon === 'search'}
						<circle cx="11" cy="11" r="7" />
						<path d="m16.5 16.5 4.5 4.5" />
					{:else if item.icon === 'map'}
						<path d="M9 4 3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5Zm0 0v13.5M15 6.5V20" />
					{:else if item.icon === 'chat'}
						<path
							d="M4.5 4.5h15A1.5 1.5 0 0 1 21 6v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4h-1A1.5 1.5 0 0 1 3 15V6a1.5 1.5 0 0 1 1.5-1.5Z"
						/>
					{:else if item.icon === 'people'}
						<circle cx="9" cy="8" r="3.5" />
						<path d="M2.5 19.5a6.5 6.5 0 0 1 13 0" />
						<circle cx="17.5" cy="9.5" r="2.5" />
						<path d="M16.5 14.5a5 5 0 0 1 5 4.5" />
					{:else}
						<circle cx="12" cy="8" r="4" />
						<path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
					{/if}
				</svg>
				{#if item.icon === 'chat' && unreadMessageCount > 0}
					<span class="badge">{unreadMessageCount}</span>
				{/if}
			</span>
			<span class="label">{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	.bottom-nav {
		display: none;
	}

	@media (max-width: 800px) {
		.bottom-nav {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 10;
			display: flex;
			background: var(--paper);
			border-top: 1px solid var(--line);
			/* Zone du geste iOS/Android : la barre ne doit pas passer dessous. */
			padding-bottom: env(safe-area-inset-bottom, 0px);
		}
	}

	.item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.5rem 0 0.375rem;
		min-width: 0;
		color: var(--ink-soft);
		text-decoration: none;
	}

	.item.active {
		color: var(--accent);
	}

	.icon-wrap {
		position: relative;
		display: inline-flex;
	}

	svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.label {
		font-size: 0.625rem;
		font-weight: 500;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item.active .label {
		font-weight: 700;
	}

	.badge {
		position: absolute;
		top: -0.3125rem;
		right: -0.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1rem;
		height: 1rem;
		padding: 0 0.25rem;
		border-radius: 999px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 0.625rem;
		font-weight: 700;
	}
</style>
