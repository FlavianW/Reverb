import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import FriendButton from './FriendButton.svelte';

const { sendFriendRequest, acceptFriendRequest } = vi.hoisted(() => ({
	sendFriendRequest: vi.fn(),
	acceptFriendRequest: vi.fn()
}));

vi.mock('$lib/api/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/client')>();
	return { ...actual, api: { ...actual.api, sendFriendRequest, acceptFriendRequest } };
});

describe('FriendButton', () => {
	it('NONE : envoyer une demande passe le bouton sur "Demande envoyée"', async () => {
		sendFriendRequest.mockResolvedValue({ id: 'f1', status: 'PENDING' });
		render(FriendButton, { pseudo: 'bob', status: 'NONE', friendshipId: null });

		await fireEvent.click(screen.getByRole('button', { name: 'Ajouter en ami' }));

		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Demande envoyée' })).toBeInTheDocument()
		);
	});

	it('PENDING_RECEIVED : accepter passe le bouton sur un état ami', async () => {
		acceptFriendRequest.mockResolvedValue(undefined);
		render(FriendButton, { pseudo: 'bob', status: 'PENDING_RECEIVED', friendshipId: 'f1' });

		await fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

		await waitFor(() => expect(acceptFriendRequest).toHaveBeenCalledWith('f1'));
		expect(screen.getByText(/Ami/)).toBeInTheDocument();
	});

	it('SELF ne rend rien', () => {
		render(FriendButton, { pseudo: 'moi', status: 'SELF', friendshipId: null });

		expect(screen.queryByText('Ajouter en ami')).not.toBeInTheDocument();
	});
});
