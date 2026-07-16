import { PUBLIC_API_URL } from '$env/static/public';
import type {
	Comment,
	Concert,
	ConcertPage,
	LoginRequest,
	PhotoSummary,
	PublicProfile,
	PublicUser,
	RegisterRequest,
	Report,
	ReportReason,
	UpdateProfileRequest
} from '@reverb/shared';

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const isFormData = init.body instanceof FormData;
	const response = await fetch(`${PUBLIC_API_URL}${path}`, {
		...init,
		credentials: 'include',
		headers: {
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
			...(init.headers ?? {})
		}
	});

	if (!response.ok) {
		const body = (await response.json().catch(() => null)) as { message?: string } | null;
		throw new ApiError(response.status, body?.message ?? response.statusText);
	}

	return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

/** Toutes les mutations et GET déclenchés côté client (le navigateur porte le cookie de session nativement). */
export const api = {
	register: (body: RegisterRequest) =>
		request<PublicUser>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
	login: (body: LoginRequest) =>
		request<PublicUser>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
	logout: () => request<void>('/auth/logout', { method: 'POST' }),

	searchConcerts: (q?: string) =>
		request<Concert[]>(`/concerts/search${q ? `?q=${encodeURIComponent(q)}` : ''}`),
	getConcert: (id: string) => request<ConcertPage>(`/concerts/${id}`),
	getAttendance: (id: string) => request<{ attending: boolean }>(`/concerts/${id}/attendance`),
	markAttendance: (id: string) => request<void>(`/concerts/${id}/attendance`, { method: 'PUT' }),
	unmarkAttendance: (id: string) =>
		request<void>(`/concerts/${id}/attendance`, { method: 'DELETE' }),
	rateConcert: (id: string, value: number) =>
		request<void>(`/concerts/${id}/rating`, { method: 'PUT', body: JSON.stringify({ value }) }),

	addComment: (id: string, content: string) =>
		request<Comment>(`/concerts/${id}/comments`, {
			method: 'POST',
			body: JSON.stringify({ content })
		}),
	deleteComment: (id: string) => request<void>(`/comments/${id}`, { method: 'DELETE' }),
	reportComment: (id: string, reason: ReportReason) =>
		request<Report>(`/comments/${id}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),

	uploadPhoto: (concertId: string, file: File) => {
		const body = new FormData();
		body.append('photo', file);
		return request<PhotoSummary>(`/concerts/${concertId}/photos`, { method: 'POST', body });
	},
	deletePhoto: (id: string) => request<void>(`/photos/${id}`, { method: 'DELETE' }),
	reportPhoto: (id: string, reason: ReportReason) =>
		request<Report>(`/photos/${id}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),

	getProfile: (pseudo: string) => request<PublicProfile>(`/users/${pseudo}`),
	updateProfile: (body: UpdateProfileRequest) =>
		request<PublicUser>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
	uploadAvatar: (file: File) => {
		const body = new FormData();
		body.append('avatar', file);
		return request<PublicUser>('/users/me/avatar', { method: 'POST', body });
	}
};
