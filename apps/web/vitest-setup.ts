import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach, vi } from 'vitest';

// Modules virtuels SvelteKit, non résolubles tels quels sous Vitest : mockés
// une fois ici plutôt que dans chaque fichier de test qui importe (même
// indirectement, via $lib/api/client) l'un des deux.
vi.mock('$env/static/public', () => ({ PUBLIC_API_URL: 'http://localhost:3000' }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidateAll: vi.fn() }));

// jsdom n'implémente pas <dialog>.showModal()/close() : polyfill minimal
// (juste l'attribut "open"), suffisant pour les tests qui n'exercent pas le
// rendu visuel du backdrop natif.
if (!HTMLDialogElement.prototype.showModal) {
	HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
	};
	HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
		this.removeAttribute('open');
	};
}

// @testing-library/svelte ne démonte pas automatiquement le composant entre
// deux tests : sans ce nettoyage, le DOM d'un test contamine les requêtes
// (`getByRole`) du suivant.
afterEach(() => cleanup());
