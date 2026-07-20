import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import LikeButton from './LikeButton.svelte';

const { likePost, unlikePost } = vi.hoisted(() => ({
	likePost: vi.fn(),
	unlikePost: vi.fn()
}));

vi.mock('$lib/api/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/client')>();
	return { ...actual, api: { ...actual.api, likePost, unlikePost } };
});

describe('LikeButton', () => {
	it('like puis unlike met à jour le compteur affiché', async () => {
		likePost.mockResolvedValue(undefined);
		unlikePost.mockResolvedValue(undefined);

		render(LikeButton, { postId: 'post-1', initialLikeCount: 2, initialLikedByMe: false });

		expect(screen.getByText('2')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button'));
		await waitFor(() => expect(likePost).toHaveBeenCalledWith('post-1'));
		expect(screen.getByText('3')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button'));
		await waitFor(() => expect(unlikePost).toHaveBeenCalledWith('post-1'));
		expect(screen.getByText('2')).toBeInTheDocument();
	});
});
