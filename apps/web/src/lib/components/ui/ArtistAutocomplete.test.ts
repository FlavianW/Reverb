import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ArtistAutocomplete from './ArtistAutocomplete.svelte';

const { searchArtists } = vi.hoisted(() => ({ searchArtists: vi.fn() }));

vi.mock('$lib/api/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/client')>();
	return { ...actual, api: { ...actual.api, searchArtists } };
});

describe('ArtistAutocomplete', () => {
	it('affiche les suggestions après saisie (recherche debouncée)', async () => {
		searchArtists.mockResolvedValue([
			{ name: 'Muse', imageUrl: null },
			{ name: 'Justice', imageUrl: null }
		]);

		render(ArtistAutocomplete, { id: 'artist', label: 'Artiste favori', value: '' });

		await fireEvent.input(screen.getByLabelText('Artiste favori'), { target: { value: 'mu' } });

		await waitFor(() => expect(searchArtists).toHaveBeenCalledWith('mu'));
		await waitFor(() => expect(screen.getByRole('option', { name: /Muse/ })).toBeInTheDocument());
	});

	it('sélectionne une suggestion au clic et ferme la liste', async () => {
		searchArtists.mockResolvedValue([{ name: 'Muse', imageUrl: null }]);

		render(ArtistAutocomplete, { id: 'artist', label: 'Artiste favori', value: '' });

		await fireEvent.input(screen.getByLabelText('Artiste favori'), { target: { value: 'mu' } });
		await waitFor(() => screen.getByRole('option', { name: /Muse/ }));

		await fireEvent.click(screen.getByRole('button', { name: 'Muse' }));

		await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
	});

	it('ne recherche pas pour une saisie de moins de 2 caractères', async () => {
		render(ArtistAutocomplete, { id: 'artist', label: 'Artiste favori', value: '' });

		await fireEvent.input(screen.getByLabelText('Artiste favori'), { target: { value: 'm' } });
		await new Promise((resolve) => setTimeout(resolve, 350));

		expect(searchArtists).not.toHaveBeenCalled();
	});
});
