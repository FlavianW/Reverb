import { error, redirect } from '@sveltejs/kit';
import { apiFetch, ApiError } from '$lib/server/api';
import type { ConcertPage } from '@reverb/shared';
import type { PageServerLoad } from './$types';

const TABS = ['setlist', 'media', 'notes'] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
	return TABS.includes(value as Tab);
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect(303, '/connexion');
	}

	const { id } = event.params;

	let concert: ConcertPage;
	let attending: boolean;
	try {
		concert = await apiFetch<ConcertPage>(event, `/concerts/${id}`);
		({ attending } = await apiFetch<{ attending: boolean }>(
			event,
			`/concerts/${id}/attendance`
		));
	} catch (e) {
		if (e instanceof ApiError && e.status === 404) {
			error(404, 'Concert introuvable.');
		}
		throw e;
	}

	const requestedTab = event.url.searchParams.get('onglet');
	const initialTab: Tab = isTab(requestedTab) ? requestedTab : 'setlist';

	return { concert, attending, initialTab, user: event.locals.user };
};
