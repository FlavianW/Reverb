<script lang="ts">
	import type { PostSummary } from '@reverb/shared';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import LikeButton from './LikeButton.svelte';

	interface Props {
		post: PostSummary;
		canDelete: boolean;
		onDelete: () => Promise<void>;
	}

	let { post, canDelete, onDelete }: Props = $props();

	let deleting = $state(false);

	const formattedDate = $derived(
		new Date(post.createdAt).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		})
	);

	const stars = $derived(
		'★'.repeat(post.ratingValue ?? 0) + '☆'.repeat(5 - (post.ratingValue ?? 0))
	);

	async function handleDelete() {
		deleting = true;
		try {
			await onDelete();
		} finally {
			deleting = false;
		}
	}
</script>

<article class="post">
	<header>
		<Avatar src={post.author.avatarUrl} name={post.author.pseudo} size={40} />
		<div class="meta">
			<span class="pseudo">{post.author.pseudo}</span>
			<span class="date">{formattedDate}</span>
		</div>
	</header>

	<div class="body">
		{#if post.type === 'RATING' && post.concert}
			<p>
				A noté <a href="/concerts/{post.concert.id}">{post.concert.artistName}</a>
				<span class="stars" aria-label="{post.ratingValue} sur 5 étoiles">{stars}</span>
			</p>
		{:else if post.type === 'ATTENDANCE' && post.concert}
			<p>A marqué sa présence à <a href="/concerts/{post.concert.id}">{post.concert.artistName}</a></p>
		{:else}
			{#if post.concert}
				<p class="concert-tag">
					À propos de <a href="/concerts/{post.concert.id}">{post.concert.artistName}</a>
				</p>
			{/if}
			{#if post.content}
				<p class="content">{post.content}</p>
			{/if}
			{#if post.photos.length > 0}
				<div class="photos">
					{#each post.photos as photo (photo.id)}
						<img src={photo.url} alt="Photo partagée par {post.author.pseudo}" loading="lazy" />
					{/each}
				</div>
			{:else if post.video}
				<div class="video">
					{#if post.video.status === 'READY' && post.video.url}
						<video controls preload="metadata" poster={post.video.posterUrl ?? undefined}>
							<source src={post.video.url} type="video/mp4" />
							Votre navigateur ne prend pas en charge la lecture vidéo.
						</video>
					{:else if post.video.status === 'FAILED'}
						<p class="video-status video-status-failed">Échec du traitement de la vidéo.</p>
					{:else}
						<p class="video-status">Vidéo en cours de traitement…</p>
					{/if}
				</div>
			{/if}
		{/if}
	</div>

	<footer>
		<LikeButton
			postId={post.id}
			initialLikeCount={post.likeCount}
			initialLikedByMe={post.likedByMe}
		/>
		{#if canDelete}
			<button type="button" class="delete" onclick={handleDelete} disabled={deleting}>
				Supprimer
			</button>
		{/if}
	</footer>
</article>

<style>
	.post {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--paper-alt);
	}

	header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.meta {
		display: flex;
		flex-direction: column;
	}

	.pseudo {
		font-family: var(--font-serif);
		font-weight: 500;
		font-size: 0.9375rem;
		color: var(--ink);
	}

	.date {
		color: var(--ink-soft);
		font-size: 0.75rem;
	}

	.body p {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--ink);
	}

	.body a {
		color: var(--accent-deep);
		font-weight: 700;
		text-decoration: none;
	}

	.body a:hover,
	.body a:focus-visible {
		text-decoration: underline;
	}

	.stars {
		color: var(--accent);
		letter-spacing: 0.05em;
	}

	.concert-tag {
		color: var(--ink-soft) !important;
		font-size: 0.8125rem !important;
	}

	.content {
		white-space: pre-wrap;
	}

	.photos {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.5rem;
	}

	.photos img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: var(--radius-sm);
	}

	.video video {
		width: 100%;
		max-height: 480px;
		border-radius: var(--radius-sm);
		background: #000;
	}

	.video-status {
		margin: 0;
		padding: 1.5rem;
		text-align: center;
		border-radius: var(--radius-sm);
		background: var(--paper);
		color: var(--ink-soft);
		font-size: 0.875rem;
	}

	.video-status-failed {
		color: var(--accent-deep);
	}

	footer {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.delete {
		background: none;
		border: none;
		color: var(--ink-soft);
		font-size: 0.8125rem;
		text-decoration: underline;
		cursor: pointer;
		padding: 0;
	}

	.delete:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
</style>
