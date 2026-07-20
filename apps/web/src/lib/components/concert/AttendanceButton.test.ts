import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AttendanceButton from './AttendanceButton.svelte';

const { markAttendance, unmarkAttendance } = vi.hoisted(() => ({
	markAttendance: vi.fn(),
	unmarkAttendance: vi.fn()
}));

vi.mock('$lib/api/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/client')>();
	return { ...actual, api: { ...actual.api, markAttendance, unmarkAttendance } };
});

describe('AttendanceButton', () => {
	it("marque la présence quand l'utilisateur n'y était pas", async () => {
		markAttendance.mockResolvedValue(undefined);
		render(AttendanceButton, { concertId: 'c1', initialAttending: false });

		await fireEvent.click(screen.getByRole('button'));

		await waitFor(() => expect(markAttendance).toHaveBeenCalledWith('c1'));
		expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
	});

	it('retire la présence quand elle était déjà marquée', async () => {
		unmarkAttendance.mockResolvedValue(undefined);
		render(AttendanceButton, { concertId: 'c1', initialAttending: true });

		await fireEvent.click(screen.getByRole('button'));

		await waitFor(() => expect(unmarkAttendance).toHaveBeenCalledWith('c1'));
		expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
	});
});
