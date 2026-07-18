import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/session.dart';
import '../core/theme.dart';
import '../models/public_profile.dart';
import '../widgets/avatar.dart';
import '../widgets/concert_card.dart';
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
  late Future<PublicProfile> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<ApiClient>().getProfile(widget.pseudo);
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

  void _reload() {
    setState(() {
      _future = context.read<ApiClient>().getProfile(widget.pseudo);
    });
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();

    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: FutureBuilder<PublicProfile>(
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
          final profile = snapshot.data!;
          final editable = session.user?.pseudo == profile.pseudo;

          return ListView(
            children: [
              Container(
                height: 100,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [ReverbColors.accentDeep, ReverbColors.accent],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: Transform.translate(
                  offset: const Offset(0, -36),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      ReverbAvatar(src: profile.avatarUrl, name: profile.pseudo, size: 88),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(profile.pseudo, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 22)),
                              if (profile.bio != null && profile.bio!.isNotEmpty)
                                Text(profile.bio!, style: const TextStyle(color: ReverbColors.inkSoft)),
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
                      OutlinedButton(
                        onPressed: () => _openEditDialog(context, profile),
                        child: const Text('Modifier le profil'),
                      ),
                      const SizedBox(width: 12),
                      TextButton(
                        onPressed: () => context.read<SessionController>().logout(),
                        child: const Text('Se déconnecter'),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 16),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Text('Concerts assistés', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
              const SizedBox(height: 8),
              if (profile.attendedConcerts.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Aucun concert assisté pour l\'instant.', style: TextStyle(color: ReverbColors.inkSoft)),
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
                                MaterialPageRoute(builder: (_) => ConcertScreen(concertId: concert.id)),
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
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
  File? _avatarFile;
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
    if (picked == null) return;
    setState(() => _avatarFile = File(picked.path));
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
      final updated = await api.updateProfile(
        pseudo: _pseudoController.text,
        bio: _bioController.text,
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
                TextButton(onPressed: _pickAvatar, child: const Text('Changer la photo')),
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
            if (error != null) ...[
              const SizedBox(height: 8),
              Text(error!, style: const TextStyle(color: ReverbColors.accentDeep, fontSize: 13)),
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
