import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import type { FriendshipSummary } from '@reverb/shared';
import FriendCard from './FriendCard.svelte';

const friendship: FriendshipSummary = {
	id: 'f1',
	status: 'ACCEPTED',
	createdAt: '2026-01-01T10:00:00.000Z',
	user: { pseudo: 'bob', avatarUrl: null }
};

describe('FriendCard', () => {
	it('kind=friend : "Retirer" appelle onRemove', async () => {
		const onRemove = vi.fn().mockResolvedValue(undefined);
		render(FriendCard, { friendship, kind: 'friend', onRemove });

		await fireEvent.click(screen.getByRole('button', { name: 'Retirer' }));

		await waitFor(() => expect(onRemove).toHaveBeenCalled());
	});

	it('kind=received : "Accepter" appelle onAccept', async () => {
		const onAccept = vi.fn().mockResolvedValue(undefined);
		render(FriendCard, { friendship, kind: 'received', onAccept, onRemove: vi.fn() });

		await fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

		await waitFor(() => expect(onAccept).toHaveBeenCalled());
	});

	it('kind=sent : affiche "Demande envoyée" et "Annuler" appelle onRemove', async () => {
		const onRemove = vi.fn().mockResolvedValue(undefined);
		render(FriendCard, { friendship, kind: 'sent', onRemove });

		expect(screen.getByText('Demande envoyée')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

		await waitFor(() => expect(onRemove).toHaveBeenCalled());
	});
});
