import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../models/artist.dart';

/// Miroir de `ArtistAutocomplete.svelte` : suggestions d'artiste (avec photo
/// si disponible) sous le champ, sur le même modèle que la recherche de
/// concert dans `ComposePostForm`/`fil_screen.dart`.
class ArtistAutocompleteField extends StatefulWidget {
  final String label;
  final String initialValue;
  final ValueChanged<String> onChanged;

  const ArtistAutocompleteField({
    super.key,
    required this.label,
    required this.initialValue,
    required this.onChanged,
  });

  @override
  State<ArtistAutocompleteField> createState() =>
      _ArtistAutocompleteFieldState();
}

class _ArtistAutocompleteFieldState extends State<ArtistAutocompleteField> {
  late final _controller = TextEditingController(text: widget.initialValue);
  Timer? _debounce;
  List<ArtistSuggestion> _results = [];

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    widget.onChanged(value);
    _debounce?.cancel();

    if (value.trim().length < 2) {
      setState(() => _results = []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      final results = await context.read<ApiClient>().searchArtists(
        value.trim(),
      );
      if (!mounted) return;
      setState(() => _results = results);
    });
  }

  void _select(ArtistSuggestion suggestion) {
    _controller.text = suggestion.name;
    widget.onChanged(suggestion.name);
    setState(() => _results = []);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _controller,
          decoration: InputDecoration(labelText: widget.label),
          onChanged: _onChanged,
        ),
        ..._results.map(
          (suggestion) => ListTile(
            dense: true,
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
              radius: 14,
              backgroundImage: suggestion.imageUrl != null
                  ? NetworkImage(suggestion.imageUrl!)
                  : null,
              child: suggestion.imageUrl == null
                  ? Text(
                      suggestion.name.isEmpty
                          ? '?'
                          : suggestion.name.substring(0, 1).toUpperCase(),
                      style: const TextStyle(fontSize: 12),
                    )
                  : null,
            ),
            title: Text(suggestion.name),
            onTap: () => _select(suggestion),
          ),
        ),
      ],
    );
  }
}
