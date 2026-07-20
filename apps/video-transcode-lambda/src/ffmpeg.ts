/**
 * Rendu web uniforme (H.264/AAC), plafonné à 720p pour maîtriser temps de
 * traitement et coût — un concert filmé au téléphone n'a pas besoin de plus
 * pour une lecture dans l'app. `-2` laisse ffmpeg calculer une hauteur paire
 * (contrainte de l'encodeur H.264) à partir du ratio d'origine.
 */
export function buildPlaybackArgs(
  inputPath: string,
  outputPath: string,
): string[] {
  return [
    '-y',
    '-i',
    inputPath,
    '-vf',
    "scale='min(1280,iw)':-2",
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    outputPath,
  ];
}

/** Vignette extraite à la 1re seconde (évite une frame noire de fondu d'ouverture à 0). */
export function buildPosterArgs(
  inputPath: string,
  outputPath: string,
): string[] {
  return [
    '-y',
    '-i',
    inputPath,
    '-ss',
    '00:00:01',
    '-vframes',
    '1',
    outputPath,
  ];
}

export function buildDurationProbeArgs(inputPath: string): string[] {
  return [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    inputPath,
  ];
}

/** `ffprobe` renvoie la durée en secondes flottantes ; arrondie pour l'affichage. */
export function parseDurationSeconds(
  ffprobeStdout: string,
): number | undefined {
  const value = Number.parseFloat(ffprobeStdout.trim());
  return Number.isFinite(value) ? Math.round(value) : undefined;
}
