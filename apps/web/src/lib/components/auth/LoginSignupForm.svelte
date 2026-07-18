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
			? 'Créez votre compte pour garder le souvenir de chaque concert.'
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

	<Button variant="secondary" fullWidth href="{PUBLIC_API_URL}/auth/google">
		<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
			<path
				fill="#4285F4"
				d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
			/>
			<path
				fill="#34A853"
				d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
			/>
			<path
				fill="#FBBC05"
				d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1022-1.17.2822-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z"
			/>
			<path
				fill="#EA4335"
				d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"
			/>
		</svg>
		Continuer avec Google
	</Button>

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
