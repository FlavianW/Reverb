import 'package:flutter/foundation.dart';

import '../models/public_user.dart';
import 'api_client.dart';

enum SessionStatus { unknown, authenticated, anonymous, error }

/// État de session partagé par l'app (utilisateur connecté ou non), calqué
/// sur `hooks.server.ts` côté web : `me()` interroge `/auth/me`, un 401
/// signifie simplement "non connecté", toute autre erreur remonte.
class SessionController extends ChangeNotifier {
  final ApiClient api;

  SessionController(this.api);

  SessionStatus status = SessionStatus.unknown;
  PublicUser? user;

  bool get isAuthenticated => status == SessionStatus.authenticated;

  Future<void> refresh() async {
    try {
      final result = await api.me();
      user = result;
      status = result != null
          ? SessionStatus.authenticated
          : SessionStatus.anonymous;
    } catch (_) {
      // Panne réseau au démarrage (API injoignable) : ni authentifié ni
      // anonyme, sinon `_AuthGate` afficherait indéfiniment le login sans
      // jamais réessayer `refresh()`.
      status = SessionStatus.error;
    }
    notifyListeners();
  }

  Future<void> login({required String email, required String password}) async {
    user = await api.login(email: email, password: password);
    status = SessionStatus.authenticated;
    notifyListeners();
  }

  Future<void> register({
    required String email,
    required String password,
    required String pseudo,
  }) async {
    user = await api.register(email: email, password: password, pseudo: pseudo);
    status = SessionStatus.authenticated;
    notifyListeners();
  }

  Future<void> loginWithGoogle(String idToken) async {
    user = await api.loginWithGoogleIdToken(idToken);
    status = SessionStatus.authenticated;
    notifyListeners();
  }

  Future<void> logout() async {
    await api.logout();
    user = null;
    status = SessionStatus.anonymous;
    notifyListeners();
  }

  /// Utilisé après une mutation de profil pour refléter le pseudo/bio/avatar
  /// à jour dans la nav et l'en-tête de profil sans un aller-retour réseau.
  void updateUser(PublicUser updated) {
    user = updated;
    notifyListeners();
  }
}
