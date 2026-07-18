import 'package:mobile/core/api_client.dart';
import 'package:mobile/models/public_user.dart';

/// Double de test pour [ApiClient] : évite tout appel réseau réel (dio,
/// path_provider) en court-circuitant chaque méthode par un callback
/// configurable, appelé au lieu du comportement HTTP d'origine.
class FakeApiClient extends ApiClient {
  Future<PublicUser?> Function()? onMe;
  Future<PublicUser> Function(String email, String password)? onLogin;
  Future<PublicUser> Function(String email, String password, String pseudo)?
  onRegister;
  Future<void> Function()? onLogout;
  Future<void> Function(String concertId, int value)? onRateConcert;
  Future<void> Function(String concertId)? onMarkAttendance;
  Future<void> Function(String concertId)? onUnmarkAttendance;

  @override
  Future<PublicUser?> me() => onMe!();

  @override
  Future<PublicUser> login({required String email, required String password}) =>
      onLogin!(email, password);

  @override
  Future<PublicUser> register({
    required String email,
    required String password,
    required String pseudo,
  }) => onRegister!(email, password, pseudo);

  @override
  Future<void> logout() => onLogout!();

  @override
  Future<void> rateConcert(String id, int value) => onRateConcert!(id, value);

  @override
  Future<void> markAttendance(String id) => onMarkAttendance!(id);

  @override
  Future<void> unmarkAttendance(String id) => onUnmarkAttendance!(id);
}
