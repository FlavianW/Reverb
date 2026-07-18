export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'reverb-theme';

function isTheme(value: string | null): value is Theme {
	return value === 'light' || value === 'dark';
}

/** Préférence explicitement choisie par l'utilisateur (bouton de bascule), `null` si jamais définie. */
export function getStoredTheme(): Theme | null {
	const value = localStorage.getItem(STORAGE_KEY);
	return isTheme(value) ? value : null;
}

/** Thème effectivement affiché : la préférence stockée, sinon celle du système. */
export function currentTheme(): Theme {
	return (
		getStoredTheme() ??
		(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
	);
}

/** Bascule et persiste le thème, appliqué immédiatement sur `<html>`. */
export function setTheme(theme: Theme): void {
	localStorage.setItem(STORAGE_KEY, theme);
	document.documentElement.dataset.theme = theme;
}
