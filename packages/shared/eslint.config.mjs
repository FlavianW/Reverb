// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

// Package de types purs (aucun code exécutable hors constantes) : la config
// "recommended" simple suffit, pas besoin du lint avec typage complet de l'API.
export default tseslint.config(
  {
    ignores: ['dist/**', 'eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
