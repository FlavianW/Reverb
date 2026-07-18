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
</script>

<header class="profile-header">
	<div
		class="cover"
		aria-hidden="true"
		style:background-image={profile.bannerUrl ? `url(${profile.bannerUrl})` : undefined}
	></div>
	<div class="info">
		<Avatar src={profile.avatarUrl} name={profile.pseudo} size={96} />
		<div class="identity">
			<h1>{profile.pseudo}</h1>
			{#if profile.bio}
				<p class="bio">{profile.bio}</p>
			{/if}
		</div>
		{#if profile.favoriteArtist}
			<div class="favorite-artist">
				{#if profile.favoriteArtistImageUrl}
					<img src={profile.favoriteArtistImageUrl} alt={profile.favoriteArtist} />
				{/if}
				<div class="favorite-artist-text">
					<p class="label">Artiste favori</p>
					<p class="name">{profile.favoriteArtist}</p>
				</div>
			</div>
		{/if}
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
</header>

<style>
	.cover {
		height: 140px;
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
		transform: translateY(-48px);
	}

	.identity {
		flex: 1;
		padding-bottom: 0.5rem;
	}

	.favorite-artist {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.875rem 0.5rem 0.5rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--paper-alt);
		margin-bottom: 0.5rem;
	}

	.favorite-artist img {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.favorite-artist-text .label {
		font-size: 0.6875rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ink-soft);
		margin: 0;
	}

	.favorite-artist-text .name {
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 0.9375rem;
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
	}
</style>
