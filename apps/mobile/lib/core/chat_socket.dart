import 'package:socket_io_client/socket_io_client.dart' as socket_io;

import 'api_client.dart';

/// Miroir de `apps/web/src/lib/realtime/socket.ts` : connexion Socket.IO au
/// namespace `/chat`, authentifiée par le même cookie de session httpOnly
/// que les requêtes REST. Contrairement au navigateur (`withCredentials`),
/// `socket_io_client` ne partage pas le pot de cookies de Dio : le cookie
/// est donc relu depuis [ApiClient] et posé explicitement sur la poignée de
/// main. À n'appeler que depuis `initState` (jamais au niveau module), et à
/// fermer avec `socket.dispose()` dans `dispose()`.
Future<socket_io.Socket> createChatSocket(ApiClient api) async {
  final cookie = await api.sessionCookieHeader();
  final socket = socket_io.io(
    '${api.baseUrl}/chat',
    socket_io.OptionBuilder()
        .setTransports(['websocket'])
        .setExtraHeaders({'Cookie': cookie})
        .disableAutoConnect()
        .build(),
  );
  socket.connect();
  return socket;
}
