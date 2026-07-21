import 'dart:io';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

import '../models/artist.dart';
import '../models/chat.dart';
import '../models/concert.dart';
import '../models/friendship.dart';
import '../models/post.dart';
import '../models/public_profile.dart';
import '../models/public_user.dart';
import '../models/report_reason.dart';

/// Miroir de `ApiError` dans `apps/web/src/lib/api/client.ts`.
class ApiException implements Exception {
  final int status;
  final String message;

  const ApiException(this.status, this.message);

  @override
  String toString() => message;
}

/// URL de l'API en production (ALB → ECS Fargate).
const _prodApiUrl = 'https://api.reverb-social.com';

/// Adresse de l'API selon la plateforme d'exécution. Un build release (ex.
/// l'APK publié sur les releases GitHub, voir `mobile-release.yml`) pointe
/// toujours vers la prod : sans ça, il ne joindrait que l'API locale du
/// poste qui l'a compilé, injoignable pour quiconque d'autre. En debug,
/// l'émulateur Android route `localhost` vers lui-même : `10.0.2.2` est
/// l'alias documenté par Google pour atteindre la machine hôte. Le
/// simulateur iOS et le web partagent le réseau de l'hôte, donc `localhost`
/// y fonctionne directement. Sur un appareil physique en debug, remplacer
/// par l'IP LAN de la machine de dev.
String _resolveBaseUrl() {
  if (kReleaseMode) {
    return _prodApiUrl;
  }
  if (kIsWeb) {
    return 'http://localhost:3000';
  }
  if (Platform.isAndroid) {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}

/// Client HTTP de l'app mobile, calqué sur `apps/web/src/lib/api/client.ts`.
/// L'API n'authentifie que par cookie de session httpOnly (pas de Bearer
/// token) : `dio_cookie_manager` + un `PersistCookieJar` sur disque rejouent
/// le rôle du pot de cookies d'un navigateur, y compris entre deux lancements
/// de l'app.
class ApiClient {
  late final Dio _dio;
  late final CookieJar _cookieJar;
  bool _ready = false;

  Future<void> ensureReady() async {
    if (_ready) return;
    final dir = await getApplicationDocumentsDirectory();
    _cookieJar = PersistCookieJar(storage: FileStorage('${dir.path}/.cookies/'));
    _dio = Dio(BaseOptions(baseUrl: _resolveBaseUrl()));
    _dio.interceptors.add(CookieManager(_cookieJar));
    _ready = true;
  }

  String get baseUrl => _resolveBaseUrl();

  /// Cookie de session pour l'en-tête `Cookie` de la connexion Socket.IO :
  /// contrairement à un navigateur (`withCredentials`), `socket_io_client` ne
  /// partage pas le pot de cookies de Dio — on le relit donc explicitement.
  Future<String> sessionCookieHeader() async {
    await ensureReady();
    final cookies = await _cookieJar.loadForRequest(Uri.parse(baseUrl));
    return cookies.map((c) => '${c.name}=${c.value}').join('; ');
  }

  Future<T> _request<T>(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Object? data,
    T Function(dynamic)? decode,
  }) async {
    await ensureReady();
    try {
      final response = await _dio.request<dynamic>(
        path,
        queryParameters: query,
        data: data,
        options: Options(method: method),
      );
      if (decode == null) {
        return response.data as T;
      }
      return decode(response.data);
    } on DioException catch (e) {
      final body = e.response?.data;
      final rawMessage = body is Map ? body['message'] : null;
      final message = rawMessage is List
          ? rawMessage.join(' ')
          : rawMessage?.toString() ?? (e.message ?? 'Une erreur est survenue.');
      throw ApiException(e.response?.statusCode ?? 0, message);
    }
  }

  // Authentification

  Future<PublicUser> register({
    required String email,
    required String password,
    required String pseudo,
  }) => _request(
    'POST',
    '/auth/register',
    data: {'email': email, 'password': password, 'pseudo': pseudo},
    decode: (d) => PublicUser.fromJson(d as Map<String, dynamic>),
  );

  Future<PublicUser> login({required String email, required String password}) =>
      _request(
        'POST',
        '/auth/login',
        data: {'email': email, 'password': password},
        decode: (d) => PublicUser.fromJson(d as Map<String, dynamic>),
      );

  Future<PublicUser?> me() async {
    try {
      return await _request<PublicUser>(
        'GET',
        '/auth/me',
        decode: (d) => PublicUser.fromJson(d as Map<String, dynamic>),
      );
    } on ApiException catch (e) {
      if (e.status == 401) return null;
      rethrow;
    }
  }

  Future<void> logout() => _request('POST', '/auth/logout');

  /// Échange un ID token Google (obtenu via `google_sign_in`) contre une
  /// session applicative (US-1.1) — pendant mobile de la redirection
  /// navigateur `GET /auth/google` utilisée côté web.
  Future<PublicUser> loginWithGoogleIdToken(String idToken) => _request(
    'POST',
    '/auth/google/mobile',
    data: {'idToken': idToken},
    decode: (d) => PublicUser.fromJson(d as Map<String, dynamic>),
  );

  // Concerts

  /// Sans requête, renvoie les concerts récents du catalogue (et déclenche
  /// côté API l'import découverte des derniers concerts joués en France).
  Future<List<ConcertSearchResult>> searchConcerts([String? q]) => _request(
    'GET',
    '/concerts/search',
    query: q != null && q.isNotEmpty ? {'q': q} : null,
    decode: (d) => (d as List<dynamic>)
        .map((e) => ConcertSearchResult.fromJson(e as Map<String, dynamic>))
        .toList(),
  );

  Future<List<NearbyConcert>> getNearbyConcerts(
    double lat,
    double lng, [
    int? radiusKm,
  ]) => _request(
    'GET',
    '/concerts/nearby',
    query: {'lat': lat, 'lng': lng, 'radiusKm': ?radiusKm},
    decode: (d) => (d as List<dynamic>)
        .map((e) => NearbyConcert.fromJson(e as Map<String, dynamic>))
        .toList(),
  );

  Future<ConcertPage> getConcert(String id) => _request(
    'GET',
    '/concerts/$id',
    decode: (d) => ConcertPage.fromJson(d as Map<String, dynamic>),
  );

  Future<bool> getAttendance(String id) => _request(
    'GET',
    '/concerts/$id/attendance',
    decode: (d) => (d as Map<String, dynamic>)['attending'] as bool,
  );

  Future<void> markAttendance(String id) =>
      _request('PUT', '/concerts/$id/attendance');

  Future<void> unmarkAttendance(String id) =>
      _request('DELETE', '/concerts/$id/attendance');

  Future<void> rateConcert(String id, int value) =>
      _request('PUT', '/concerts/$id/rating', data: {'value': value});

  // Commentaires

  Future<Comment> addComment(String concertId, String content) => _request(
    'POST',
    '/concerts/$concertId/comments',
    data: {'content': content},
    decode: (d) => Comment.fromJson(d as Map<String, dynamic>),
  );

  Future<void> deleteComment(String id) => _request('DELETE', '/comments/$id');

  Future<void> reportComment(String id, ReportReason reason) => _request(
    'POST',
    '/comments/$id/report',
    data: {'reason': reason.wireValue},
  );

  // Photos

  Future<PhotoSummary> uploadPhoto(String concertId, File file) async {
    final formData = FormData.fromMap({
      'photo': await MultipartFile.fromFile(file.path),
    });
    return _request(
      'POST',
      '/concerts/$concertId/photos',
      data: formData,
      decode: (d) => PhotoSummary.fromJson(d as Map<String, dynamic>),
    );
  }

  Future<void> deletePhoto(String id) => _request('DELETE', '/photos/$id');

  Future<void> reportPhoto(String id, ReportReason reason) => _request(
    'POST',
    '/photos/$id/report',
    data: {'reason': reason.wireValue},
  );

  // Profil

  Future<PublicProfile> getProfile(String pseudo) => _request(
    'GET',
    '/users/$pseudo',
    decode: (d) => PublicProfile.fromJson(d as Map<String, dynamic>),
  );

  Future<PublicUser> updateProfile({
    String? pseudo,
    String? bio,
    String? favoriteArtist,
  }) => _request(
    'PATCH',
    '/users/me',
    data: {
      'pseudo': ?pseudo,
      'bio': ?bio,
      'favoriteArtist': ?favoriteArtist,
    },
    decode: (d) => PublicUser.fromJson(d as Map<String, dynamic>),
  );

  Future<PublicUser> uploadAvatar(File file) async {
    final formData = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(file.path),
    });
    return _request(
      'POST',
      '/users/me/avatar',
      data: formData,
      decode: (d) => PublicUser.fromJson(d as Map<String, dynamic>),
    );
  }

  Future<PublicUser> uploadBanner(File file) async {
    final formData = FormData.fromMap({
      'banner': await MultipartFile.fromFile(file.path),
    });
    return _request(
      'POST',
      '/users/me/banner',
      data: formData,
      decode: (d) => PublicUser.fromJson(d as Map<String, dynamic>),
    );
  }

  // Artistes

  Future<List<ArtistSuggestion>> searchArtists(String q) => _request(
    'GET',
    '/artists/search',
    query: {'q': q},
    decode: (d) => (d as List<dynamic>)
        .map((e) => ArtistSuggestion.fromJson(e as Map<String, dynamic>))
        .toList(),
  );

  // Amis

  Future<FriendshipOverview> getFriendshipOverview() => _request(
    'GET',
    '/friendships/me',
    decode: (d) => FriendshipOverview.fromJson(d as Map<String, dynamic>),
  );

  Future<FriendshipStatusWithUser> getFriendshipStatus(String pseudo) =>
      _request(
        'GET',
        '/friendships/status/$pseudo',
        decode: (d) =>
            FriendshipStatusWithUser.fromJson(d as Map<String, dynamic>),
      );

  Future<FriendshipSummary> sendFriendRequest(String pseudo) => _request(
    'POST',
    '/friendships/requests/$pseudo',
    decode: (d) => FriendshipSummary.fromJson(d as Map<String, dynamic>),
  );

  Future<void> acceptFriendRequest(String id) =>
      _request('PUT', '/friendships/$id/accept');

  Future<void> removeFriendship(String id) =>
      _request('DELETE', '/friendships/$id');

  // Messagerie (US-10.1 à 10.3)

  /// Trouve ou crée la conversation avec cet ami (403 si vous n'êtes pas amis).
  Future<ConversationSummary> startConversation(String pseudo) => _request(
    'POST',
    '/conversations/$pseudo',
    decode: (d) => ConversationSummary.fromJson(d as Map<String, dynamic>),
  );

  Future<List<ConversationSummary>> getConversations() => _request(
    'GET',
    '/conversations',
    decode: (d) => (d as List<dynamic>)
        .map((e) => ConversationSummary.fromJson(e as Map<String, dynamic>))
        .toList(),
  );

  Future<int> getUnreadCount() => _request(
    'GET',
    '/conversations/unread-count',
    decode: (d) => (d as Map<String, dynamic>)['count'] as int,
  );

  Future<MessagePage> getMessages(String conversationId, [String? cursor]) =>
      _request(
        'GET',
        '/conversations/$conversationId/messages',
        query: cursor != null ? {'cursor': cursor} : null,
        decode: (d) => MessagePage.fromJson(d as Map<String, dynamic>),
      );

  Future<void> markConversationRead(String conversationId) =>
      _request('PUT', '/conversations/$conversationId/read');

  // Fil d'actualité

  Future<PostPage> getFeed([String? cursor]) => _request(
    'GET',
    '/posts/feed',
    query: cursor != null ? {'cursor': cursor} : null,
    decode: (d) => PostPage.fromJson(d as Map<String, dynamic>),
  );

  Future<PostPage> getUserPosts(String pseudo, [String? cursor]) => _request(
    'GET',
    '/users/$pseudo/posts',
    query: cursor != null ? {'cursor': cursor} : null,
    decode: (d) => PostPage.fromJson(d as Map<String, dynamic>),
  );

  /// Post explicite (US-8.2) : `content`/`concertId` facultatifs, mais l'un
  /// des deux ou une photo doit être fourni (validé côté API).
  Future<PostSummary> createPost({
    String? content,
    String? concertId,
    List<File> photos = const [],
  }) async {
    final formData = FormData.fromMap({
      'content': ?content,
      'concertId': ?concertId,
      if (photos.isNotEmpty)
        'photos': await Future.wait(
          photos.map((file) => MultipartFile.fromFile(file.path)),
        ),
    });
    return _request(
      'POST',
      '/posts',
      data: formData,
      decode: (d) => PostSummary.fromJson(d as Map<String, dynamic>),
    );
  }

  Future<void> deletePost(String id) => _request('DELETE', '/posts/$id');

  Future<void> likePost(String id) => _request('PUT', '/posts/$id/like');

  Future<void> unlikePost(String id) => _request('DELETE', '/posts/$id/like');

  /// Génère une URL d'upload vidéo direct vers S3 pour un futur post (US-8.2).
  /// L'id du post est décidé côté API avant sa création, pour que la clé S3
  /// puisse le référencer ; on le renvoie tel quel à `createVideoPost`.
  Future<PresignedVideoUpload> presignPostVideo(String contentType) =>
      _request(
        'POST',
        '/posts/videos/presign',
        data: {'contentType': contentType},
        decode: (d) =>
            PresignedVideoUpload.fromJson(d as Map<String, dynamic>),
      );

  /// Upload direct vers S3, hors de l'API (jamais de proxy en mémoire pour
  /// une vidéo, contrairement aux photos) : requête à part, sans cookie de
  /// session ni URL de base de l'API.
  Future<void> uploadVideoToStorage(
    PresignedVideoUpload presigned,
    File file,
  ) async {
    final formData = FormData.fromMap({
      ...presigned.fields,
      'file': await MultipartFile.fromFile(file.path),
    });
    try {
      await Dio().post<void>(presigned.uploadUrl, data: formData);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode ?? 0,
        "Échec de l'upload vidéo vers le stockage.",
      );
    }
  }

  /// Crée un post explicite dont le média est une vidéo déjà uploadée (US-8.2).
  Future<PostSummary> createVideoPost({
    required String postId,
    required String key,
    String? content,
    String? concertId,
  }) => _request(
    'POST',
    '/posts/videos',
    data: {
      'postId': postId,
      'key': key,
      'content': ?content,
      'concertId': ?concertId,
    },
    decode: (d) => PostSummary.fromJson(d as Map<String, dynamic>),
  );
}
