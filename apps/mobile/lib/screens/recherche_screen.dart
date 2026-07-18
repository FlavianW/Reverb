import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/concert.dart';
import '../widgets/concert_card.dart';
import 'concert_screen.dart';

/// Miroir de `apps/web/src/routes/recherche/+page.svelte` : une requête vide
/// renvoie le même fil que l'accueil (US-3.1).
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
        _future = context.read<ApiClient>().searchConcerts(value);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recherche'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _controller,
              onChanged: _onChanged,
              decoration: const InputDecoration(
                hintText: 'Artiste ou salle…',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          Expanded(
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
                  return Center(child: Text(message, style: const TextStyle(color: ReverbColors.accentDeep)));
                }
                final concerts = snapshot.data ?? [];
                if (concerts.isEmpty) {
                  return const Center(child: Text('Aucun résultat.', style: TextStyle(color: ReverbColors.inkSoft)));
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
