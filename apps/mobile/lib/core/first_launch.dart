import 'package:shared_preferences/shared_preferences.dart';

const _prefsKey = 'reverb_has_launched_before';

/// Vrai uniquement au tout premier démarrage de l'app sur cet appareil,
/// jamais ensuite : marque immédiatement le lancement comme vu, pour que
/// l'écran de connexion sache accueillir un nouvel utilisateur différemment
/// (« Rejoindre Reverb » plutôt que « Bon retour parmi nous », qui n'a pas
/// de sens pour quelqu'un qui n'est jamais venu).
Future<bool> consumeFirstLaunch() async {
  final prefs = await SharedPreferences.getInstance();
  final isFirstLaunch = !(prefs.getBool(_prefsKey) ?? false);
  if (isFirstLaunch) {
    await prefs.setBool(_prefsKey, true);
  }
  return isFirstLaunch;
}
