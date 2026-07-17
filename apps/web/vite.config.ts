import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// @reverb/shared est compilé en CommonJS (contrainte de ts-jest côté apps/api) :
	// on le force en dépendance SSR externe pour que Node le charge via require()
	// au lieu que Vite tente de l'inliner comme un module ESM (`exports is not defined`),
	// et on le fait pré-empaqueter par esbuild côté client pour l'interop CJS -> ESM
	// (sinon le navigateur échoue avec « does not provide an export named ... »).
	ssr: {
		external: ['@reverb/shared']
	},
	optimizeDeps: {
		include: ['@reverb/shared']
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	]
});
