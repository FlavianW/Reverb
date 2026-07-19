import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/theme.dart';

/// Miroir de `apps/web/src/lib/components/post/LikeButton.svelte`.
class LikeButton extends StatefulWidget {
  final ApiClient api;
  final String postId;
  final int initialLikeCount;
  final bool initialLikedByMe;

  const LikeButton({
    super.key,
    required this.api,
    required this.postId,
    required this.initialLikeCount,
    required this.initialLikedByMe,
  });

  @override
  State<LikeButton> createState() => _LikeButtonState();
}

class _LikeButtonState extends State<LikeButton> {
  late int likeCount = widget.initialLikeCount;
  late bool likedByMe = widget.initialLikedByMe;
  bool pending = false;

  Future<void> _toggle() async {
    setState(() => pending = true);
    try {
      if (likedByMe) {
        await widget.api.unlikePost(widget.postId);
        if (!mounted) return;
        setState(() {
          likedByMe = false;
          likeCount -= 1;
        });
      } else {
        await widget.api.likePost(widget.postId);
        if (!mounted) return;
        setState(() {
          likedByMe = true;
          likeCount += 1;
        });
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => pending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = likedByMe ? context.colors.accentDeep : context.colors.inkSoft;
    return TextButton.icon(
      onPressed: pending ? null : _toggle,
      icon: Icon(
        likedByMe ? Icons.favorite : Icons.favorite_border,
        size: 18,
        color: color,
      ),
      label: Text('$likeCount', style: TextStyle(color: color)),
      style: TextButton.styleFrom(
        foregroundColor: context.colors.inkSoft,
        padding: const EdgeInsets.symmetric(horizontal: 4),
        minimumSize: const Size(0, 0),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }
}
