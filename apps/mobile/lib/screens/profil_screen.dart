import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/image_crop.dart';
import '../core/session.dart';
import '../core/theme.dart';
import '../models/friendship.dart';
import '../models/post.dart';
import '../models/public_profile.dart';
import '../widgets/artist_autocomplete_field.dart';
import '../widgets/avatar.dart';
import '../widgets/concert_card.dart';
import '../widgets/friend_button.dart';
import '../widgets/post_card.dart';
import '../widgets/theme_toggle_button.dart';
import 'concert_screen.dart';

/// Miroir de `apps/web/src/routes/profil/[pseudo]/+page.svelte` : édition
/// visible seulement si `session.user.pseudo == pseudo` (le propriétaire du
/// profil), pas d'onglets Médias/À propos (voir CLAUDE.md — hors périmètre,
/// pas de champ correspondant côté API).
class ProfilScreen extends StatefulWidget {
  final String pseudo;

  const ProfilScreen({super.key, required this.pseudo});

  @override
  State<ProfilScreen> createState() => _ProfilScreenState();
}

class _ProfilScreenState extends State<ProfilScreen> {
  late Future<(PublicProfile, FriendshipStatusWithUser?)> _future;
  List<PostSummary> _postItems = [];
  String? _postCursor;
  bool _loadingMorePosts = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void didUpdateWidget(covariant ProfilScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Le pseudo peut changer après une édition de profil (voir _EditProfileDialog) :
    // `RootShell` reconstruit alors cet écran avec le nouveau pseudo, il faut
    // recharger sous peine de continuer à interroger l'ancien (404).
    if (oldWidget.pseudo != widget.pseudo) {
      _reload();
    }
  }

  Future<(PublicProfile, FriendshipStatusWithUser?)> _load() async {
    final api = context.read<ApiClient>();
    final isOwnProfile =
        context.read<SessionController>().user?.pseudo == widget.pseudo;
    final profile = await api.getProfile(widget.pseudo);
    final friendshipStatus = isOwnProfile
        ? null
        : await api.getFriendshipStatus(widget.pseudo);
    final posts = await api.getUserPosts(widget.pseudo);
    _postItems = posts.items;
    _postCursor = posts.nextCursor;
    return (profile, friendshipStatus);
  }

  void _reload() {
    setState(() {
      _future = _load();
    });
  }

  Future<void> _loadMorePosts() async {
    final cursor = _postCursor;
    if (cursor == null) return;
    setState(() => _loadingMorePosts = true);
    try {
      final page = await context.read<ApiClient>().getUserPosts(
        widget.pseudo,
        cursor,
      );
      if (!mounted) return;
      setState(() {
        _postItems = [..._postItems, ...page.items];
        _postCursor = page.nextCursor;
      });
    } finally {
      if (mounted) setState(() => _loadingMorePosts = false);
    }
  }

  Future<void> _deletePost(String id) async {
    await context.read<ApiClient>().deletePost(id);
    if (!mounted) return;
    setState(
      () => _postItems = _postItems.where((post) => post.id != id).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        actions: const [ThemeToggleButton()],
      ),
      body: FutureBuilder<(PublicProfile, FriendshipStatusWithUser?)>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            final message = snapshot.error is ApiException
                ? (snapshot.error as ApiException).message
                : 'Une erreur est survenue.';
            return Center(child: Text(message));
          }
          final (profile, friendshipStatus) = snapshot.data!;
          final editable = session.user?.pseudo == profile.pseudo;

