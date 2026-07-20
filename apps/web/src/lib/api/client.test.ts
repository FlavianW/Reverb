import { describe, expect, it, vi, beforeEach } from 'vitest';
import { api, ApiError } from './client';

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

describe('request (via api.*)', () => {
	it('sérialise un corps JSON avec le Content-Type correspondant', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ id: 'u1', pseudo: 'ana' }), { status: 200 })
		);

		await api.login({ email: 'ana@example.com', password: 'password123' });

		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:3000/auth/login',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify({ email: 'ana@example.com', password: 'password123' }),
				headers: expect.objectContaining({ 'Content-Type': 'application/json' })
			})
		);
	});

	it("omet le Content-Type pour un corps FormData (laisse le navigateur poser la boundary)", async () => {
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'u1' }), { status: 200 }));

		await api.uploadAvatar(new File(['x'], 'avatar.jpg', { type: 'image/jpeg' }));

		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(init.body).toBeInstanceOf(FormData);
		expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
	});

	it('lève une ApiError avec le message renvoyé par le serveur en cas de réponse non-ok', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ message: 'Identifiants invalides.' }), { status: 401 })
		);

		const promise = api.login({ email: 'ana@example.com', password: 'wrong' });

		await expect(promise).rejects.toBeInstanceOf(ApiError);
		await expect(promise).rejects.toThrow('Identifiants invalides.');
	});

	it('renvoie undefined pour une réponse 204 sans corps', async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

		await expect(api.logout()).resolves.toBeUndefined();
	});
});
