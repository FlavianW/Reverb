<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { api, ApiError } from '$lib/api/client';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';

	let mode = $state<'login' | 'signup'>('login');
	let pseudo = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	const isSignup = $derived(mode === 'signup');
	const title = $derived(isSignup ? 'Rejoindre Reverb' : 'Bon retour parmi nous');
	const subtitle = $derived(
		isSignup
			? 'Créez votre compte pour garder la mémoire de chaque concert.'
			: 'Retrouvez vos concerts et vos discussions.'
	);
	const submitLabel = $derived(isSignup ? 'Créer mon compte' : 'Se connecter');

	function toggleMode() {
		mode = isSignup ? 'login' : 'signup';
		error = '';
	}

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		submitting = true;
		try {
			if (isSignup) {
				await api.register({ email, password, pseudo });
			} else {
				await api.login({ email, password });
			}
			await goto('/', { invalidateAll: true });
		} catch (e) {
			error =
				e instanceof ApiError
					? e.message
					: 'Une erreur est survenue. Veuillez réessayer.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="panel">
	<h1>{title}</h1>
	<p class="subtitle">{subtitle}</p>

	<form onsubmit={onSubmit}>
		{#if isSignup}
			<FormField id="pseudo" label="Pseudo" bind:value={pseudo} required autocomplete="username" />
		{/if}
		<FormField
			id="email"
			label="Adresse e-mail"
			type="email"
			placeholder="vous@exemple.com"
			bind:value={email}
			required
			autocomplete="email"
		/>
		<FormField
			id="password"
			label="Mot de passe"
			type="password"
			placeholder="••••••••"
			bind:value={password}
			required
			autocomplete={isSignup ? 'new-password' : 'current-password'}
		/>

		{#if error}
			<p class="form-error" role="alert">{error}</p>
		{/if}

		<Button type="submit" fullWidth disabled={submitting}>{submitLabel}</Button>
	</form>

	<div class="divider">
		<span></span>
		<span class="divider-label">ou continuer avec</span>
		<span></span>
	</div>

	<Button variant="secondary" fullWidth href="{PUBLIC_API_URL}/auth/google">Google</Button>

	<p class="switch">
		{isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
		<button type="button" class="switch-action" onclick={toggleMode}>
			{isSignup ? 'Se connecter' : 'Créer un compte'}
		</button>
	</p>
</div>

<style>
	.panel {
		width: 100%;
		max-width: 380px;
	}

	h1 {
		font-size: 1.875rem;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: var(--ink-soft);
		font-size: 0.9375rem;
		margin: 0 0 2rem;
	}

	.form-error {
		margin: -0.5rem 0 1.25rem;
		font-size: 0.875rem;
		color: var(--accent-deep);
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 1.5rem 0;
	}

	.divider span:not(.divider-label) {
		flex: 1;
		height: 1px;
		background: var(--line);
	}

	.divider-label {
		font-size: 0.75rem;
		color: var(--ink-soft);
	}

	.switch {
		text-align: center;
		margin-top: 1.75rem;
		font-size: 0.875rem;
		color: var(--ink-soft);
	}

	.switch-action {
		background: none;
		border: none;
		padding: 0;
		color: var(--accent);
		font-weight: 600;
		cursor: pointer;
		font-size: inherit;
		font-family: inherit;
	}
</style>
