import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import type { PostPage, PostSummary } from '@reverb/shared';
import PostList from './PostList.svelte';

const { getFeed, deletePost } = vi.hoisted(() => ({
	getFeed: vi.fn(),
	deletePost: vi.fn()
}));

vi.mock('$lib/api/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/client')>();
	return { ...actual, api: { ...actual.api, getFeed, deletePost } };
});

function post(id: string, overrides: Partial<PostSummary> = {}): PostSummary {
	return {
		id,
		type: 'PHOTO',
		author: { pseudo: 'ana', avatarUrl: null },
		concert: null,
		content: `contenu ${id}`,
		ratingValue: null,
		photos: [],
		video: null,
		likeCount: 0,
		likedByMe: false,
		createdAt: '2026-01-01T10:00:00.000Z',
		...overrides
	};
}

describe('PostList', () => {
	it('affiche un message quand il n’y a aucun post', () => {
		render(PostList, { items: [], cursor: null, currentUserPseudo: 'ana', source: { type: 'feed' } });

		expect(screen.getByText("Aucun post pour l'instant.")).toBeInTheDocument();
	});

	it('charge la page suivante au clic sur "Charger plus"', async () => {
		getFeed.mockResolvedValue({ items: [post('p2')], nextCursor: null } satisfies PostPage);

		render(PostList, {
			items: [post('p1')],
			cursor: 'p1',
			currentUserPseudo: 'ana',
			source: { type: 'feed' }
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Charger plus' }));

		await waitFor(() => expect(getFeed).toHaveBeenCalledWith('p1'));
		await waitFor(() => expect(screen.getByText('contenu p2')).toBeInTheDocument());
	});

	it('ne propose pas "Charger plus" sans curseur suivant', () => {
		render(PostList, {
			items: [post('p1')],
			cursor: null,
			currentUserPseudo: 'ana',
			source: { type: 'feed' }
		});

		expect(screen.queryByRole('button', { name: 'Charger plus' })).not.toBeInTheDocument();
	});

	it('supprime un post à la demande de son auteur', async () => {
		deletePost.mockResolvedValue(undefined);

		render(PostList, {
			items: [post('p1')],
			cursor: null,
			currentUserPseudo: 'ana',
			source: { type: 'feed' }
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

		await waitFor(() => expect(deletePost).toHaveBeenCalledWith('p1'));
	});
});
