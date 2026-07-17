<script lang="ts">
	interface Props {
		src?: string | null;
		name: string;
		size?: number;
		alt?: string;
	}

	let { src, name, size = 40, alt }: Props = $props();

	const initial = $derived(name.charAt(0).toUpperCase());
</script>

<div class="avatar" style:width="{size}px" style:height="{size}px" style:font-size="{size * 0.35}px">
	{#if src}
		<img {src} alt={alt ?? name} width={size} height={size} />
	{:else}
		<span aria-hidden="true">{initial}</span>
		<span class="sr-only">{alt ?? name}</span>
	{/if}
</div>

<style>
	.avatar {
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
		background: var(--accent-soft);
		color: var(--accent-deep);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
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
