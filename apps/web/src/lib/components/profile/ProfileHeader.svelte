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
			{#if profile.favoriteArtist}
				<p class="favorite-artist">Artiste favori : {profile.favoriteArtist}</p>
			{/if}
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
</header>

<style>
	.cover {
		height: 140px;
		background-color: var(--accent);
		background-image: linear-gradient(160deg, var(--accent-deep), var(--accent));
		background-size: cover;
		background-position: center;
	}

	.favorite-artist {
		color: var(--ink-soft);
		font-size: 0.8125rem;
		margin: 0 0 0.25rem;
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
