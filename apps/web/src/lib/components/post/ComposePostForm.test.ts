import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import type { PostSummary } from '@reverb/shared';
import ComposePostForm from './ComposePostForm.svelte';

const { createPost } = vi.hoisted(() => ({ createPost: vi.fn() }));

vi.mock('$lib/api/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/client')>();
	return { ...actual, api: { ...actual.api, createPost } };
});

const fakePost: PostSummary = {
	id: 'post-1',
	type: 'PHOTO',
	author: { pseudo: 'ana', avatarUrl: null },
	concert: null,
	content: 'Super soirée',
	ratingValue: null,
	photos: [],
	video: null,
	likeCount: 0,
	likedByMe: false,
	createdAt: '2026-01-01T10:00:00.000Z'
};

describe('ComposePostForm', () => {
	it('refuse la soumission sans texte, photo ni vidéo', async () => {
		const onPosted = vi.fn();
		render(ComposePostForm, { onPosted });

		await fireEvent.click(screen.getByRole('button', { name: 'Publier' }));

		expect(screen.getByRole('alert')).toHaveTextContent(
			'Ajoutez du texte, des photos ou une vidéo.'
		);
		expect(createPost).not.toHaveBeenCalled();
	});

	it('publie un post texte et notifie onPosted', async () => {
		createPost.mockResolvedValue(fakePost);
		const onPosted = vi.fn();
		render(ComposePostForm, { onPosted });

		await fireEvent.input(screen.getByLabelText('Quoi de neuf ?'), {
			target: { value: 'Super soirée' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Publier' }));

		await waitFor(() => expect(onPosted).toHaveBeenCalledWith(fakePost));
		expect(createPost).toHaveBeenCalledWith({
			content: 'Super soirée',
			concertId: undefined,
			photos: []
		});
	});
});
