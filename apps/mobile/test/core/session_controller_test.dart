import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/session.dart';
import 'package:mobile/models/public_user.dart';

import '../support/fake_api_client.dart';

const _user = PublicUser(
  id: 'u1',
  pseudo: 'alice',
  email: 'alice@example.com',
  avatarUrl: null,
  bannerUrl: null,
  bio: null,
  favoriteArtist: null,
);

void main() {
  group('SessionController.refresh', () {
    test(
      'un utilisateur renvoyé par /auth/me passe la session en authenticated',
      () async {
        final api = FakeApiClient()..onMe = () async => _user;
        final session = SessionController(api);

        await session.refresh();

        expect(session.isAuthenticated, isTrue);
        expect(session.user, _user);
      },
    );

    test('null (401) passe la session en anonymous', () async {
      final api = FakeApiClient()..onMe = () async => null;
      final session = SessionController(api);

      await session.refresh();

      expect(session.isAuthenticated, isFalse);
      expect(session.status, SessionStatus.anonymous);
    });

    test(
      'une erreur réseau passe la session en error plutôt que de rester bloquée',
      () async {
        final api = FakeApiClient()
          ..onMe = () async => throw Exception('Connection refused');
        final session = SessionController(api);

        await session.refresh();

        expect(session.status, SessionStatus.error);
      },
    );
  });

  test('login authentifie et notifie les auditeurs', () async {
    final api = FakeApiClient()..onLogin = (email, password) async => _user;
    final session = SessionController(api);
    var notified = false;
    session.addListener(() => notified = true);

    await session.login(email: _user.email, password: 'secret');

    expect(session.isAuthenticated, isTrue);
    expect(notified, isTrue);
  });

  test(
    'loginWithGoogle authentifie avec l\'ID token et notifie les auditeurs',
    () async {
      final api = FakeApiClient()
        ..onLoginWithGoogleIdToken = (idToken) async => _user;
      final session = SessionController(api);
      var notified = false;
      session.addListener(() => notified = true);

      await session.loginWithGoogle('id-token-google');

      expect(session.isAuthenticated, isTrue);
      expect(session.user, _user);
      expect(notified, isTrue);
    },
  );

  test('logout efface l\'utilisateur et repasse en anonymous', () async {
    final api = FakeApiClient();
    api.onMe = () async => _user;
    api.onLogout = () async {};
    final session = SessionController(api);
    await session.refresh();

    await session.logout();

    expect(session.user, isNull);
    expect(session.status, SessionStatus.anonymous);
  });

  test('updateUser reflète le profil sans aller-retour réseau', () async {
    final api = FakeApiClient()..onMe = () async => _user;
    final session = SessionController(api);
    await session.refresh();

    const updated = PublicUser(
      id: 'u1',
      pseudo: 'alice2',
      email: 'alice@example.com',
      avatarUrl: null,
      bannerUrl: null,
      bio: 'Nouvelle bio',
      favoriteArtist: null,
    );
    session.updateUser(updated);

    expect(session.user!.pseudo, 'alice2');
    expect(session.user!.bio, 'Nouvelle bio');
  });
}
