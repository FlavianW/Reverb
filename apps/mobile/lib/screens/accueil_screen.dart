import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/concert.dart';
import '../widgets/concert_card.dart';
import '../widgets/theme_toggle_button.dart';
import 'concert_screen.dart';

/// Accueil = recherche vide (fil des concerts les plus récents), comme
/// `apps/web/src/routes/+page.server.ts`.
class AccueilScreen extends StatefulWidget {
  const AccueilScreen({super.key});

  @override
  State<AccueilScreen> createState() => _AccueilScreenState();
}

class _AccueilScreenState extends State<AccueilScreen> {
  late Future<List<Concert>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<ApiClient>().searchConcerts();
  }

  Future<void> _refresh() async {
    final future = context.read<ApiClient>().searchConcerts();
    setState(() {
      _future = future;
    });
    await future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reverb'),
        actions: const [ThemeToggleButton()],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<Concert>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              final message = snapshot.error is ApiException
                  ? (snapshot.error as ApiException).message
                  : 'Une erreur est survenue.';
              return ListView(
                children: [
                  const SizedBox(height: 80),
                  Center(child: Text(message, style: TextStyle(color: context.colors.accentDeep))),
                ],
              );
            }
            final concerts = snapshot.data ?? [];
            if (concerts.isEmpty) {
              return ListView(
                children: [
                  const SizedBox(height: 80),
                  Center(child: Text('Aucun concert pour le moment.', style: TextStyle(color: context.colors.inkSoft))),
                ],
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
    );
  }
}
