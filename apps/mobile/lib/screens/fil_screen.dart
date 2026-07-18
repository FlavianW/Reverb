import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/session.dart';
import '../core/theme.dart';
import '../models/concert.dart';
import '../models/post.dart';
import '../widgets/post_card.dart';
import '../widgets/theme_toggle_button.dart';

/// Miroir de `apps/web/src/routes/fil/+page.svelte`.
class FilScreen extends StatefulWidget {
  const FilScreen({super.key});

  @override
  State<FilScreen> createState() => _FilScreenState();
}

class _FilScreenState extends State<FilScreen> {
  late Future<PostPage> _future;
  List<PostSummary> _items = [];
  String? _cursor;
  bool _loadingMore = false;

  final _contentController = TextEditingController();
  final _concertQueryController = TextEditingController();
  List<Concert> _concertResults = [];
  Concert? _selectedConcert;
  List<XFile> _photos = [];
  bool _submitting = false;
  String? _composeError;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _contentController.dispose();
    _concertQueryController.dispose();
    super.dispose();
  }

  Future<PostPage> _load() async {
    final page = await context.read<ApiClient>().getFeed();
    _items = page.items;
    _cursor = page.nextCursor;
    return page;
  }

  Future<void> _loadMore() async {
    final cursor = _cursor;
    if (cursor == null) return;
    setState(() => _loadingMore = true);
    try {
      final page = await context.read<ApiClient>().getFeed(cursor);
      if (!mounted) return;
      setState(() {
        _items = [..._items, ...page.items];
        _cursor = page.nextCursor;
      });
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _deletePost(String id) async {
    await context.read<ApiClient>().deletePost(id);
    if (!mounted) return;
    setState(() => _items = _items.where((post) => post.id != id).toList());
  }

  Future<void> _searchConcerts(String query) async {
    if (query.trim().isEmpty) {
      setState(() => _concertResults = []);
      return;
    }
    final results = await context.read<ApiClient>().searchConcerts(
      query.trim(),
    );
    if (!mounted) return;
    setState(() => _concertResults = results);
  }

  Future<void> _pickPhotos() async {
    final picked = await ImagePicker().pickMultiImage(
      imageQuality: 90,
      limit: 4,
    );
    setState(() => _photos = picked);
  }

  Future<void> _submit() async {
    final content = _contentController.text.trim();
    if (content.isEmpty && _photos.isEmpty) {
      setState(
        () => _composeError = 'Ajoutez du texte ou au moins une photo.',
      );
      return;
    }

    setState(() {
      _submitting = true;
      _composeError = null;
    });
    try {
      final post = await context.read<ApiClient>().createPost(
        content: content.isEmpty ? null : content,
        concertId: _selectedConcert?.id,
        photos: _photos.map((file) => File(file.path)).toList(),
      );
      if (!mounted) return;
      setState(() {
        _items = [post, ..._items];
        _contentController.clear();
        _photos = [];
        _selectedConcert = null;
      });
    } on ApiException catch (e) {
      setState(() => _composeError = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    final pseudo = context.watch<SessionController>().user?.pseudo;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Fil d'actualité"),
        actions: const [ThemeToggleButton()],
      ),
      body: FutureBuilder<PostPage>(
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

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _composeForm(),
              const SizedBox(height: 24),
              if (_items.isEmpty)
                Text(
                  "Aucun post pour l'instant.",
                  style: TextStyle(color: context.colors.inkSoft),
                )
              else
                ..._items.map(
                  (post) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: PostCard(
                      api: api,
                      post: post,
                      canDelete:
                          post.type == PostType.photo &&
                          post.author.pseudo == pseudo,
                      onDelete: () => _deletePost(post.id),
                    ),
                  ),
                ),
              if (_cursor != null)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: OutlinedButton(
                      onPressed: _loadingMore ? null : _loadMore,
                      child: Text(
                        _loadingMore ? 'Chargement…' : 'Charger plus',
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _composeForm() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: context.colors.line),
        borderRadius: BorderRadius.circular(ReverbRadius.md),
        color: context.colors.paperAlt,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _contentController,
            decoration: const InputDecoration(hintText: 'Quoi de neuf ?'),
            maxLines: 3,
          ),
          const SizedBox(height: 12),
          if (_selectedConcert != null)
            Row(
              children: [
                Expanded(
                  child: Text(
                    'À propos de ${_selectedConcert!.artistName}',
                    style: TextStyle(
                      color: context.colors.inkSoft,
                      fontSize: 13,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => setState(() => _selectedConcert = null),
                  icon: const Icon(Icons.close, size: 18),
                  tooltip: 'Retirer',
                ),
              ],
            )
          else ...[
            TextField(
              controller: _concertQueryController,
              decoration: const InputDecoration(
                hintText: 'Associer un concert (facultatif)…',
              ),
              onChanged: _searchConcerts,
            ),
            ..._concertResults.map(
              (concert) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                title: Text(
                  '${concert.artistName} — ${concert.venueName}, ${concert.city}',
                ),
                onTap: () => setState(() {
                  _selectedConcert = concert;
                  _concertResults = [];
                  _concertQueryController.clear();
                }),
              ),
            ),
          ],
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pickPhotos,
            icon: const Icon(Icons.add_photo_alternate_outlined),
            label: Text(
              _photos.isEmpty
                  ? 'Ajouter des photos'
                  : '${_photos.length} photo${_photos.length > 1 ? 's' : ''} sélectionnée${_photos.length > 1 ? 's' : ''}',
            ),
          ),
          if (_composeError != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                _composeError!,
                style: TextStyle(
                  color: context.colors.accentDeep,
                  fontSize: 13,
                ),
              ),
            ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: const Text('Publier'),
            ),
          ),
        ],
      ),
    );
  }
}
