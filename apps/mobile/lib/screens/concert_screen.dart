import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/session.dart';
import '../core/theme.dart';
import '../models/concert.dart';
import '../models/report_reason.dart';
import '../widgets/attendance_button.dart';
import '../widgets/avatar.dart';
import '../widgets/report_button.dart';
import '../widgets/star_rating.dart';

/// Page concert enrichie (US-2.1 à 2.4, US-5.1), miroir de
/// `apps/web/src/routes/concerts/[id]/+page.svelte` : onglets Setlist /
/// Médias / Notes via un vrai `TabBar` (navigable au clavier/lecteur d'écran
/// nativement par Flutter, comme `role=tablist` côté web).
class ConcertScreen extends StatefulWidget {
  final String concertId;

  const ConcertScreen({super.key, required this.concertId});

  @override
  State<ConcertScreen> createState() => _ConcertScreenState();
}

class _ConcertScreenState extends State<ConcertScreen> {
  late Future<(ConcertPage, bool)> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<(ConcertPage, bool)> _load() async {
    final api = context.read<ApiClient>();
    final page = await api.getConcert(widget.concertId);
    final attending = await api.getAttendance(widget.concertId);
    return (page, attending);
  }

  void _reload() {
    setState(() {
      _future = _load();
    });
  }

  @override
  Widget build(BuildContext context) {
    // `DefaultTabController` vit au-dessus du `FutureBuilder` pour survivre
    // aux rechargements déclenchés par `_reload` (note, commentaire, photo) :
    // sinon chaque mutation faisait retomber l'utilisateur sur l'onglet Setlist.
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        body: FutureBuilder<(ConcertPage, bool)>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              final message = snapshot.error is ApiException
                  ? (snapshot.error as ApiException).message
                  : 'Une erreur est survenue.';
              return Scaffold(
                appBar: AppBar(),
                body: Center(child: Text(message)),
              );
            }
            final (page, attending) = snapshot.data!;
            return _ConcertContent(
              page: page,
              attending: attending,
              onChanged: _reload,
            );
          },
        ),
      ),
    );
  }
}

class _ConcertContent extends StatelessWidget {
  final ConcertPage page;
  final bool attending;
  final VoidCallback onChanged;

  const _ConcertContent({
    required this.page,
    required this.attending,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    final concert = page.concert;
    final formattedDate = DateFormat('d MMMM yyyy', 'fr_FR').format(concert.date);

    return NestedScrollView(
      headerSliverBuilder: (context, innerBoxIsScrolled) => [
        SliverAppBar(
          pinned: true,
          floating: true,
          title: Text(concert.artistName),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Setlist'),
              Tab(text: 'Médias'),
              Tab(text: 'Notes'),
            ],
          ),
        ),
      ],
      body: Column(
        children: [
          if (page.artistImageUrl != null)
            _ArtistBanner(imageUrl: page.artistImageUrl!),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    '${concert.venueName}, ${concert.city} — $formattedDate',
                    style: TextStyle(color: context.colors.inkSoft),
                  ),
                ),
                const SizedBox(width: 12),
                AttendanceButton(
                  api: api,
                  concertId: concert.id,
                  initialAttending: attending,
                ),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _SetlistTab(setlist: page.setlist),
                _MediaTab(
                  concertId: concert.id,
                  photos: page.photos,
                  onChanged: onChanged,
                ),
                _NotesTab(
                  concertId: concert.id,
                  rating: page.rating,
                  comments: page.comments,
                  onChanged: onChanged,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Miroir du hero de `ConcertHero.svelte` : la photo de l'artiste en bandeau
/// plein cadre, fondue vers le bas dans le fond de page — le texte en dessous
/// reste sur fond uni, contraste préservé dans les deux thèmes.
class _ArtistBanner extends StatelessWidget {
  final String imageUrl;

  const _ArtistBanner({required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 150,
      width: double.infinity,
      child: ShaderMask(
        shaderCallback: (rect) => const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.black, Colors.transparent],
        ).createShader(rect),
        blendMode: BlendMode.dstIn,
        child: Opacity(
          opacity: 0.55,
          child: Image.network(
            imageUrl,
            fit: BoxFit.cover,
            alignment: const Alignment(0, -0.5),
            // Sans photo chargeable, pas de bandeau : l'écran garde sa mise
            // en page texte, comme le hero web sans photo.
            errorBuilder: (context, _, _) => const SizedBox.shrink(),
          ),
        ),
      ),
    );
  }
}

class _SetlistTab extends StatelessWidget {
  final SetlistFmResult? setlist;

  const _SetlistTab({required this.setlist});

  @override
  Widget build(BuildContext context) {
    if (setlist == null) {
      return const _EmptyMessage('Setlist indisponible pour ce concert.');
    }
    if (setlist!.songs.isEmpty) {
      return const _EmptyMessage('Aucun titre renseigné pour cette setlist.');
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: setlist!.songs.length,
      separatorBuilder: (_, _) => Divider(color: context.colors.line, height: 1),
      itemBuilder: (context, index) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Text('${index + 1}. ${setlist!.songs[index]}'),
      ),
    );
  }
}

class _MediaTab extends StatefulWidget {
  final String concertId;
  final List<PhotoSummary> photos;
  final VoidCallback onChanged;

  const _MediaTab({required this.concertId, required this.photos, required this.onChanged});

  @override
  State<_MediaTab> createState() => _MediaTabState();
}

class _MediaTabState extends State<_MediaTab> {
  bool uploading = false;

