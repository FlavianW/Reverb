import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/post.dart';
import 'avatar.dart';
import 'like_button.dart';

/// Miroir de `apps/web/src/lib/components/post/PostCard.svelte` : rendu
/// conditionnel selon le type (notation, présence, ou post explicite photo/texte).
class PostCard extends StatefulWidget {
  final ApiClient api;
  final PostSummary post;
  final bool canDelete;
  final Future<void> Function() onDelete;

  const PostCard({
    super.key,
    required this.api,
    required this.post,
    required this.canDelete,
    required this.onDelete,
  });

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  bool deleting = false;

  Future<void> _delete() async {
    setState(() => deleting = true);
    try {
      await widget.onDelete();
    } finally {
      if (mounted) setState(() => deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final formattedDate = DateFormat(
      'd MMM yyyy',
      'fr_FR',
    ).format(post.createdAt);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: context.colors.line),
        borderRadius: BorderRadius.circular(ReverbRadius.md),
        color: context.colors.paperAlt,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ReverbAvatar(
                src: post.author.avatarUrl,
                name: post.author.pseudo,
                size: 40,
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.author.pseudo,
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge?.copyWith(fontSize: 15),
                  ),
                  Text(
                    formattedDate,
                    style: TextStyle(
                      color: context.colors.inkSoft,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          _body(context),
          const SizedBox(height: 8),
          Row(
            children: [
              LikeButton(
                api: widget.api,
                postId: post.id,
                initialLikeCount: post.likeCount,
                initialLikedByMe: post.likedByMe,
              ),
              if (widget.canDelete) ...[
                const Spacer(),
                TextButton(
                  onPressed: deleting ? null : _delete,
                  child: const Text('Supprimer'),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _body(BuildContext context) {
    final post = widget.post;
    switch (post.type) {
      case PostType.rating:
        final value = post.ratingValue ?? 0;
        final stars = '★' * value + '☆' * (5 - value);
        return Text.rich(
          TextSpan(
            children: [
              const TextSpan(text: 'A noté '),
              TextSpan(
                text: post.concert?.artistName ?? '',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: context.colors.accentDeep,
                ),
              ),
              TextSpan(
                text: ' $stars',
                style: TextStyle(color: context.colors.accent),
              ),
            ],
          ),
        );
      case PostType.attendance:
        return Text.rich(
          TextSpan(
            children: [
              const TextSpan(text: 'A marqué sa présence à '),
              TextSpan(
                text: post.concert?.artistName ?? '',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: context.colors.accentDeep,
                ),
              ),
            ],
          ),
        );
      case PostType.photo:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (post.concert != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  'À propos de ${post.concert!.artistName}',
                  style: TextStyle(
                    color: context.colors.inkSoft,
                    fontSize: 13,
                  ),
                ),
              ),
            if (post.content != null && post.content!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(post.content!),
              ),
            if (post.photos.isNotEmpty)
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: 1,
                ),
                itemCount: post.photos.length,
                itemBuilder: (context, index) => ClipRRect(
                  borderRadius: BorderRadius.circular(ReverbRadius.sm),
                  child: Image.network(
                    post.photos[index].url,
                    fit: BoxFit.cover,
                    semanticLabel:
                        'Photo partagée par ${post.author.pseudo}',
                  ),
                ),
              ),
          ],
        );
    }
  }
}
