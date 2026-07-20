import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import StarRating from './StarRating.svelte';
import { ApiError } from '$lib/api/client';

const { rateConcert } = vi.hoisted(() => ({ rateConcert: vi.fn() }));

vi.mock('$lib/api/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/client')>();
	return { ...actual, api: { ...actual.api, rateConcert } };
});

describe('StarRating', () => {
	it('cliquer sur une étoile envoie la note', async () => {
		rateConcert.mockResolvedValue(undefined);
		render(StarRating, { concertId: 'c1', summary: { average: null, count: 0 } });

		await fireEvent.click(screen.getByRole('radio', { name: '4 étoiles' }));

		await waitFor(() => expect(rateConcert).toHaveBeenCalledWith('c1', 4));
		expect(screen.getByText('Merci, votre note a été enregistrée.')).toBeInTheDocument();
	});

	it('une erreur API affiche le message au lieu du succès', async () => {
		rateConcert.mockRejectedValue(new ApiError(500, 'Erreur serveur'));
		render(StarRating, { concertId: 'c1', summary: { average: null, count: 0 } });

		await fireEvent.click(screen.getByRole('radio', { name: '3 étoiles' }));

		await waitFor(() => expect(screen.getByText('Erreur serveur')).toBeInTheDocument());
		expect(screen.queryByText('Merci, votre note a été enregistrée.')).not.toBeInTheDocument();
	});
});
