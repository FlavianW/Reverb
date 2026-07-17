<script lang="ts">
	import { api, ApiError } from '$lib/api/client';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import type { CommentSummary } from '@reverb/shared';

	interface Props {
		concertId: string;
		currentUserPseudo: string;
		onAdded: (comment: CommentSummary) => void;
	}

	let { concertId, currentUserPseudo, onAdded }: Props = $props();

	let content = $state('');
	let submitting = $state(false);
	let error = $state('');

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!content.trim()) {
			return;
		}
		submitting = true;
		error = '';
		try {
			const comment = await api.addComment(concertId, content.trim());
			onAdded({
				id: comment.id,
				content: comment.content,
				pseudo: currentUserPseudo,
				createdAt: comment.createdAt
			});
			content = '';
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Une erreur est survenue.';
		} finally {
			submitting = false;
		}
	}
</script>

<form class="comment-form" onsubmit={onSubmit}>
	<FormField
		id="comment"
		label="Ajouter un commentaire"
		bind:value={content}
		multiline
		required
		placeholder="Partagez votre souvenir de ce concert…"
	/>
	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}
	<Button type="submit" disabled={submitting}>Publier</Button>
</form>

<style>
	.comment-form {
		margin-bottom: 2rem;
	}

	.error {
		margin: -0.5rem 0 1rem;
		font-size: 0.8125rem;
		color: var(--accent-deep);
	}
</style>
