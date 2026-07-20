import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ReportButton from './ReportButton.svelte';
import { ApiError } from '$lib/api/client';

describe('ReportButton', () => {
	it('un signalement réussi passe le bouton sur "Signalé"', async () => {
		const onReport = vi.fn().mockResolvedValue(undefined);
		render(ReportButton, { onReport });

		await fireEvent.click(screen.getByRole('button', { name: 'Signaler' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

		await waitFor(() => expect(onReport).toHaveBeenCalledWith('SPAM'));
		expect(screen.getByRole('button', { name: 'Signalé' })).toBeInTheDocument();
	});

	it('un 409 (déjà signalé) est traité comme un succès silencieux', async () => {
		const onReport = vi.fn().mockRejectedValue(new ApiError(409, 'Déjà signalé'));
		render(ReportButton, { onReport });

		await fireEvent.click(screen.getByRole('button', { name: 'Signaler' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Signalé' })).toBeInTheDocument()
		);
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