  Future<void> _pickAndUpload() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 90);
    if (picked == null || !mounted) return;
    setState(() => uploading = true);
    try {
      await context.read<ApiClient>().uploadPhoto(widget.concertId, File(picked.path));
      widget.onChanged();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => uploading = false);
    }
  }

  Future<void> _delete(String id) async {
    try {
      await context.read<ApiClient>().deletePhoto(id);
      widget.onChanged();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final pseudo = context.watch<SessionController>().user?.pseudo;
    final api = context.read<ApiClient>();

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: widget.photos.length + 1,
      itemBuilder: (context, index) {
        if (index == widget.photos.length) {
          return _UploadTile(uploading: uploading, onTap: _pickAndUpload);
        }
        final photo = widget.photos[index];
        return _PhotoTile(
          photo: photo,
          canDelete: photo.pseudo == pseudo,
          onDelete: () => _delete(photo.id),
          onReport: (reason) => api.reportPhoto(photo.id, reason),
        );
      },
    );
  }
}

class _PhotoTile extends StatelessWidget {
  final PhotoSummary photo;
  final bool canDelete;
  final VoidCallback onDelete;
  final Future<void> Function(ReportReason) onReport;

  const _PhotoTile({
    required this.photo,
    required this.canDelete,
    required this.onDelete,
    required this.onReport,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(ReverbRadius.md),
            child: Image.network(
              photo.url,
              fit: BoxFit.cover,
              semanticLabel: 'Photo du concert ajoutée par ${photo.pseudo}',
            ),
          ),
        ),
        Row(
          children: [
            Expanded(
              child: Text(
                photo.pseudo,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
              ),
            ),
            ReportButton(onReport: onReport),
            if (canDelete)
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18),
                onPressed: onDelete,
                tooltip: 'Supprimer',
              ),
          ],
        ),
      ],
    );
  }
}

class _UploadTile extends StatelessWidget {
  final bool uploading;
  final VoidCallback onTap;

  const _UploadTile({required this.uploading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: uploading ? null : onTap,
      borderRadius: BorderRadius.circular(ReverbRadius.md),
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border.all(color: context.colors.line, style: BorderStyle.solid),
          borderRadius: BorderRadius.circular(ReverbRadius.md),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.add, color: context.colors.inkSoft),
              const SizedBox(height: 4),
              Text(
                uploading ? 'Envoi…' : 'Ajouter une photo',
                style: TextStyle(color: context.colors.inkSoft, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotesTab extends StatefulWidget {
  final String concertId;
  final ConcertRatingSummary rating;
  final List<CommentSummary> comments;
  final VoidCallback onChanged;

  const _NotesTab({
    required this.concertId,
    required this.rating,
    required this.comments,
    required this.onChanged,
  });

  @override
  State<_NotesTab> createState() => _NotesTabState();
}

class _NotesTabState extends State<_NotesTab> {
  final _controller = TextEditingController();
  bool submitting = false;
  String? error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submitComment() async {
    final content = _controller.text.trim();
    if (content.isEmpty) return;
    setState(() {
      submitting = true;
      error = null;
    });
    try {
      await context.read<ApiClient>().addComment(widget.concertId, content);
      _controller.clear();
      widget.onChanged();
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  Future<void> _deleteComment(String id) async {
    try {
      await context.read<ApiClient>().deleteComment(id);
      widget.onChanged();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    final pseudo = context.watch<SessionController>().user?.pseudo;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        StarRating(
          api: api,
          concertId: widget.concertId,
          summary: widget.rating,
          onRated: widget.onChanged,
        ),
        const SizedBox(height: 24),
        TextField(
          controller: _controller,
          decoration: const InputDecoration(
            labelText: 'Ajouter un commentaire',
            hintText: 'Partagez votre souvenir de ce concert…',
          ),
          maxLines: 3,
        ),
        if (error != null) ...[
          const SizedBox(height: 8),
          Text(error!, style: TextStyle(color: context.colors.accentDeep, fontSize: 13)),
        ],
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerRight,
          child: ElevatedButton(
            onPressed: submitting ? null : _submitComment,
            child: const Text('Publier'),
          ),
        ),
        const SizedBox(height: 24),
        if (widget.comments.isEmpty)
          Text('Aucun commentaire pour l\'instant.', style: TextStyle(color: context.colors.inkSoft))
        else
          ...widget.comments.map(
            (comment) => _CommentTile(
              comment: comment,
              canDelete: comment.pseudo == pseudo,
              onDelete: () => _deleteComment(comment.id),
              onReport: (reason) => api.reportComment(comment.id, reason),
            ),
          ),
      ],
    );
  }
}

class _CommentTile extends StatelessWidget {
  final CommentSummary comment;
  final bool canDelete;
  final VoidCallback onDelete;
  final Future<void> Function(ReportReason) onReport;

  const _CommentTile({
    required this.comment,
    required this.canDelete,
    required this.onDelete,
    required this.onReport,
  });

  @override
  Widget build(BuildContext context) {
    final formattedDate = DateFormat('d MMM yyyy', 'fr_FR').format(comment.createdAt);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: context.colors.line)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ReverbAvatar(src: null, name: comment.pseudo, size: 32),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(text: comment.pseudo, style: TextStyle(fontWeight: FontWeight.w700, color: context.colors.ink)),
                      TextSpan(text: ' · $formattedDate', style: TextStyle(color: context.colors.inkSoft)),
                    ],
                  ),
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(comment.content),
                const SizedBox(height: 4),
                Row(
                  children: [
                    ReportButton(onReport: onReport),
                    if (canDelete)
                      IconButton(
                        onPressed: onDelete,
                        icon: const Icon(Icons.delete_outline, size: 18),
                        tooltip: 'Supprimer',
                        color: context.colors.inkSoft,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyMessage extends StatelessWidget {
  final String message;

  const _EmptyMessage(this.message);

  @override
  Widget build(BuildContext context) {
    return Center(child: Text(message, style: TextStyle(color: context.colors.inkSoft)));
  }
}
