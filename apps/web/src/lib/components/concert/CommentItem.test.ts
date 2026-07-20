import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import type { CommentSummary } from '@reverb/shared';
import CommentItem from './CommentItem.svelte';

const comment: CommentSummary = {
	id: 'c1',
	content: 'Super soirée',
	pseudo: 'ana',
	createdAt: '2026-01-01T10:00:00.000Z'
};

describe('CommentItem', () => {
	it('affiche le contenu et propose la suppression pour l’auteur', async () => {
		const onDelete = vi.fn().mockResolvedValue(undefined);
		render(CommentItem, { comment, canDelete: true, onDelete });

		expect(screen.getByText('Super soirée')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

		await waitFor(() => expect(onDelete).toHaveBeenCalled());
	});

	it('ne propose pas la suppression pour un non-auteur', () => {
		render(CommentItem, { comment, canDelete: false, onDelete: vi.fn() });

		expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
	});
});
