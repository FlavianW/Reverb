import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/report_reason.dart';

/// Miroir de `apps/web/src/lib/components/ui/ReportButton.svelte` : un 409
/// (déjà signalé par cet utilisateur) est traité comme un succès silencieux.
class ReportButton extends StatefulWidget {
  final Future<void> Function(ReportReason reason) onReport;

  const ReportButton({super.key, required this.onReport});

  @override
  State<ReportButton> createState() => _ReportButtonState();
}

class _ReportButtonState extends State<ReportButton> {
  bool reported = false;

  Future<void> _openDialog() async {
    final reason = await showDialog<ReportReason>(
      context: context,
      builder: (context) => _ReportDialog(),
    );
    if (reason == null || !mounted) return;
    try {
      await widget.onReport(reason);
      if (!mounted) return;
      setState(() => reported = true);
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.status == 409) {
        setState(() => reported = true);
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: reported ? null : _openDialog,
      style: TextButton.styleFrom(
        foregroundColor: context.colors.inkSoft,
        padding: EdgeInsets.zero,
        minimumSize: const Size(0, 0),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      icon: Icon(reported ? Icons.flag : Icons.flag_outlined, size: 14),
      label: Text(
        reported ? 'Signalé' : 'Signaler',
        style: TextStyle(
          fontSize: 13,
          decoration: reported ? null : TextDecoration.underline,
        ),
      ),
    );
  }
}

class _ReportDialog extends StatefulWidget {
  @override
  State<_ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends State<_ReportDialog> {
  ReportReason reason = ReportReason.spam;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Signaler ce contenu'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Motif', style: TextStyle(color: context.colors.inkSoft, fontSize: 13)),
          ...ReportReason.values.map(
            (r) => RadioListTile<ReportReason>(
              value: r,
              groupValue: reason,
              onChanged: (value) => setState(() => reason = value!),
              title: Text(r.label),
              contentPadding: EdgeInsets.zero,
              dense: true,
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Annuler'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(reason),
          child: const Text('Confirmer'),
        ),
      ],
    );
  }
}
