import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/theme.dart';
import '../models/concert.dart';

/// Miroir de `apps/web/src/lib/components/concert/ConcertCard.svelte`.
class ConcertCard extends StatelessWidget {
  final Concert concert;
  final VoidCallback onTap;

  const ConcertCard({super.key, required this.concert, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final formattedDate = DateFormat('d MMM yyyy', 'fr_FR').format(concert.date);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(ReverbRadius.md),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                concert.artistName,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 6),
              Text(
                '${concert.venueName}, ${concert.city}',
                style: TextStyle(
                  color: context.colors.inkSoft,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                formattedDate,
                style: TextStyle(
                  color: context.colors.inkSoft,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
