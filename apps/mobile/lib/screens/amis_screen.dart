import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/friendship.dart';
import '../widgets/friend_card.dart';

/// Miroir de `apps/web/src/routes/amis/+page.svelte`.
class AmisScreen extends StatefulWidget {
  const AmisScreen({super.key});

  @override
  State<AmisScreen> createState() => _AmisScreenState();
}

class _AmisScreenState extends State<AmisScreen> {
  late Future<FriendshipOverview> _future;
  final _pseudoController = TextEditingController();
  bool sending = false;
  String? error;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _pseudoController.dispose();
    super.dispose();
  }

  Future<FriendshipOverview> _load() =>
      context.read<ApiClient>().getFriendshipOverview();

  void _reload() {
    setState(() {
      _future = _load();
    });
  }

  Future<void> _sendRequest() async {
    final pseudo = _pseudoController.text.trim();
    if (pseudo.isEmpty) return;

    setState(() {
      sending = true;
      error = null;
    });
    try {
      await context.read<ApiClient>().sendFriendRequest(pseudo);
      _pseudoController.clear();
      _reload();
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  Future<void> _accept(String id) async {
    await context.read<ApiClient>().acceptFriendRequest(id);
    _reload();
  }

  Future<void> _remove(String id) async {
    await context.read<ApiClient>().removeFriendship(id);
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Amis')),
      body: FutureBuilder<FriendshipOverview>(
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
          final overview = snapshot.data!;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _pseudoController,
                      decoration: const InputDecoration(
                        hintText: 'Ajouter un ami par pseudo…',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: sending ? null : _sendRequest,
                    child: const Text('Envoyer'),
                  ),
                ],
              ),
              if (error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    error!,
                    style: const TextStyle(
                      color: ReverbColors.accentDeep,
                      fontSize: 13,
                    ),
                  ),
                ),
              if (overview.receivedRequests.isNotEmpty) ...[
                const SizedBox(height: 24),
                _SectionTitle('Demandes reçues'),
                const SizedBox(height: 8),
                ...overview.receivedRequests.map(
                  (friendship) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: FriendCard(
                      friendship: friendship,
                      kind: FriendCardKind.received,
                      onAccept: () => _accept(friendship.id),
                      onRemove: () => _remove(friendship.id),
                    ),
                  ),
                ),
              ],
              if (overview.sentRequests.isNotEmpty) ...[
                const SizedBox(height: 24),
                _SectionTitle('Demandes envoyées'),
                const SizedBox(height: 8),
                ...overview.sentRequests.map(
                  (friendship) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: FriendCard(
                      friendship: friendship,
                      kind: FriendCardKind.sent,
                      onRemove: () => _remove(friendship.id),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              _SectionTitle('Mes amis'),
              const SizedBox(height: 8),
              if (overview.friends.isEmpty)
                const Text(
                  "Aucun ami pour l'instant.",
                  style: TextStyle(color: ReverbColors.inkSoft),
                )
              else
                ...overview.friends.map(
                  (friendship) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: FriendCard(
                      friendship: friendship,
                      kind: FriendCardKind.friend,
                      onRemove: () => _remove(friendship.id),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String label;

  const _SectionTitle(this.label);

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17),
    );
  }
}
