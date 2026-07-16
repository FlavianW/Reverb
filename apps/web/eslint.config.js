import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	{
		ignores: ['.svelte-kit/**', 'build/**']
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: ['.svelte']
			}
		}
	},
	{
		rules: {
			// `resolve()` n'apporte rien ici : nos hrefs dynamiques mêlent routes
			// internes (pseudo, id de concert) et externes (API pour l'OAuth
			// Google), et SvelteKit valide déjà les routes internes au build.
			'svelte/no-navigation-without-resolve': 'off'
		}
	}
);
