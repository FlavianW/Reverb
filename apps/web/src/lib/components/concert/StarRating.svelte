<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, ApiError } from '$lib/api/client';
	import type { ConcertRatingSummary } from '@reverb/shared';

	interface Props {
		concertId: string;
		summary: ConcertRatingSummary;
	}

	let { concertId, summary }: Props = $props();

	const stars = [1, 2, 3, 4, 5];

	let selected = $state(0);
	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state('');

	const summaryLabel = $derived(
		summary.average !== null
			? `${summary.average.toFixed(1)} / 5 (${summary.count} avis)`
			: 'Pas encore de note'
	);

	async function rate(value: number) {
		selected = value;
		submitting = true;
		error = '';
		try {
			await api.rateConcert(concertId, value);
			submitted = true;
			await invalidateAll();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Une erreur est survenue.';
		} finally {
			submitting = false;
		}
	}

	function onKeydown(event: KeyboardEvent, value: number) {
		if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
			return;
		}
		event.preventDefault();
		const delta = event.key === 'ArrowRight' ? 1 : -1;
		const next = Math.min(5, Math.max(1, value + delta));
		rate(next);
		document.getElementById(`star-${next}`)?.focus();
	}
</script>

<div class="rating">
	<p class="summary">{summaryLabel}</p>
	<div class="stars" role="radiogroup" aria-label="Votre note">
		{#each stars as star (star)}
			<button
				type="button"
				id="star-{star}"
				role="radio"
				aria-checked={selected === star}
				tabindex={star === (selected || 1) ? 0 : -1}
				disabled={submitting}
				class:filled={star <= selected}
				onclick={() => rate(star)}
				onkeydown={(event) => onKeydown(event, star)}
			>
				<span aria-hidden="true">★</span>
				<span class="sr-only">{star} étoile{star > 1 ? 's' : ''}</span>
			</button>
		{/each}
	</div>
	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}
	{#if submitted}
		<p class="confirm" aria-live="polite">Merci, votre note a été enregistrée.</p>
	{/if}
</div>

<style>
	.summary {
		color: var(--ink-soft);
		font-size: 0.875rem;
		margin: 0 0 0.625rem;
	}

	.stars {
		display: flex;
		gap: 0.25rem;
	}

	.stars button {
		background: none;
		border: none;
		padding: 0.125rem;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--line);
		cursor: pointer;
	}

	.stars button:disabled {
		cursor: not-allowed;
	}

	.stars button.filled {
		color: var(--accent);
	}

	.error {
		margin: 0.625rem 0 0;
		font-size: 0.8125rem;
		color: var(--accent-deep);
	}

	.confirm {
		margin: 0.625rem 0 0;
		font-size: 0.8125rem;
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
