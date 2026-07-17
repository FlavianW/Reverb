import { ParseFilePipeBuilder } from '@nestjs/common';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Filet de validation partagé par tous les uploads d'image (photos de concert, avatar). */
export function buildImageFileValidator() {
  return new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: /^(image\/jpeg|image\/png|image\/webp)$/,
    })
    .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE_BYTES })
    .build({ errorHttpStatusCode: 400 });
}
