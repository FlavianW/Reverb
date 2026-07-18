import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/concert.dart';
import '../widgets/concert_card.dart';
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
      builder: (context) => Padding(
        padding: const EdgeInsets.all(16),
        child: ConcertCard(
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
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Carte')),
      body: switch (_status) {
        _Status.locating => const Center(
          child: Text(
            'Localisation en cours…',
            style: TextStyle(color: ReverbColors.inkSoft),
          ),
        ),
        _Status.denied => const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              "Impossible d'accéder à votre position. Activez la géolocalisation "
              'dans les réglages pour voir les concerts à proximité.',
              textAlign: TextAlign.center,
              style: TextStyle(color: ReverbColors.inkSoft),
            ),
          ),
        ),
        _Status.error => const Center(
          child: Text(
            'Une erreur est survenue. Réessayez plus tard.',
            style: TextStyle(color: ReverbColors.accentDeep),
          ),
        ),
        _Status.ready => _buildMap(_position!),
      },
    );
  }

  Widget _buildMap(LatLng position) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              _concerts.length > 1
                  ? '${_concerts.length} concerts à proximité'
                  : '${_concerts.length} concert à proximité',
              style: const TextStyle(color: ReverbColors.inkSoft, fontSize: 13),
            ),
          ),
        ),
        Expanded(
          child: FlutterMap(
            options: MapOptions(initialCenter: position, initialZoom: 11),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.reverb.mobile',
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: position,
                    width: 40,
                    height: 40,
                    child: const Icon(
                      Icons.my_location,
                      color: ReverbColors.accent,
                      size: 28,
                    ),
                  ),
                  for (final concert in _concerts)
                    if (concert.latitude != null && concert.longitude != null)
                      Marker(
                        point: LatLng(concert.latitude!, concert.longitude!),
                        width: 40,
                        height: 40,
                        child: GestureDetector(
                          onTap: () => _showConcert(concert),
                          child: const Icon(
                            Icons.location_pin,
                            color: ReverbColors.accentDeep,
                            size: 36,
                          ),
                        ),
                      ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
