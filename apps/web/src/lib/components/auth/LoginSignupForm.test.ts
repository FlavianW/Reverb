import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import LoginSignupForm from './LoginSignupForm.svelte';
import { ApiError } from '$lib/api/client';

const { login } = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock('$lib/api/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/client')>();
	return { ...actual, api: { ...actual.api, login } };
});

describe('LoginSignupForm', () => {
	it('affiche le formulaire de connexion par défaut', () => {
		render(LoginSignupForm);

		expect(screen.getByRole('heading', { name: 'Bon retour parmi nous' })).toBeInTheDocument();
		expect(screen.queryByLabelText('Pseudo')).not.toBeInTheDocument();
	});

	it("bascule vers l'inscription et affiche le champ pseudo", async () => {
		render(LoginSignupForm);

		await fireEvent.click(screen.getByRole('button', { name: 'Créer un compte' }));

		expect(screen.getByRole('heading', { name: 'Rejoindre Reverb' })).toBeInTheDocument();
		expect(screen.getByLabelText('Pseudo')).toBeInTheDocument();
	});

	it('soumet la connexion avec les identifiants saisis', async () => {
		login.mockResolvedValue({ id: 'u1', pseudo: 'ana' });
		render(LoginSignupForm);

		await fireEvent.input(screen.getByLabelText('Adresse e-mail'), {
			target: { value: 'ana@example.com' }
		});
		await fireEvent.input(screen.getByLabelText('Mot de passe'), {
			target: { value: 'password123' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

		await waitFor(() =>
			expect(login).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'password123' })
		);
	});

	it("affiche un message d'erreur si la connexion échoue", async () => {
		login.mockRejectedValue(new ApiError(401, 'Identifiants invalides.'));
		render(LoginSignupForm);

		await fireEvent.input(screen.getByLabelText('Adresse e-mail'), {
			target: { value: 'ana@example.com' }
		});
		await fireEvent.input(screen.getByLabelText('Mot de passe'), {
			target: { value: 'wrong' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

		await waitFor(() =>
			expect(screen.getByRole('alert')).toHaveTextContent('Identifiants invalides.')
		);
	});
});
