import { ParseFilePipeBuilder } from '@nestjs/common';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const IMAGE_MIME_TYPE = /^(image\/jpeg|image\/png|image\/webp)$/;

/** Filet de validation partagé par tous les uploads d'image (photos de concert, avatar). */
export function buildImageFileValidator() {
  return new ParseFilePipeBuilder()
    .addFileTypeValidator({ fileType: IMAGE_MIME_TYPE })
    .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE_BYTES })
    .build({ errorHttpStatusCode: 400 });
}

/**
 * Même validation, pour un post explicite dont les photos sont facultatives
 * (`fileIsRequired: false` : un post peut ne contenir que du texte).
 */
export function buildOptionalImageFilesValidator() {
  return new ParseFilePipeBuilder()
    .addFileTypeValidator({ fileType: IMAGE_MIME_TYPE })
    .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE_BYTES })
    .build({ errorHttpStatusCode: 400, fileIsRequired: false });
}
