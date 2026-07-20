import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import type { PostSummary } from '@reverb/shared';
import PostCard from './PostCard.svelte';

function basePost(overrides: Partial<PostSummary> = {}): PostSummary {
	return {
		id: 'post-1',
		type: 'PHOTO',
		author: { pseudo: 'ana', avatarUrl: null },
		concert: null,
		content: null,
		ratingValue: null,
		photos: [],
		video: null,
		likeCount: 0,
		likedByMe: false,
		createdAt: '2026-01-01T10:00:00.000Z',
		...overrides
	};
}

describe('PostCard', () => {
	it('affiche une notation avec les étoiles et le concert', () => {
		render(PostCard, {
			post: basePost({
				type: 'RATING',
				ratingValue: 4,
				concert: { id: 'c1', artistName: 'Radiohead', venueName: 'Zénith', city: 'Paris' }
			}),
			canDelete: false,
			onDelete: vi.fn()
		});

		expect(screen.getByRole('link', { name: 'Radiohead' })).toBeInTheDocument();
		expect(screen.getByLabelText('4 sur 5 étoiles')).toBeInTheDocument();
	});

	it('affiche une présence marquée', () => {
		render(PostCard, {
			post: basePost({
				type: 'ATTENDANCE',
				concert: { id: 'c1', artistName: 'Justice', venueName: 'AccorHotels', city: 'Paris' }
			}),
			canDelete: false,
			onDelete: vi.fn()
		});

		expect(screen.getByText(/a marqué sa présence/i)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Justice' })).toBeInTheDocument();
	});

	it('affiche les photos et le texte d’un post explicite', () => {
		render(PostCard, {
			post: basePost({
				content: 'Super soirée',
				photos: [{ id: 'ph1', url: 'https://cdn.example.com/ph1.jpg' }]
			}),
			canDelete: false,
			onDelete: vi.fn()
		});

		expect(screen.getByText('Super soirée')).toBeInTheDocument();
		expect(screen.getByAltText('Photo partagée par ana')).toBeInTheDocument();
	});

	it('affiche un état "en cours de traitement" pour une vidéo PROCESSING', () => {
		render(PostCard, {
			post: basePost({
				video: {
					id: 'v1',
					status: 'PROCESSING',
					url: null,
					posterUrl: null,
					durationSeconds: null
				}
			}),
			canDelete: false,
			onDelete: vi.fn()
		});

		expect(screen.getByText('Vidéo en cours de traitement…')).toBeInTheDocument();
	});

	it('affiche un message d’échec pour une vidéo FAILED', () => {
		render(PostCard, {
			post: basePost({
				video: { id: 'v1', status: 'FAILED', url: null, posterUrl: null, durationSeconds: null }
			}),
			canDelete: false,
			onDelete: vi.fn()
		});

		expect(screen.getByText('Échec du traitement de la vidéo.')).toBeInTheDocument();
	});

	it('affiche le lecteur vidéo quand la vidéo est prête', () => {
		render(PostCard, {
			post: basePost({
				video: {
					id: 'v1',
					status: 'READY',
					url: 'https://cdn.example.com/playback.mp4',
					posterUrl: 'https://cdn.example.com/poster.jpg',
					durationSeconds: 42
				}
			}),
			canDelete: false,
			onDelete: vi.fn()
		});

		const video = document.querySelector('video');
		expect(video).not.toBeNull();
		expect(video?.getAttribute('poster')).toBe('https://cdn.example.com/poster.jpg');
	});

	it('propose la suppression seulement si canDelete', async () => {
		const onDelete = vi.fn().mockResolvedValue(undefined);
		render(PostCard, { post: basePost(), canDelete: true, onDelete });

		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

		await waitFor(() => expect(onDelete).toHaveBeenCalled());
	});

	it('ne propose pas la suppression si canDelete est faux', () => {
		render(PostCard, { post: basePost(), canDelete: false, onDelete: vi.fn() });

		expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
	});
});
