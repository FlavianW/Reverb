import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/theme.dart';
import '../models/concert.dart';

/// Miroir de `apps/web/src/lib/components/concert/ConcertCard.svelte` :
/// photo de l'artiste (repli initiale stylisée), badge date et pastille
/// « À venir ». `artistImageUrl` est optionnel : les listes non enrichies
/// (profil, carte, accueil) affichent le repli.
class ConcertCard extends StatelessWidget {
  final Concert concert;
  final String? artistImageUrl;
  final VoidCallback onTap;

  const ConcertCard({
    super.key,
    required this.concert,
    this.artistImageUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final upcoming = !concert.date.isBefore(DateTime.now());

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        borderRadius: BorderRadius.circular(ReverbRadius.md),
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Media(
              artistName: concert.artistName,
              artistImageUrl: artistImageUrl,
              date: concert.date,
              upcoming: upcoming,
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    concert.artistName,
                    style: Theme.of(context).textTheme.titleLarge,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${concert.venueName} · ${concert.city}',
                    style: TextStyle(color: context.colors.inkSoft, fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Media extends StatelessWidget {
  final String artistName;
  final String? artistImageUrl;
  final DateTime date;
  final bool upcoming;

  const _Media({
    required this.artistName,
    required this.artistImageUrl,
    required this.date,
    required this.upcoming,
  });

  @override
  Widget build(BuildContext context) {
    final day = DateFormat('d', 'fr_FR').format(date);
    final monthYear = DateFormat('MMM yyyy', 'fr_FR').format(date);

    return AspectRatio(
      aspectRatio: 16 / 7,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (artistImageUrl != null)
            Image.network(
              artistImageUrl!,
              fit: BoxFit.cover,
              // Une photo qui ne charge pas retombe sur l'initiale stylisée.
              errorBuilder: (context, _, _) => _Fallback(artistName: artistName),
            )
          else
            _Fallback(artistName: artistName),
          Positioned(
            top: 10,
            left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: context.colors.paper.withValues(alpha: 0.88),
                borderRadius: BorderRadius.circular(ReverbRadius.sm),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    day,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      height: 1.1,
                    ),
                  ),
                  Text(
                    monthYear,
                    style: TextStyle(
                      color: context.colors.inkSoft,
                      fontSize: 11,
                      height: 1.2,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (upcoming)
            Positioned(
              top: 10,
              right: 10,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: context.colors.accent,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  'À VENIR',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Repli sans photo : initiale de l'artiste en sérif sur fond accent doux,
/// même parti pris que le repli du web.
class _Fallback extends StatelessWidget {
  final String artistName;

  const _Fallback({required this.artistName});

  @override
  Widget build(BuildContext context) {
    final initial = artistName.isEmpty ? '?' : artistName[0].toUpperCase();
    return Container(
      color: context.colors.accentSoft,
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontFamily: 'serif',
          fontStyle: FontStyle.italic,
          fontSize: 44,
          color: context.colors.accentDeep,
        ),
      ),
    );
  }
}
