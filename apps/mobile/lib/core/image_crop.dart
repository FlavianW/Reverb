import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_cropper/image_cropper.dart';

import 'theme.dart';

/// Recadre une image au ratio demandé avant upload (US-4.1) : miroir de
/// `ImageCropModal.svelte` côté web, via l'UI de recadrage native
/// (`image_cropper`) plutôt qu'un canvas fait main. `null` si l'utilisateur
/// annule.
Future<File?> cropImage(
  BuildContext context, {
  required String sourcePath,
  required double aspectRatioX,
  required double aspectRatioY,
}) async {
  final accent = context.colors.accent;

  final cropped = await ImageCropper().cropImage(
    sourcePath: sourcePath,
    aspectRatio: CropAspectRatio(ratioX: aspectRatioX, ratioY: aspectRatioY),
    compressFormat: ImageCompressFormat.jpg,
    compressQuality: 90,
    uiSettings: [
      AndroidUiSettings(
        toolbarTitle: 'Recadrer',
        toolbarColor: accent,
        toolbarWidgetColor: Colors.white,
        lockAspectRatio: true,
      ),
      IOSUiSettings(title: 'Recadrer', aspectRatioLockEnabled: true, resetAspectRatioEnabled: false),
    ],
  );

  return cropped == null ? null : File(cropped.path);
}
