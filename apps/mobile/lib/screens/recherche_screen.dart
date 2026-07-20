import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/concert.dart';
import '../widgets/concert_card.dart';
import '../widgets/theme_toggle_button.dart';
import 'concert_screen.dart';

/// Miroir de `apps/web/src/routes/recherche/+page.svelte` : le catalogue
/// récent s'affiche dès l'ouverture (une requête vide renvoie les derniers
/// concerts, enrichis par l'import découverte côté API), et les résultats
/// séparent « À venir » (du plus proche au plus lointain) et « Déjà joués ».
class RechercheScreen extends StatefulWidget {
  const RechercheScreen({super.key});

  @override
  State<RechercheScreen> createState() => _RechercheScreenState();
}

class _RechercheScreenState extends State<RechercheScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;
  Future<List<ConcertSearchResult>>? _future;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _future = context.read<ApiClient>().searchConcerts();
  }

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
        _query = value.trim();
        _future = context.read<ApiClient>().searchConcerts(_query);
      });
    });
  }

  void _openConcert(Concert concert) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => ConcertScreen(concertId: concert.id)),
    );
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
            child: FutureBuilder<List<ConcertSearchResult>>(
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
                    child: Text(
                      message,
                      style: TextStyle(color: context.colors.accentDeep),
                    ),
                  );
                }
                final concerts = snapshot.data ?? [];
                if (concerts.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        _query.isEmpty
                            ? 'Le catalogue est vide pour l’instant : recherchez un artiste pour l’alimenter.'
                            : 'Aucun concert pour « $_query ». Vérifiez l’orthographe ou essayez le nom de la salle.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: context.colors.inkSoft),
                      ),
                    ),
                  );
                }
                return _ResultList(
                  concerts: concerts,
                  query: _query,
                  onTapConcert: _openConcert,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ResultList extends StatelessWidget {
  final List<ConcertSearchResult> concerts;
  final String query;
  final void Function(Concert) onTapConcert;

  const _ResultList({
    required this.concerts,
    required this.query,
    required this.onTapConcert,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    // À venir en premier, du plus proche au plus lointain ; les passés du
    // plus récent au plus ancien — même tri que la page recherche web.
    final upcoming =
        concerts.where((c) => !c.date.isBefore(now)).toList()
          ..sort((a, b) => a.date.compareTo(b.date));
    final past = concerts.where((c) => c.date.isBefore(now)).toList()
      ..sort((a, b) => b.date.compareTo(a.date));

    final summary = query.isEmpty
        ? 'Les derniers concerts du catalogue'
        : '${concerts.length} concert${concerts.length > 1 ? 's' : ''} pour « $query »';

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 4),
          child: Text(
            summary,
            style: TextStyle(color: context.colors.inkSoft, fontSize: 13),
          ),
        ),
        if (upcoming.isNotEmpty) ...[
          _SectionLabel(label: 'À venir', count: upcoming.length),
          for (final concert in upcoming) _card(concert),
        ],
        if (past.isNotEmpty) ...[
          _SectionLabel(label: 'Déjà joués', count: past.length),
          for (final concert in past) _card(concert),
        ],
      ],
    );
  }

  Widget _card(ConcertSearchResult concert) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: ConcertCard(
      concert: concert,
      artistImageUrl: concert.artistImageUrl,
      onTap: () => onTapConcert(concert),
    ),
  );
}

class _SectionLabel extends StatelessWidget {
  final String label;
  final int count;

  const _SectionLabel({required this.label, required this.count});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 16, 8, 10),
      child: Row(
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: context.colors.inkSoft,
              fontSize: 12,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
            decoration: BoxDecoration(
              border: Border.all(color: context.colors.line),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              '$count',
              style: TextStyle(color: context.colors.inkSoft, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }
}
