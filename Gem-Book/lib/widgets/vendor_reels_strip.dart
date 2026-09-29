import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';

import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../utils/format.dart';
import 'remote_image.dart';

class VendorReelsStrip extends StatefulWidget {
  const VendorReelsStrip({super.key, this.freshReel});
  final SocialPost? freshReel;

  @override
  State<VendorReelsStrip> createState() => _VendorReelsStripState();
}

class _VendorReelsStripState extends State<VendorReelsStrip> {
  List<SocialPost> reels = [];
  bool loading = true;
  int? activeIndex;

  bool _isReel(SocialPost p) => p.authorType == 'VENDOR' && p.media.isNotEmpty;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant VendorReelsStrip oldWidget) {
    super.didUpdateWidget(oldWidget);
    final fresh = widget.freshReel;
    if (fresh != null && _isReel(fresh) && fresh.id != oldWidget.freshReel?.id) {
      setState(() => reels = [fresh, ...reels.where((r) => r.id != fresh.id)]);
    }
  }

  Future<void> _load() async {
    try {
      final rows = await context.read<ApiClient>().listPosts(24, 0);
      if (mounted) setState(() { reels = rows.where(_isReel).toList(); loading = false; });
    } catch (_) {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!loading && reels.isEmpty) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                const Icon(Icons.play_circle_fill, size: 16, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Vendor Reels', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.slate900)),
                      Text('Short clips from verified dealers', style: GoogleFonts.inter(fontSize: 11, color: AppColors.slate400)),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () => context.go('/vendors'),
                  child: Text('See dealers', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary)),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 196,
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              scrollDirection: Axis.horizontal,
              itemCount: loading ? 5 : reels.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (_, i) {
                if (loading) {
                  return Container(
                    width: 110,
                    decoration: BoxDecoration(color: AppColors.slate100, borderRadius: BorderRadius.circular(16)),
                  );
                }
                final reel = reels[i];
                final src = reel.media.first;
                return GestureDetector(
                  onTap: () => _openViewer(i),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: SizedBox(
                      width: 110,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          ColoredBox(color: AppColors.slate900, child: isVideoUrl(src) ? RemoteImage(url: src) : RemoteImage(url: src)),
                          const DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [Colors.transparent, Colors.black87],
                              ),
                            ),
                          ),
                          Positioned(
                            top: 8,
                            left: 8,
                            right: 8,
                            child: Row(
                              children: [
                                ClipOval(child: SizedBox(width: 24, height: 24, child: RemoteImage(url: reel.authorAvatar))),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    reel.authorName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Positioned(
                            left: 8,
                            right: 8,
                            bottom: 8,
                            child: Text(
                              reel.content,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w500, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openViewer(int index) async {
    await showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.9),
      builder: (_) => _ReelViewer(reels: reels, startIndex: index),
    );
  }
}

class _ReelViewer extends StatefulWidget {
  const _ReelViewer({required this.reels, required this.startIndex});
  final List<SocialPost> reels;
  final int startIndex;

  @override
  State<_ReelViewer> createState() => _ReelViewerState();
}

class _ReelViewerState extends State<_ReelViewer> {
  late int index;
  VideoPlayerController? _video;

  @override
  void initState() {
    super.initState();
    index = widget.startIndex;
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadMedia());
  }

  void _loadMedia() {
    _video?.dispose();
    _video = null;
    final src = widget.reels[index].media.first;
    if (!isVideoUrl(src)) {
      setState(() {});
      return;
    }
    final url = context.read<ApiClient>().media(src);
    _video = VideoPlayerController.networkUrl(Uri.parse(url))
      ..initialize().then((_) {
        if (!mounted) return;
        _video!.play();
        setState(() {});
      });
    setState(() {});
  }

  @override
  void dispose() {
    _video?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reel = widget.reels[index];
    final src = reel.media.first;
    final video = isVideoUrl(src);
    return GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Stack(
          children: [
            Center(
              child: GestureDetector(
                onTap: () {},
                child: AspectRatio(
                  aspectRatio: 9 / 16,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: ColoredBox(
                      color: Colors.black,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          if (video && _video != null && _video!.value.isInitialized)
                            FittedBox(
                              fit: BoxFit.contain,
                              child: SizedBox(
                                width: _video!.value.size.width,
                                height: _video!.value.size.height,
                                child: VideoPlayer(_video!),
                              ),
                            )
                          else if (!video)
                            RemoteImage(url: src, fit: BoxFit.contain)
                          else
                            const Center(child: CircularProgressIndicator(color: Colors.white)),
                          Positioned(
                            left: 16,
                            right: 16,
                            bottom: 16,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    ClipOval(child: SizedBox(width: 32, height: 32, child: RemoteImage(url: reel.authorAvatar))),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(reel.authorName, style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700)),
                                          Text('Vendor reel', style: GoogleFonts.inter(color: Colors.white70, fontSize: 10)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                if (reel.content.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(reel.content, maxLines: 3, style: GoogleFonts.inter(color: Colors.white, fontSize: 12)),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              top: MediaQuery.paddingOf(context).top + 8,
              right: 16,
              child: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close, color: Colors.white),
              ),
            ),
            if (index > 0)
              Positioned(
                left: 8,
                top: 0,
                bottom: 0,
                child: Center(
                  child: IconButton(
                    onPressed: () {
                      setState(() => index--);
                      _loadMedia();
                    },
                    icon: const Icon(Icons.chevron_left, color: Colors.white),
                  ),
                ),
              ),
            if (index < widget.reels.length - 1)
              Positioned(
                right: 8,
                top: 0,
                bottom: 0,
                child: Center(
                  child: IconButton(
                    onPressed: () {
                      setState(() => index++);
                      _loadMedia();
                    },
                    icon: const Icon(Icons.chevron_right, color: Colors.white),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
