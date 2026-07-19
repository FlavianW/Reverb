import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/session.dart';
import '../core/theme.dart';
import '../models/concert.dart';
import '../models/post.dart';
import '../widgets/concert_card.dart';
import '../widgets/post_card.dart';
import '../widgets/theme_toggle_button.dart';
import 'concert_screen.dart';

const _maxArtistConcerts = 5;
const _maxFeedPreview = 3;
const _maxNearbyConcerts = 5;

enum _NearbyStatus { idle, locating, ready, denied, error }

/// Accueil personnalisé, miroir de `apps/web/src/routes/+page.svelte` :
/// concerts de l'artiste favori (import Setlist.fm via la recherche), aperçu
/// du fil des amis, et concerts à proximité à la demande.
class AccueilScreen extends StatefulWidget {
  /// Bascules vers les onglets Fil et Carte, fournies par `RootShell` — un
  /// écran de l'`IndexedStack` ne peut pas changer d'onglet lui-même.
  final VoidCallback? onOpenFil;
  final VoidCallback? onOpenCarte;

  const AccueilScreen({super.key, this.onOpenFil, this.onOpenCarte});

  @override
  State<AccueilScreen> createState() => _AccueilScreenState();
}

class _AccueilScreenState extends State<AccueilScreen> {
  Future<List<Concert>>? _artistConcertsFuture;
  late Future<PostPage> _feedFuture;

  _NearbyStatus _nearbyStatus = _NearbyStatus.idle;
  List<NearbyConcert> _nearbyConcerts = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final api = context.read<ApiClient>();
    final favoriteArtist =
        context.read<SessionController>().user?.favoriteArtist;
    _artistConcertsFuture = favoriteArtist == null
        ? null
        : api.searchConcerts(favoriteArtist);
    _feedFuture = api.getFeed();
  }

  Future<void> _refresh() async {
    setState(_load);
    await Future.wait([?_artistConcertsFuture, _feedFuture]);
  }

  /// Même parcours de permissions que `CarteScreen`, mais déclenché par un
  /// bouton : pas de demande de géolocalisation imposée à l'ouverture.
  Future<void> _locate() async {
    setState(() => _nearbyStatus = _NearbyStatus.locating);
    final api = context.read<ApiClient>();

    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      setState(() => _nearbyStatus = _NearbyStatus.denied);
      return;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      setState(() => _nearbyStatus = _NearbyStatus.denied);
      return;
    }

    try {
      final position = await Geolocator.getCurrentPosition();
      final concerts = await api.getNearbyConcerts(
        position.latitude,
        position.longitude,
      );
      if (!mounted) return;
      setState(() {
        _nearbyConcerts = concerts.take(_maxNearbyConcerts).toList();
        _nearbyStatus = _NearbyStatus.ready;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _nearbyStatus = _NearbyStatus.error);
    }
  }

  void _openConcert(String concertId) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => ConcertScreen(concertId: concertId)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final favoriteArtist =
        context.watch<SessionController>().user?.favoriteArtist;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reverb'),
        actions: const [ThemeToggleButton()],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _sectionLabel(
              favoriteArtist == null
                  ? 'Ton artiste favori'
                  : 'Les concerts de $favoriteArtist',
            ),
            if (favoriteArtist == null)
              _muted(
                'Renseigne ton artiste favori sur ton profil pour retrouver '
                'ici ses concerts, importés automatiquement depuis Setlist.fm.',
              )
            else
              _artistConcertsSection(favoriteArtist),
            const SizedBox(height: 28),
            _sectionLabel('Du côté de tes amis'),
            _feedPreviewSection(),
            const SizedBox(height: 28),
            _sectionLabel('Autour de toi'),
            _nearbySection(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _artistConcertsSection(String favoriteArtist) {
    return FutureBuilder<List<Concert>>(
      future: _artistConcertsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _muted('Recherche des concerts sur Setlist.fm…');
        }
        if (snapshot.hasError) {
          return _muted('Impossible de récupérer les concerts pour le moment.');
        }
        final concerts = snapshot.data ?? [];
        if (concerts.isEmpty) {
          return _muted('Aucun concert trouvé pour $favoriteArtist.');
        }
        return Column(
          children: [
            for (final concert in concerts.take(_maxArtistConcerts))
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: ConcertCard(
                  concert: concert,
                  onTap: () => _openConcert(concert.id),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _feedPreviewSection() {
    final api = context.read<ApiClient>();
    return FutureBuilder<PostPage>(
      future: _feedFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        if (snapshot.hasError) {
          return _muted('Impossible de charger le fil pour le moment.');
        }
        final posts = snapshot.data?.items ?? [];
        if (posts.isEmpty) {
          return _muted(
            "Rien à afficher pour l'instant — ajoute des amis ou publie ton "
            'premier post.',
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (final post in posts.take(_maxFeedPreview))
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: PostCard(
                  api: api,
                  post: post,
                  canDelete: false,
                  onDelete: () async {},
                ),
              ),
            if (widget.onOpenFil != null)
              TextButton.icon(
                onPressed: widget.onOpenFil,
                icon: const Icon(Icons.dynamic_feed_outlined, size: 18),
                label: const Text('Voir tout le fil'),
              ),
          ],
        );
      },
    );
  }

  Widget _nearbySection() {
    switch (_nearbyStatus) {
      case _NearbyStatus.idle:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _muted('Découvre les concerts à venir près de chez toi.'),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _locate,
              icon: const Icon(Icons.my_location, size: 18),
              label: const Text('Me localiser'),
            ),
          ],
        );
      case _NearbyStatus.locating:
        return _muted('Localisation en cours…');
      case _NearbyStatus.denied:
        return _muted(
          'Géolocalisation refusée. Active-la dans les réglages pour voir '
          'les concerts à proximité.',
        );
      case _NearbyStatus.error:
        return _muted(
          'Impossible de récupérer les concerts à proximité. Réessaie plus tard.',
        );
      case _NearbyStatus.ready:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_nearbyConcerts.isEmpty)
              _muted('Aucun concert à proximité pour l’instant.')
            else
              for (final concert in _nearbyConcerts)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ConcertCard(
                    concert: concert,
                    onTap: () => _openConcert(concert.id),
                  ),
                ),
            if (widget.onOpenCarte != null)
              TextButton.icon(
                onPressed: widget.onOpenCarte,
                icon: const Icon(Icons.map_outlined, size: 18),
                label: const Text('Ouvrir la carte'),
              ),
          ],
        );
    }
  }

  Widget _sectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          letterSpacing: 1,
          color: context.colors.inkSoft,
        ),
      ),
    );
  }

  Widget _muted(String text) {
    return Text(
      text,
      style: TextStyle(color: context.colors.inkSoft, height: 1.5),
    );
  }
}
