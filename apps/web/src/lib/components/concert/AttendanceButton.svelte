<script lang="ts">
	import { api } from '$lib/api/client';

	interface Props {
		concertId: string;
		initialAttending: boolean;
	}

	let { concertId, initialAttending }: Props = $props();

	let attending = $state(initialAttending);
	let pending = $state(false);

	async function toggle() {
		pending = true;
		try {
			if (attending) {
				await api.unmarkAttendance(concertId);
				attending = false;
			} else {
				await api.markAttendance(concertId);
				attending = true;
			}
		} finally {
			pending = false;
		}
	}
</script>

<button type="button" class="attendance" class:active={attending} aria-pressed={attending} onclick={toggle} disabled={pending}>
	J'y étais
</button>

<style>
	.attendance {
		padding: 0.7rem 1.25rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--line);
		background: var(--paper-alt);
		color: var(--ink);
		font-weight: 700;
		font-size: 0.9375rem;
		cursor: pointer;
	}

	.attendance:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.attendance.active {
		background: var(--accent);
		border-color: var(--accent);
		color: #fbf6ee;
	}
</style>
