import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/concert.dart';
import '../widgets/concert_card.dart';
import '../widgets/theme_toggle_button.dart';
import 'concert_screen.dart';

/// Miroir de `apps/web/src/routes/recherche/+page.svelte` : contrairement à
/// l'accueil, une requête vide n'affiche rien (pas de fil de concerts
/// récents) — ça n'a de sens que comme résultat d'une recherche explicite.
class RechercheScreen extends StatefulWidget {
  const RechercheScreen({super.key});

  @override
  State<RechercheScreen> createState() => _RechercheScreenState();
}

class _RechercheScreenState extends State<RechercheScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;
  Future<List<Concert>>? _future;

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      setState(() {
        _future = value.trim().isEmpty
            ? null
            : context.read<ApiClient>().searchConcerts(value);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recherche'),
        actions: const [ThemeToggleButton()],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
            child: TextField(
              controller: _controller,
              onChanged: _onChanged,
              style: const TextStyle(fontSize: 18),
              decoration: const InputDecoration(
                hintText: 'Artiste ou salle…',
                prefixIcon: Icon(Icons.search),
                contentPadding: EdgeInsets.symmetric(vertical: 18, horizontal: 16),
              ),
            ),
          ),
          Expanded(
            child: _future == null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'Recherchez un artiste ou une salle pour commencer.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: context.colors.inkSoft),
                      ),
                    ),
                  )
                : FutureBuilder<List<Concert>>(
                    future: _future,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      if (snapshot.hasError) {
                        final message = snapshot.error is ApiException
                            ? (snapshot.error as ApiException).message
                            : 'Une erreur est survenue.';
                        return Center(
                          child: Text(message, style: TextStyle(color: context.colors.accentDeep)),
                        );
                      }
                      final concerts = snapshot.data ?? [];
                      if (concerts.isEmpty) {
                        return Center(
                          child: Text(
                            'Aucun concert ne correspond à cette recherche.',
                            style: TextStyle(color: context.colors.inkSoft),
                          ),
                        );
                      }
                      return ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: concerts.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final concert = concerts[index];
                          return ConcertCard(
                            concert: concert,
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => ConcertScreen(concertId: concert.id)),
                            ),
                          );
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
