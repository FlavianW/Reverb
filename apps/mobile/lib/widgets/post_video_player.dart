import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../core/theme.dart';

/// Lecteur vidéo d'un post (US-8.2), miroir de `<video controls poster>` sur
/// le web. Un contrôleur par instance, initialisé/disposé avec le widget :
/// la vidéo n'est jamais partagée entre plusieurs cartes de post affichées
/// en même temps dans le fil.
class PostVideoPlayer extends StatefulWidget {
  final String url;

  const PostVideoPlayer({super.key, required this.url});

  @override
  State<PostVideoPlayer> createState() => _PostVideoPlayerState();
}

class _PostVideoPlayerState extends State<PostVideoPlayer> {
  late final VideoPlayerController _videoController;
  ChewieController? _chewieController;

  @override
  void initState() {
    super.initState();
    _videoController = VideoPlayerController.networkUrl(Uri.parse(widget.url));
    _videoController.initialize().then((_) {
      if (!mounted) return;
      setState(() {
        _chewieController = ChewieController(
          videoPlayerController: _videoController,
          aspectRatio: _videoController.value.aspectRatio,
          autoPlay: false,
          looping: false,
        );
      });
    });
  }

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chewie = _chewieController;
    if (chewie == null) {
      return AspectRatio(
        aspectRatio: 16 / 9,
        child: ColoredBox(
          color: Colors.black,
          child: Center(
            child: CircularProgressIndicator(color: context.colors.accent),
          ),
        ),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(ReverbRadius.sm),
      child: Chewie(controller: chewie),
    );
  }
}
