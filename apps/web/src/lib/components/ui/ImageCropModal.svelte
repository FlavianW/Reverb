<script lang="ts">
	/**
	 * Recadrage/zoom avant upload (US-4.1) : évite qu'une image d'un format
	 * quelconque soit étirée/coupée n'importe comment par le CSS `object-fit`
	 * (surtout visible sur la bannière, beaucoup plus large que haute).
	 * L'utilisateur cadre lui-même la zone visible, exportée en JPEG au ratio
	 * cible via un canvas — le fichier envoyé au serveur est déjà au bon format.
	 */
	interface Props {
		file: File;
		title: string;
		/** Largeur / hauteur de la zone de cadrage. */
		aspectRatio: number;
		/** Résolution du fichier exporté (respecte aspectRatio). */
		outputWidth: number;
		outputHeight: number;
		/** Masque circulaire (avatar) plutôt que rectangulaire (bannière). */
		circular?: boolean;
		onConfirm: (blob: Blob) => void;
		onCancel: () => void;
	}

	let {
		file,
		title,
		aspectRatio,
		outputWidth,
		outputHeight,
		circular = false,
		onConfirm,
		onCancel
	}: Props = $props();

	const VIEWPORT_WIDTH = 360;
	const viewportHeight = Math.round(VIEWPORT_WIDTH / aspectRatio);

	let dialogEl: HTMLDialogElement | undefined = $state();
	let imageEl: HTMLImageElement | undefined = $state();
	let imageUrl = $state('');
	let ready = $state(false);

	let naturalWidth = 0;
	let naturalHeight = 0;
	let baseScale = 1;
	let zoom = $state(1);
	let offsetX = $state(0);
	let offsetY = $state(0);

	let dragging = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let dragStartOffsetX = 0;
	let dragStartOffsetY = 0;
	/** Distingue une fermeture par confirmation d'une fermeture par annulation
	 *  (bouton Annuler ou touche Échap, toutes deux déclenchent `close`). */
	let confirmed = false;

	$effect(() => {
		const url = URL.createObjectURL(file);
		imageUrl = url;
		return () => URL.revokeObjectURL(url);
	});

	$effect(() => {
		dialogEl?.showModal();
	});

	function cancel() {
		dialogEl?.close();
	}

	function onDialogClose() {
		if (!confirmed) {
			onCancel();
		}
	}

	function onImageLoad() {
		if (!imageEl) return;
		naturalWidth = imageEl.naturalWidth;
		naturalHeight = imageEl.naturalHeight;
		baseScale = Math.max(VIEWPORT_WIDTH / naturalWidth, viewportHeight / naturalHeight);
		zoom = 1;
		centerImage();
		ready = true;
	}

	function displayScale() {
		return baseScale * zoom;
	}

	function centerImage() {
		const scale = displayScale();
		offsetX = (VIEWPORT_WIDTH - naturalWidth * scale) / 2;
		offsetY = (viewportHeight - naturalHeight * scale) / 2;
	}

	function clampOffsets() {
		const scale = displayScale();
		const dispW = naturalWidth * scale;
		const dispH = naturalHeight * scale;
		offsetX = Math.min(0, Math.max(VIEWPORT_WIDTH - dispW, offsetX));
		offsetY = Math.min(0, Math.max(viewportHeight - dispH, offsetY));
	}

	function onZoomChange() {
		clampOffsets();
	}

	function onPointerDown(event: PointerEvent) {
		if (!ready) return;
		dragging = true;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
		dragStartOffsetX = offsetX;
		dragStartOffsetY = offsetY;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;
		offsetX = dragStartOffsetX + (event.clientX - dragStartX);
		offsetY = dragStartOffsetY + (event.clientY - dragStartY);
		clampOffsets();
	}

	function onPointerUp() {
		dragging = false;
	}

	const KEYBOARD_PAN_STEP = 12;

	/** Repositionnement au clavier (RGAA) : le glisser-déposer n'est pas la seule façon de cadrer. */
	function onKeydown(event: KeyboardEvent) {
		if (!ready) return;
		if (event.key === 'ArrowLeft') offsetX += KEYBOARD_PAN_STEP;
		else if (event.key === 'ArrowRight') offsetX -= KEYBOARD_PAN_STEP;
		else if (event.key === 'ArrowUp') offsetY += KEYBOARD_PAN_STEP;
		else if (event.key === 'ArrowDown') offsetY -= KEYBOARD_PAN_STEP;
		else return;
		event.preventDefault();
		clampOffsets();
	}

	function confirm() {
		const scale = displayScale();
		const srcX = -offsetX / scale;
		const srcY = -offsetY / scale;
		const srcW = VIEWPORT_WIDTH / scale;
		const srcH = viewportHeight / scale;

		const canvas = document.createElement('canvas');
		canvas.width = outputWidth;
		canvas.height = outputHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx || !imageEl) return;
		ctx.drawImage(imageEl, srcX, srcY, srcW, srcH, 0, 0, outputWidth, outputHeight);

		confirmed = true;
		dialogEl?.close();
		canvas.toBlob(
			(blob) => {
				if (blob) onConfirm(blob);
			},
			'image/jpeg',
			0.9
		);
	}
</script>

<dialog bind:this={dialogEl} aria-label={title} onclose={onDialogClose}>
	<h2>{title}</h2>

	<div
		class="viewport"
		class:circular
		role="button"
		aria-label="Repositionner l'image : glisser-déposer ou flèches du clavier"
		tabindex="0"
		style:width="{VIEWPORT_WIDTH}px"
		style:height="{viewportHeight}px"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onkeydown={onKeydown}
	>
		<img
			bind:this={imageEl}
			src={imageUrl}
			alt=""
			onload={onImageLoad}
			draggable="false"
			style:transform="translate({offsetX}px, {offsetY}px) scale({displayScale()})"
			style:transform-origin="0 0"
		/>
	</div>

	<label class="zoom-field">
		Zoom
		<input
			type="range"
			min="1"
			max="3"
			step="0.01"
			bind:value={zoom}
			oninput={onZoomChange}
			disabled={!ready}
		/>
	</label>

	<div class="actions">
		<button type="button" onclick={cancel}>Annuler</button>
		<button type="button" class="confirm" onclick={confirm} disabled={!ready}>
			Valider le cadrage
		</button>
	</div>
</dialog>

<style>
	dialog {
		position: fixed;
		inset: 0;
		margin: auto;
		width: fit-content;
		height: fit-content;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		padding: 1.5rem;
		color: var(--ink);
		background: var(--paper-alt);
		z-index: 100;
	}

	dialog::backdrop {
		background: rgba(28, 26, 23, 0.5);
	}

	h2 {
		font-size: 1.0625rem;
		margin: 0 0 1rem;
	}

	.viewport {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-sm);
		background: var(--paper);
		touch-action: none;
		cursor: grab;
	}

	.viewport.circular {
		border-radius: 50%;
	}

	.viewport img {
		position: absolute;
		top: 0;
		left: 0;
		max-width: none;
		user-select: none;
	}

	.zoom-field {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1rem;
		font-size: 0.8125rem;
		color: var(--ink-soft);
	}

	.zoom-field input {
		flex: 1;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.625rem;
		margin-top: 1.25rem;
	}

	.actions button {
		padding: 0.6rem 1.1rem;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		cursor: pointer;
		font-family: var(--font-sans);
	}

	.actions button[type='button']:not(.confirm) {
		background: none;
		border: 1px solid var(--line);
		color: var(--ink);
	}

	.confirm {
		border: 1px solid var(--ink);
		background: var(--ink);
		color: var(--paper);
	}

	.confirm:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
