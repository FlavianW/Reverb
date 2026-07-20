<script lang="ts">
	import LoginSignupForm from '$lib/components/auth/LoginSignupForm.svelte';
</script>

<svelte:head>
	<title>Connexion — Reverb</title>
</svelte:head>

<div class="split">
	<div class="hero">
		<p class="tagline">Le concert ne s'arrête plus quand les lumières se rallument.</p>
		<p class="brand">Reverb</p>
	</div>
	<div class="form-side">
		<LoginSignupForm />
	</div>
</div>

<style>
	.split {
		min-height: 100vh;
		display: grid;
		grid-template-columns: 1.1fr 1fr;
	}

	.hero {
		position: relative;
		background-image: linear-gradient(180deg, rgba(20, 16, 13, 0.35) 0%, rgba(20, 16, 13, 0.85) 100%),
			url('/images/connexion-hero.jpg');
		background-size: cover;
		background-position: center;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 3rem 3.5rem;
	}

	.tagline {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 400;
		font-size: 2.125rem;
		line-height: 1.35;
		color: #f7f2ea;
		max-width: 520px;
		margin: auto 0 0;
	}

	.brand {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 500;
		font-size: 1.625rem;
		color: #f7f2ea;
		margin: 0;
	}

	.form-side {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem;
	}

	@media (max-width: 800px) {
		.split {
			grid-template-columns: 1fr;
		}

		.hero {
			display: none;
		}
	}
</style>
