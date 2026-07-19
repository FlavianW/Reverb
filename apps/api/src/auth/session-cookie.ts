// Réexport local : le nom du cookie vit dans @reverb/shared (le web le lit
// aussi), mais les modules de l'API l'importent d'ici comme le reste de l'auth.
export { SESSION_COOKIE_NAME } from '@reverb/shared';