          return ListView(
            children: [
              Container(
                height: 160,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [context.colors.accentDeep, context.colors.accent],
                  ),
                  image: profile.bannerUrl != null
                      ? DecorationImage(
                          image: NetworkImage(profile.bannerUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: Transform.translate(
                  offset: const Offset(0, -36),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: context.colors.paper,
                          boxShadow: const [
                            BoxShadow(color: Colors.black26, blurRadius: 8),
                          ],
                        ),
                        child: ReverbAvatar(
                          src: profile.avatarUrl,
                          name: profile.pseudo,
                          size: 96,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                profile.pseudo,
                                style: Theme.of(
                                  context,
                                ).textTheme.titleLarge?.copyWith(fontSize: 22),
                              ),
                              if (profile.bio != null && profile.bio!.isNotEmpty)
                                Text(
                                  profile.bio!,
                                  style: TextStyle(color: context.colors.inkSoft),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (editable)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: () => _openEditDialog(context, profile),
                        icon: const Icon(Icons.edit_outlined, size: 18),
                        label: const Text('Modifier le profil'),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () =>
                            context.read<SessionController>().logout(),
                        icon: const Icon(Icons.logout),
                        tooltip: 'Se déconnecter',
                      ),
                    ],
                  ),
                )
              else if (friendshipStatus != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: FriendButton(
                    api: context.read<ApiClient>(),
                    pseudo: profile.pseudo,
                    initialStatus: friendshipStatus.status,
                    initialFriendshipId: friendshipStatus.friendshipId,
                  ),
                ),
              if (profile.favoriteArtist != null) ...[
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _FavoriteArtistCard(
                    name: profile.favoriteArtist!,
                    imageUrl: profile.favoriteArtistImageUrl,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Concerts assistés',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(height: 8),
              if (profile.attendedConcerts.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Aucun concert assisté pour l\'instant.',
                    style: TextStyle(color: context.colors.inkSoft),
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: profile.attendedConcerts
                        .map(
                          (concert) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: ConcertCard(
                              concert: concert,
                              onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      ConcertScreen(concertId: concert.id),
                                ),
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              const SizedBox(height: 24),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Text('Posts', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _postItems.isEmpty
                    ? Text(
                        "Aucun post pour l'instant.",
                        style: TextStyle(color: context.colors.inkSoft),
                      )
                    : Column(
                        children: [
                          ..._postItems.map(
                            (post) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: PostCard(
                                api: context.read<ApiClient>(),
                                post: post,
                                canDelete:
                                    post.type == PostType.photo &&
                                    post.author.pseudo == session.user?.pseudo,
                                onDelete: () => _deletePost(post.id),
                              ),
                            ),
                          ),
                          if (_postCursor != null)
                            Center(
                              child: OutlinedButton(
                                onPressed: _loadingMorePosts ? null : _loadMorePosts,
                                child: Text(
                                  _loadingMorePosts ? 'Chargement…' : 'Charger plus',
                                ),
                              ),
                            ),
                        ],
                      ),
              ),
              const SizedBox(height: 16),
            ],
          );
        },
      ),
    );
  }

  Future<void> _openEditDialog(BuildContext context, PublicProfile profile) async {
    await showDialog<void>(
      context: context,
      builder: (context) => _EditProfileDialog(profile: profile, onSaved: _reload),
    );
  }
}

/// Bandeau proéminent, miroir du bloc "artiste favori" de `ProfileHeader.svelte`.
class _FavoriteArtistCard extends StatelessWidget {
  final String name;
  final String? imageUrl;

