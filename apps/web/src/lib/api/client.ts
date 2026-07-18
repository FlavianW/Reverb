import { PUBLIC_API_URL } from '$env/static/public';
import type {
	Comment,
	Concert,
	ConcertPage,
	ConversationSummary,
	FriendshipOverview,
	FriendshipStatusWithUser,
	FriendshipSummary,
	LoginRequest,
	MessagePage,
	MessageSummary,
	NearbyConcert,
	PhotoSummary,
	PostPage,
	PostSummary,
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
	getNearbyConcerts: (lat: number, lng: number, radiusKm?: number) =>
		request<NearbyConcert[]>(
			`/concerts/nearby?lat=${lat}&lng=${lng}${radiusKm ? `&radiusKm=${radiusKm}` : ''}`
		),
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
	},

	getFriendshipOverview: () => request<FriendshipOverview>('/friendships/me'),
	getFriendshipStatus: (pseudo: string) =>
		request<FriendshipStatusWithUser>(`/friendships/status/${pseudo}`),
	sendFriendRequest: (pseudo: string) =>
		request<FriendshipSummary>(`/friendships/requests/${pseudo}`, { method: 'POST' }),
	acceptFriendRequest: (id: string) =>
		request<void>(`/friendships/${id}/accept`, { method: 'PUT' }),
	removeFriendship: (id: string) => request<void>(`/friendships/${id}`, { method: 'DELETE' }),

	getFeed: (cursor?: string) =>
		request<PostPage>(`/posts/feed${cursor ? `?cursor=${cursor}` : ''}`),
	getUserPosts: (pseudo: string, cursor?: string) =>
		request<PostPage>(`/users/${pseudo}/posts${cursor ? `?cursor=${cursor}` : ''}`),
	createPost: (body: { content?: string; concertId?: string; photos: File[] }) => {
		const form = new FormData();
		if (body.content) form.append('content', body.content);
		if (body.concertId) form.append('concertId', body.concertId);
		body.photos.forEach((file) => form.append('photos', file));
		return request<PostSummary>('/posts', { method: 'POST', body: form });
	},
	deletePost: (id: string) => request<void>(`/posts/${id}`, { method: 'DELETE' }),
	likePost: (id: string) => request<void>(`/posts/${id}/like`, { method: 'PUT' }),
	unlikePost: (id: string) => request<void>(`/posts/${id}/like`, { method: 'DELETE' }),

	startConversation: (pseudo: string) =>
		request<ConversationSummary>(`/conversations/${pseudo}`, { method: 'POST' }),
	getConversations: () => request<ConversationSummary[]>('/conversations'),
	getUnreadCount: () => request<{ count: number }>('/conversations/unread-count'),
	getMessages: (conversationId: string, cursor?: string) =>
		request<MessagePage>(
			`/conversations/${conversationId}/messages${cursor ? `?cursor=${cursor}` : ''}`
		),
	sendMessage: (conversationId: string, content: string) =>
		request<MessageSummary>(`/conversations/${conversationId}/messages`, {
			method: 'POST',
			body: JSON.stringify({ content })
		}),
	markConversationRead: (conversationId: string) =>
		request<void>(`/conversations/${conversationId}/read`, { method: 'PUT' })
};
