import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import type { PublicUser } from '@reverb/shared';
import UserMenu from './UserMenu.svelte';

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock('$lib/api/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/client')>();
	return { ...actual, api: { ...actual.api, logout } };
});

const user: PublicUser = {
	id: 'u1',
	pseudo: 'ana',
	email: 'ana@example.com',
	avatarUrl: null,
	bannerUrl: null,
	bio: null,
	favoriteArtist: null
};

describe('UserMenu', () => {
	it('ouvre le menu et place le focus sur le premier item', async () => {
		render(UserMenu, { user });

		await fireEvent.click(screen.getByRole('button', { name: /Menu du compte/ }));

		await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Mon profil' })).toHaveFocus());
	});

	it('ArrowDown déplace le focus vers l’item suivant', async () => {
		render(UserMenu, { user });

		await fireEvent.click(screen.getByRole('button', { name: /Menu du compte/ }));
		await waitFor(() => screen.getByRole('menuitem', { name: 'Mon profil' }));

		await fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });

		expect(screen.getByRole('menuitem', { name: 'Se déconnecter' })).toHaveFocus();
	});

	it('Escape ferme le menu et rend le focus au déclencheur', async () => {
		render(UserMenu, { user });

		const trigger = screen.getByRole('button', { name: /Menu du compte/ });
		await fireEvent.click(trigger);
		await waitFor(() => screen.getByRole('menu'));

		await fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
		expect(trigger).toHaveFocus();
	});

	it('se déconnecter appelle logout puis redirige vers /connexion', async () => {
		logout.mockResolvedValue(undefined);
		render(UserMenu, { user });

		await fireEvent.click(screen.getByRole('button', { name: /Menu du compte/ }));
		await waitFor(() => screen.getByRole('menuitem', { name: 'Se déconnecter' }));

		await fireEvent.click(screen.getByRole('menuitem', { name: 'Se déconnecter' }));

		await waitFor(() => expect(logout).toHaveBeenCalled());
		expect(goto).toHaveBeenCalledWith('/connexion');
	});
});
