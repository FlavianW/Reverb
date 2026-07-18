<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, ApiError } from '$lib/api/client';
	import FriendCard from '$lib/components/friend/FriendCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let pseudo = $state('');
	let sending = $state(false);
	let error = $state<string | null>(null);

	async function sendRequest(event: SubmitEvent) {
		event.preventDefault();
		if (!pseudo.trim()) return;

		sending = true;
		error = null;
		try {
			await api.sendFriendRequest(pseudo.trim());
			pseudo = '';
			await invalidateAll();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Une erreur est survenue.';
		} finally {
			sending = false;
		}
	}

	async function accept(id: string) {
		await api.acceptFriendRequest(id);
		await invalidateAll();
	}

	async function remove(id: string) {
		await api.removeFriendship(id);
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Amis — Reverb</title>
</svelte:head>

<div class="page">
	<h1>Amis</h1>

	<form class="add-form" onsubmit={sendRequest}>
		<label for="pseudo" class="sr-only">Pseudo à ajouter</label>
		<input
			id="pseudo"
			type="text"
			placeholder="Ajouter un ami par pseudo…"
			bind:value={pseudo}
			autocomplete="off"
		/>
		<button type="submit" disabled={sending}>Envoyer une demande</button>
	</form>
	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}

	{#if data.overview.receivedRequests.length > 0}
		<section>
			<h2>Demandes reçues</h2>
			<div class="list">
				{#each data.overview.receivedRequests as friendship (friendship.id)}
					<FriendCard
						{friendship}
						kind="received"
						onAccept={() => accept(friendship.id)}
						onRemove={() => remove(friendship.id)}
					/>
				{/each}
			</div>
		</section>
	{/if}

	{#if data.overview.sentRequests.length > 0}
		<section>
			<h2>Demandes envoyées</h2>
			<div class="list">
				{#each data.overview.sentRequests as friendship (friendship.id)}
					<FriendCard {friendship} kind="sent" onRemove={() => remove(friendship.id)} />
				{/each}
			</div>
		</section>
	{/if}

	<section>
		<h2>Mes amis</h2>
		{#if data.overview.friends.length === 0}
			<p class="empty">Aucun ami pour l'instant.</p>
		{:else}
			<div class="list">
				{#each data.overview.friends as friendship (friendship.id)}
					<FriendCard {friendship} kind="friend" onRemove={() => remove(friendship.id)} />
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.page {
		max-width: 720px;
		margin: 0 auto;
		padding: 3.5rem 3rem 5rem;
	}

	h1 {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 400;
		font-size: 1.875rem;
		margin: 0 0 1.75rem;
	}

	h2 {
		font-family: var(--font-serif);
		font-weight: 500;
		font-size: 1.1875rem;
		margin: 0 0 1rem;
	}

	.add-form {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.add-form input {
		flex: 1;
		padding: 0.75rem 0.875rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper-alt);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		color: var(--ink);
	}

	.add-form button {
		padding: 0.75rem 1.25rem;
		border: 1px solid var(--ink);
		border-radius: var(--radius-sm);
		background: var(--ink);
		color: var(--paper);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		cursor: pointer;
	}

	.add-form button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.error {
		color: var(--accent-deep);
		font-size: 0.875rem;
		margin: 0 0 1.75rem;
	}

	section {
		margin-top: 2.5rem;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.empty {
		color: var(--ink-soft);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
