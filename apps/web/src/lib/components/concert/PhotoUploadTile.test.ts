import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import PhotoUploadTile from './PhotoUploadTile.svelte';
import { ApiError } from '$lib/api/client';

const { uploadPhoto } = vi.hoisted(() => ({ uploadPhoto: vi.fn() }));

vi.mock('$lib/api/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/client')>();
	return { ...actual, api: { ...actual.api, uploadPhoto } };
});

describe('PhotoUploadTile', () => {
	it('uploade la photo choisie et notifie onUploaded', async () => {
		const photo = {
			id: 'ph1',
			url: 'https://cdn.example.com/ph1.jpg',
			pseudo: 'ana',
			createdAt: '2026-01-01T10:00:00.000Z'
		};
		uploadPhoto.mockResolvedValue(photo);
		const onUploaded = vi.fn();

		render(PhotoUploadTile, { concertId: 'concert-1', onUploaded });

		const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;
		await fireEvent.change(input, { target: { files: [file] } });

		await waitFor(() => expect(uploadPhoto).toHaveBeenCalledWith('concert-1', file));
		expect(onUploaded).toHaveBeenCalledWith(photo);
	});

	it("affiche l'erreur en cas d'échec", async () => {
		uploadPhoto.mockRejectedValue(
			new ApiError(503, 'Le service de stockage est momentanément indisponible.')
		);

		render(PhotoUploadTile, { concertId: 'concert-1', onUploaded: vi.fn() });

		const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;
		await fireEvent.change(input, { target: { files: [file] } });

		await waitFor(() =>
			expect(screen.getByRole('alert')).toHaveTextContent(
				'Le service de stockage est momentanément indisponible.'
			)
		);
	});
});