  const _FavoriteArtistCard({required this.name, required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: context.colors.line),
        borderRadius: BorderRadius.circular(ReverbRadius.lg),
        color: context.colors.paperAlt,
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: context.colors.accentSoft,
            backgroundImage: imageUrl != null ? NetworkImage(imageUrl!) : null,
            child: imageUrl == null
                ? Text(
                    name.isEmpty ? '?' : name.substring(0, 1).toUpperCase(),
                    style: TextStyle(
                      color: context.colors.accentDeep,
                      fontWeight: FontWeight.w700,
                      fontSize: 22,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ARTISTE FAVORI',
                  style: TextStyle(
                    color: context.colors.inkSoft,
                    fontSize: 11,
                    letterSpacing: 0.6,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  name,
                  style: TextStyle(
                    color: context.colors.ink,
                    fontSize: 19,
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EditProfileDialog extends StatefulWidget {
  final PublicProfile profile;
  final VoidCallback onSaved;

  const _EditProfileDialog({required this.profile, required this.onSaved});

  @override
  State<_EditProfileDialog> createState() => _EditProfileDialogState();
}

class _EditProfileDialogState extends State<_EditProfileDialog> {
  late final _pseudoController = TextEditingController(text: widget.profile.pseudo);
  late final _bioController = TextEditingController(text: widget.profile.bio ?? '');
  late String _favoriteArtist = widget.profile.favoriteArtist ?? '';
  File? _avatarFile;
  File? _bannerFile;
  bool submitting = false;
  String? error;

  @override
  void dispose() {
    _pseudoController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 90);
    if (picked == null || !mounted) return;
    final cropped = await cropImage(
      context,
      sourcePath: picked.path,
      aspectRatioX: 1,
      aspectRatioY: 1,
    );
    if (cropped == null || !mounted) return;
    setState(() => _avatarFile = cropped);
  }

  Future<void> _pickBanner() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 90);
    if (picked == null || !mounted) return;
    final cropped = await cropImage(
      context,
      sourcePath: picked.path,
      aspectRatioX: 3,
      aspectRatioY: 1,
    );
    if (cropped == null || !mounted) return;
    setState(() => _bannerFile = cropped);
  }

  Future<void> _submit() async {
    setState(() {
      submitting = true;
      error = null;
    });
    final api = context.read<ApiClient>();
    final session = context.read<SessionController>();
    try {
      if (_avatarFile != null) {
        await api.uploadAvatar(_avatarFile!);
      }
      if (_bannerFile != null) {
        await api.uploadBanner(_bannerFile!);
      }
      final updated = await api.updateProfile(
        pseudo: _pseudoController.text,
        bio: _bioController.text,
        favoriteArtist: _favoriteArtist,
      );
      session.updateUser(updated);
      if (!mounted) return;
      Navigator.of(context).pop();
      widget.onSaved();
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Modifier le profil'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GestureDetector(
              onTap: _pickBanner,
              child: Container(
                height: 80,
                decoration: BoxDecoration(
                  color: context.colors.accentSoft,
                  borderRadius: BorderRadius.circular(ReverbRadius.sm),
                  image: _bannerFile != null
                      ? DecorationImage(image: FileImage(_bannerFile!), fit: BoxFit.cover)
                      : (widget.profile.bannerUrl != null
                            ? DecorationImage(
                                image: NetworkImage(widget.profile.bannerUrl!),
                                fit: BoxFit.cover,
                              )
                            : null),
                ),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: context.colors.paperAlt,
                      borderRadius: BorderRadius.circular(ReverbRadius.sm),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.camera_alt_outlined, size: 14, color: context.colors.accentDeep),
                        const SizedBox(width: 6),
                        Text(
                          'Changer la bannière',
                          style: TextStyle(
                            color: context.colors.accentDeep,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _avatarFile != null
                    ? CircleAvatar(radius: 32, backgroundImage: FileImage(_avatarFile!))
                    : ReverbAvatar(
                        src: widget.profile.avatarUrl,
                        name: _pseudoController.text,
                        size: 64,
                      ),
                const SizedBox(width: 12),
                TextButton.icon(
                  onPressed: _pickAvatar,
                  icon: const Icon(Icons.camera_alt_outlined, size: 16),
                  label: const Text('Changer la photo'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _pseudoController,
              decoration: const InputDecoration(labelText: 'Pseudo'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _bioController,
              decoration: const InputDecoration(labelText: 'Bio'),
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            ArtistAutocompleteField(
              label: 'Artiste favori',
              initialValue: _favoriteArtist,
              onChanged: (value) => _favoriteArtist = value,
            ),
            if (error != null) ...[
              const SizedBox(height: 8),
              Text(error!, style: TextStyle(color: context.colors.accentDeep, fontSize: 13)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Annuler'),
        ),
        ElevatedButton(
          onPressed: submitting ? null : _submit,
          child: const Text('Enregistrer'),
        ),
      ],
    );
  }
}
