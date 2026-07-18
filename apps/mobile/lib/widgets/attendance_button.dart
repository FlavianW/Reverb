import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/theme.dart';

/// Miroir de `apps/web/src/lib/components/concert/AttendanceButton.svelte`.
class AttendanceButton extends StatefulWidget {
  final ApiClient api;
  final String concertId;
  final bool initialAttending;

  const AttendanceButton({
    super.key,
    required this.api,
    required this.concertId,
    required this.initialAttending,
  });

  @override
  State<AttendanceButton> createState() => _AttendanceButtonState();
}

class _AttendanceButtonState extends State<AttendanceButton> {
  late bool attending = widget.initialAttending;
  bool pending = false;

  Future<void> _toggle() async {
    setState(() => pending = true);
    try {
      if (attending) {
        await widget.api.unmarkAttendance(widget.concertId);
      } else {
        await widget.api.markAttendance(widget.concertId);
      }
      if (!mounted) return;
      setState(() => attending = !attending);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => pending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: pending ? null : _toggle,
      style: attending
          ? null
          : ElevatedButton.styleFrom(
              backgroundColor: context.colors.paperAlt,
              foregroundColor: context.colors.ink,
              side: BorderSide(color: context.colors.line),
            ),
      child: const Text("J'y étais"),
    );
  }
}
