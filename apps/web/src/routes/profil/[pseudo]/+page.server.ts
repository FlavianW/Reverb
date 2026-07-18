import { error, redirect } from '@sveltejs/kit';
import { apiFetch, ApiError } from '$lib/server/api';
import type { FriendshipStatusWithUser, PostPage, PublicProfile } from '@reverb/shared';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect(303, '/connexion');
	}

	const { pseudo } = event.params;

	let profile: PublicProfile;
	try {
		profile = await apiFetch<PublicProfile>(event, `/users/${pseudo}`);
	} catch (e) {
		if (e instanceof ApiError && e.status === 404) {
			error(404, 'Profil introuvable.');
		}
		throw e;
	}

	const isOwnProfile = event.locals.user.pseudo === pseudo;
	const friendshipStatus = isOwnProfile
		? null
		: await apiFetch<FriendshipStatusWithUser>(event, `/friendships/status/${pseudo}`);
	const posts = await apiFetch<PostPage>(event, `/users/${pseudo}/posts`);

	return {
		profile,
		isOwnProfile,
		friendshipStatus,
		posts,
		user: event.locals.user
	};
};
