import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../core/theme.dart';

/// Lecteur vidéo d'un post (US-8.2), miroir de
/// `<video controls preload="metadata" poster>` sur le web : la vidéo réseau
/// n'est initialisée (et donc téléchargée) qu'au tap sur l'aperçu, jamais à
/// l'affichage de la carte. Sans ça, chaque vidéo du fil se met à bufferiser
/// en même temps dès le chargement de l'écran (`fil_screen.dart` construit
/// tous les posts d'un coup), ce qui sature l'appareil et casse l'affichage.
class PostVideoPlayer extends StatefulWidget {
  final String url;
  final String? posterUrl;

  const PostVideoPlayer({super.key, required this.url, this.posterUrl});

  @override
  State<PostVideoPlayer> createState() => _PostVideoPlayerState();
}

class _PostVideoPlayerState extends State<PostVideoPlayer> {
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _starting = false;
  bool _failed = false;

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    setState(() {
      _starting = true;
      _failed = false;
    });
    final videoController = VideoPlayerController.networkUrl(
      Uri.parse(widget.url),
    );
    // `initialize()` peut échouer (réseau, codec non supporté par l'appareil) :
    // sans ce try/catch, l'exception non interceptée laissait `_starting` à
    // `true` indéfiniment — un spinner qui ne s'arrête jamais.
    try {
      await videoController.initialize();
    } catch (_) {
      videoController.dispose();
      if (!mounted) return;
      setState(() {
        _starting = false;
        _failed = true;
      });
      return;
    }
    if (!mounted) {
      videoController.dispose();
      return;
    }
    setState(() {
      _videoController = videoController;
      _chewieController = ChewieController(
        videoPlayerController: videoController,
        aspectRatio: videoController.value.aspectRatio,
        autoPlay: true,
        looping: false,
      );
      _starting = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final chewie = _chewieController;
    if (chewie != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(ReverbRadius.sm),
        child: Chewie(controller: chewie),
      );
    }

    final poster = widget.posterUrl;
    return GestureDetector(
      onTap: _starting ? null : _start,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(ReverbRadius.sm),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (poster != null)
                Image.network(poster, fit: BoxFit.cover)
              else
                const ColoredBox(color: Colors.black),
              ColoredBox(color: Colors.black.withValues(alpha: 0.25)),
              Center(
                child: _starting
                    ? CircularProgressIndicator(color: context.colors.accent)
                    : _failed
                    ? Column(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(
                            Icons.error_outline,
                            size: 40,
                            color: Colors.white,
                          ),
                          SizedBox(height: 6),
                          Text(
                            'Lecture impossible, touchez pour réessayer',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ],
                      )
                    : const Icon(
                        Icons.play_circle_fill,
                        size: 56,
                        color: Colors.white,
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
