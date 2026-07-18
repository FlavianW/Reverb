import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/concert.dart';

/// Miroir de `apps/web/src/lib/components/concert/StarRating.svelte`.
class StarRating extends StatefulWidget {
  final ApiClient api;
  final String concertId;
  final ConcertRatingSummary summary;
  final VoidCallback onRated;

  const StarRating({
    super.key,
    required this.api,
    required this.concertId,
    required this.summary,
    required this.onRated,
  });

  @override
  State<StarRating> createState() => _StarRatingState();
}

class _StarRatingState extends State<StarRating> {
  int selected = 0;
  bool submitting = false;
  bool submitted = false;
  String? error;

  Future<void> _rate(int value) async {
    setState(() {
      selected = value;
      submitting = true;
      error = null;
    });
    try {
      await widget.api.rateConcert(widget.concertId, value);
      if (!mounted) return;
      setState(() => submitted = true);
      widget.onRated();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final summary = widget.summary;
    final summaryLabel = summary.average != null
        ? '${summary.average!.toStringAsFixed(1)} / 5 (${summary.count} avis)'
        : 'Pas encore de note';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(summaryLabel, style: TextStyle(color: context.colors.inkSoft, fontSize: 13)),
        const SizedBox(height: 8),
        Semantics(
          label: 'Votre note',
          child: Row(
            children: List.generate(5, (index) {
              final star = index + 1;
              return IconButton(
                onPressed: submitting ? null : () => _rate(star),
                icon: Icon(
                  star <= selected ? Icons.star : Icons.star_border,
                  color: star <= selected ? context.colors.accent : context.colors.line,
                ),
                tooltip: '$star étoile${star > 1 ? 's' : ''}',
              );
            }),
          ),
        ),
        if (error != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(error!, style: TextStyle(color: context.colors.accentDeep, fontSize: 13)),
          ),
        if (submitted)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Merci, votre note a été enregistrée.',
              style: TextStyle(color: context.colors.inkSoft, fontSize: 13),
            ),
          ),
      ],
    );
  }
}
