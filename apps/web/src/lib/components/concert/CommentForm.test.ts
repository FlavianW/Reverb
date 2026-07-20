import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import CommentForm from './CommentForm.svelte';

const { addComment } = vi.hoisted(() => ({ addComment: vi.fn() }));

vi.mock('$lib/api/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/client')>();
	return { ...actual, api: { ...actual.api, addComment } };
});

describe('CommentForm', () => {
	it('publie un commentaire et notifie onAdded', async () => {
		addComment.mockResolvedValue({
			id: 'c1',
			content: 'Super concert',
			createdAt: '2026-01-01T10:00:00.000Z'
		});
		const onAdded = vi.fn();

		render(CommentForm, { concertId: 'concert-1', currentUserPseudo: 'ana', onAdded });

		await fireEvent.input(screen.getByLabelText('Ajouter un commentaire'), {
			target: { value: 'Super concert' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Publier' }));

		await waitFor(() => expect(addComment).toHaveBeenCalledWith('concert-1', 'Super concert'));
		expect(onAdded).toHaveBeenCalledWith({
			id: 'c1',
			content: 'Super concert',
			pseudo: 'ana',
			createdAt: '2026-01-01T10:00:00.000Z'
		});
	});

	it('ne soumet rien si le champ est vide', async () => {
		render(CommentForm, { concertId: 'concert-1', currentUserPseudo: 'ana', onAdded: vi.fn() });

		await fireEvent.click(screen.getByRole('button', { name: 'Publier' }));

		expect(addComment).not.toHaveBeenCalled();
	});
});
