<script lang="ts">
	import { api } from '$lib/api/client';

	interface Props {
		postId: string;
		initialLikeCount: number;
		initialLikedByMe: boolean;
	}

	let { postId, initialLikeCount, initialLikedByMe }: Props = $props();

	let likeCount = $state(initialLikeCount);
	let likedByMe = $state(initialLikedByMe);
	let pending = $state(false);

	async function toggle() {
		pending = true;
		try {
			if (likedByMe) {
				await api.unlikePost(postId);
				likedByMe = false;
				likeCount -= 1;
			} else {
				await api.likePost(postId);
				likedByMe = true;
				likeCount += 1;
			}
		} finally {
			pending = false;
		}
	}
</script>

<button
	type="button"
	class="like"
	class:active={likedByMe}
	aria-pressed={likedByMe}
	onclick={toggle}
	disabled={pending}
>
	<span aria-hidden="true">{likedByMe ? '♥' : '♡'}</span>
	<span class="count">{likeCount}</span>
	<span class="sr-only">{likedByMe ? 'Retirer le like' : 'Aimer ce post'}</span>
</button>

<style>
	.like {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper-alt);
		color: var(--ink-soft);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.like:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.like.active {
		border-color: var(--accent);
		color: var(--accent-deep);
	}

	.count {
		font-variant-numeric: tabular-nums;
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
