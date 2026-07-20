<script lang="ts">
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import EditProfileModal from './EditProfileModal.svelte';
	import FriendButton from './FriendButton.svelte';
	import type { FriendshipStatusWithUser, PublicProfile, PublicUser } from '@reverb/shared';

	interface Props {
		profile: PublicProfile;
		editableAs: PublicUser | null;
		friendshipStatus: FriendshipStatusWithUser | null;
	}

	let { profile, editableAs, friendshipStatus }: Props = $props();

	// Une photo qui échoue à charger retombe sur l'initiale, comme le reste
	// des cartes concert/recherche — réinitialisé si l'URL change (nouveau profil visité).
	let imageFailed = $state(false);
	let lastImageUrl = profile.favoriteArtistImageUrl;
	$effect(() => {
		if (profile.favoriteArtistImageUrl !== lastImageUrl) {
			lastImageUrl = profile.favoriteArtistImageUrl;
			imageFailed = false;
		}
	});
</script>

<header class="profile-header">
	<div
		class="cover"
		aria-hidden="true"
		style:background-image={profile.bannerUrl ? `url(${profile.bannerUrl})` : undefined}
	></div>
	<div class="info">
		<div class="avatar-ring">
			<Avatar src={profile.avatarUrl} name={profile.pseudo} size={136} />
		</div>
		<div class="identity">
			<h1>{profile.pseudo}</h1>
			{#if profile.bio}
				<p class="bio">{profile.bio}</p>
			{/if}
		</div>
		{#if editableAs}
			<EditProfileModal user={editableAs} />
		{:else if friendshipStatus}
			<FriendButton
				pseudo={profile.pseudo}
				status={friendshipStatus.status}
				friendshipId={friendshipStatus.friendshipId}
			/>
		{/if}
	</div>

	{#if profile.favoriteArtist}
		<div class="favorite-artist-wrap">
			<div class="favorite-artist">
				{#if profile.favoriteArtistImageUrl && !imageFailed}
					<img
						src={profile.favoriteArtistImageUrl}
						alt={profile.favoriteArtist}
						onerror={() => (imageFailed = true)}
					/>
				{:else}
					<div class="favorite-artist-placeholder" aria-hidden="true">
						{profile.favoriteArtist.charAt(0).toUpperCase()}
					</div>
				{/if}
				<div class="favorite-artist-text">
					<p class="label">Artiste favori</p>
					<p class="name">{profile.favoriteArtist}</p>
				</div>
			</div>
		</div>
	{/if}
</header>

<style>
	.cover {
		height: 280px;
		background-color: var(--accent);
		background-image: linear-gradient(160deg, var(--accent-deep), var(--accent));
		background-size: cover;
		background-position: center;
	}

	.info {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 3rem;
		display: flex;
		align-items: flex-end;
		gap: 1.5rem;
		transform: translateY(-68px);
	}

	.avatar-ring {
		flex-shrink: 0;
		padding: 5px;
		border-radius: 50%;
		background: var(--paper);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
	}

	.identity {
		flex: 1;
		padding-bottom: 0.5rem;
	}

	.favorite-artist-wrap {
		max-width: 1200px;
		margin: 1.5rem auto 2rem;
		padding: 0 3rem;
	}

	.favorite-artist {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 1.25rem 1.75rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--paper-alt);
	}

	.favorite-artist img,
	.favorite-artist-placeholder {
		width: 110px;
		height: 110px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.favorite-artist img {
		object-fit: cover;
	}

	.favorite-artist-placeholder {
		background: var(--accent-soft);
		color: var(--accent-deep);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-serif);
		font-size: 2.5rem;
		font-weight: 500;
	}

	.favorite-artist-text .label {
		font-size: 0.8125rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-soft);
		margin: 0 0 0.25rem;
	}

	.favorite-artist-text .name {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 500;
		font-size: 2.25rem;
		margin: 0;
	}

	h1 {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 500;
		font-size: 1.75rem;
		margin: 0 0 0.25rem;
	}

	.bio {
		color: var(--ink-soft);
		font-size: 0.9375rem;
		margin: 0;
		max-width: 480px;
	}

	@media (max-width: 640px) {
		.info {
			flex-direction: column;
			align-items: flex-start;
			padding: 0 1.25rem;
		}

		.favorite-artist-wrap {
			padding: 0 1.25rem;
		}

		.favorite-artist {
			gap: 1rem;
			padding: 1rem;
		}

		.favorite-artist img,
		.favorite-artist-placeholder {
			width: 72px;
			height: 72px;
		}

		.favorite-artist-text .name {
			font-size: 1.5rem;
		}
	}
</style>
