import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/concert.dart';
import '../widgets/concert_card.dart';
import '../widgets/theme_toggle_button.dart';
import 'concert_screen.dart';

enum _Status { locating, ready, denied, error }

/// Miroir de `apps/web/src/routes/carte/+page.svelte` : géolocalisation de
/// l'appareil puis carte (OpenStreetMap) des concerts à proximité (US-9.1).
class CarteScreen extends StatefulWidget {
  const CarteScreen({super.key});

  @override
  State<CarteScreen> createState() => _CarteScreenState();
}

class _CarteScreenState extends State<CarteScreen> {
  _Status _status = _Status.locating;
  LatLng? _position;
  List<NearbyConcert> _concerts = [];

  @override
  void initState() {
    super.initState();
    _locate();
  }

  Future<void> _locate() async {
    setState(() => _status = _Status.locating);
    final api = context.read<ApiClient>();

    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      setState(() => _status = _Status.denied);
      return;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      setState(() => _status = _Status.denied);
      return;
    }

    try {
      final devicePosition = await Geolocator.getCurrentPosition();
      final position = LatLng(
        devicePosition.latitude,
        devicePosition.longitude,
      );
      final concerts = await api.getNearbyConcerts(
        position.latitude,
        position.longitude,
      );
      if (!mounted) return;
      setState(() {
        _position = position;
        _concerts = concerts;
        _status = _Status.ready;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _status = _Status.error);
    }
  }

  void _showConcert(NearbyConcert concert) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: context.colors.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(ReverbRadius.lg)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.near_me, size: 16, color: context.colors.accent),
                  const SizedBox(width: 6),
                  Text(
                    'À ${concert.distanceKm.toStringAsFixed(concert.distanceKm < 10 ? 1 : 0)} km de toi',
                    style: TextStyle(color: context.colors.inkSoft, fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ConcertCard(
                concert: concert,
                onTap: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ConcertScreen(concertId: concert.id),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Carte'),
        actions: const [ThemeToggleButton()],
      ),
      body: switch (_status) {
        _Status.locating => Center(
          child: Text(
            'Localisation en cours…',
            style: TextStyle(color: context.colors.inkSoft),
          ),
        ),
        _Status.denied => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              "Impossible d'accéder à votre position. Activez la géolocalisation "
              'dans les réglages pour voir les concerts à proximité.',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.colors.inkSoft),
            ),
          ),
        ),
        _Status.error => Center(
          child: Text(
            'Une erreur est survenue. Réessayez plus tard.',
            style: TextStyle(color: context.colors.accentDeep),
          ),
        ),
        _Status.ready => _buildMap(_position!),
      },
    );
  }

  Widget _buildMap(LatLng position) {
    // Tuiles CARTO assorties au thème : le fond de carte suit le mode
    // sombre/clair de l'app au lieu du style OSM par défaut, toujours clair.
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tileStyle = isDark ? 'dark_all' : 'light_all';

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              _concerts.length > 1
                  ? '${_concerts.length} concerts à venir à proximité'
                  : '${_concerts.length} concert à venir à proximité',
              style: TextStyle(color: context.colors.inkSoft, fontSize: 13),
            ),
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: context.colors.line),
                borderRadius: BorderRadius.circular(ReverbRadius.lg),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(ReverbRadius.lg - 1),
                child: FlutterMap(
                  options: MapOptions(initialCenter: position, initialZoom: 11),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://{s}.basemaps.cartocdn.com/$tileStyle/{z}/{x}/{y}.png',
                      subdomains: const ['a', 'b', 'c', 'd'],
                      userAgentPackageName: 'com.reverb.mobile',
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: position,
                          width: 22,
                          height: 22,
                          child: _UserPositionMarker(),
                        ),
                        for (final concert in _concerts)
                          if (concert.latitude != null &&
                              concert.longitude != null)
                            Marker(
                              point: LatLng(
                                concert.latitude!,
                                concert.longitude!,
                              ),
                              width: 40,
                              height: 40,
                              child: _ConcertMarker(
                                onTap: () => _showConcert(concert),
                              ),
                            ),
                      ],
                    ),
                    const SimpleAttributionWidget(
                      source: Text('© OpenStreetMap, © CARTO'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Position de l'utilisateur : point accent cerclé de blanc, plus discret
/// qu'une épingle pour ne pas concurrencer les marqueurs de concerts.
class _UserPositionMarker extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.colors.accent,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3),
        boxShadow: const [
          BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 2)),
        ],
      ),
    );
  }
}

/// Marqueur de concert aux couleurs de Reverb : pastille accent avec une note
/// de musique, à la place de l'épingle Material par défaut.
class _ConcertMarker extends StatelessWidget {
  final VoidCallback onTap;

  const _ConcertMarker({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.accent,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: const [
            BoxShadow(
              color: Colors.black38,
              blurRadius: 8,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: const Icon(Icons.music_note, color: Colors.white, size: 22),
      ),
    );
  }
}
