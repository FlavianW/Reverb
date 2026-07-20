<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import { REPORT_REASONS, type ReportReason } from '@reverb/shared';

	interface Props {
		onReport: (reason: ReportReason) => Promise<unknown>;
	}

	let { onReport }: Props = $props();

	const REASON_LABELS: Record<ReportReason, string> = {
		SPAM: 'Spam',
		INAPPROPRIATE: 'Contenu inapproprié',
		HARASSMENT: 'Harcèlement',
		OTHER: 'Autre'
	};

	const uid = $props.id();

	let dialogEl: HTMLDialogElement | undefined = $state();
	let reason = $state<ReportReason>('SPAM');
	let reported = $state(false);
	let submitting = $state(false);
	let error = $state('');

	function openDialog() {
		error = '';
		dialogEl?.showModal();
	}

	function closeDialog() {
		dialogEl?.close();
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		error = '';
		try {
			await onReport(reason);
			reported = true;
			dialogEl?.close();
		} catch (e) {
			if (e instanceof ApiError && e.status === 409) {
				reported = true;
				dialogEl?.close();
			} else {
				error = e instanceof ApiError ? e.message : 'Une erreur est survenue.';
			}
		} finally {
			submitting = false;
		}
	}
</script>

<button type="button" class="report-trigger" onclick={openDialog} disabled={reported}>
	{reported ? 'Signalé' : 'Signaler'}
</button>

<dialog bind:this={dialogEl} aria-labelledby="report-heading-{uid}">
	<form onsubmit={submit}>
		<h2 id="report-heading-{uid}">Signaler ce contenu</h2>
		<fieldset>
			<legend>Motif</legend>
			{#each REPORT_REASONS as r (r)}
				<label>
					<input type="radio" name="reason-{uid}" value={r} bind:group={reason} />
					{REASON_LABELS[r]}
				</label>
			{/each}
		</fieldset>
		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}
		<div class="actions">
			<button type="button" onclick={closeDialog}>Annuler</button>
			<button type="submit" disabled={submitting}>Confirmer</button>
		</div>
	</form>
</dialog>

<style>
	.report-trigger {
		background: none;
		border: none;
		padding: 0;
		color: var(--ink-soft);
		font-size: 0.8125rem;
		text-decoration: underline;
		cursor: pointer;
	}

	.report-trigger:disabled {
		cursor: default;
		text-decoration: none;
	}

	dialog {
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		padding: 1.5rem;
		max-width: 360px;
		width: 90vw;
		color: var(--ink);
		background: var(--paper-alt);
	}

	dialog::backdrop {
		background: rgba(28, 26, 23, 0.4);
	}

	h2 {
		font-size: 1.0625rem;
		margin: 0 0 1rem;
	}

	fieldset {
		border: none;
		padding: 0;
		margin: 0 0 1rem;
	}

	legend {
		font-size: 0.8125rem;
		color: var(--ink-soft);
		padding: 0;
		margin-bottom: 0.5rem;
	}

	fieldset label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		padding: 0.3125rem 0;
	}

	.error {
		margin: 0 0 1rem;
		font-size: 0.8125rem;
		color: var(--accent-deep);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.625rem;
	}

	.actions button {
		padding: 0.5rem 1rem;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.actions button[type='button'] {
		background: none;
		border: 1px solid var(--line);
		color: var(--ink);
	}

	.actions button[type='submit'] {
		background: var(--accent);
		border: 1px solid var(--accent);
		color: var(--on-accent);
	}

	.actions button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
</style>
