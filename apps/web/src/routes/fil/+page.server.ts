import { redirect } from '@sveltejs/kit';
import { apiFetch } from '$lib/server/api';
import type { PostPage } from '@reverb/shared';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect(303, '/connexion');
	}

	const feed = await apiFetch<PostPage>(event, '/posts/feed');
	return { feed };
};
