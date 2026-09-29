import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';

import '../api/api_client.dart';
import '../auth/auth_controller.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../utils/format.dart';
import 'comment_section.dart';
import 'remote_image.dart';

class PostCard extends StatefulWidget {
  const PostCard({super.key, required this.post});
  final SocialPost post;

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  late bool liked;
  late int likeCount;
  late int commentCount;
  bool showComments = false;

  @override
  void initState() {
    super.initState();
    final uid = context.read<AuthController>().user?.uid;
    liked = uid != null && widget.post.likes.contains(uid);
    likeCount = widget.post.likesCount;
    commentCount = widget.post.commentsCount;
  }

  Future<void> _like() async {
    final auth = context.read<AuthController>();
    final profile = auth.user;
    if (profile == null) {
      context.go('/login?next=/');
      return;
    }
    final next = !liked;
    setState(() {
      liked = next;
      likeCount = (likeCount + (next ? 1 : -1)).clamp(0, 1 << 30);
    });
    try {
      final count = await context.read<ApiClient>().likePost(widget.post.id, profile.uid, next);
      if (mounted) setState(() => likeCount = count);
    } catch (_) {
      if (mounted) {
        setState(() {
          liked = !next;
          likeCount = (likeCount + (next ? -1 : 1)).clamp(0, 1 << 30);
        });
      }
    }
  }

  Future<void> _share() async {
    await Share.share(
      '${widget.post.content}\nhttps://www.gem-book.nexgenai.lk/?post=${widget.post.id}',
      subject: 'Post by ${widget.post.authorName} | Ceylon Gem Book',
    );
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate200),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 1))],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ClipOval(
                  child: SizedBox(
                    width: 40,
                    height: 40,
                    child: RemoteImage(url: post.authorAvatar),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              post.authorName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate900),
                            ),
                          ),
                          if (post.authorType == 'VENDOR') ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'VENDOR',
                                style: GoogleFonts.inter(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.primary,
                                  letterSpacing: 0.6,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      Text(
                        '${formatRelative(post.createdAt)} • Sri Lanka',
                        style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w500, color: AppColors.slate400),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              post.content,
              style: GoogleFonts.inter(fontSize: 13, height: 1.45, color: AppColors.slate800),
            ),
            if (post.media.isNotEmpty) ...[
              const SizedBox(height: 10),
              _MediaGrid(urls: post.media.take(4).toList()),
            ],
            const SizedBox(height: 12),
            const Divider(height: 1, color: AppColors.slate50),
            const SizedBox(height: 10),
            Row(
              children: [
                _Action(
                  icon: liked ? Icons.favorite : Icons.favorite_border,
                  count: likeCount,
                  active: liked,
                  onTap: _like,
                ),
                const SizedBox(width: 16),
                _Action(
                  icon: showComments ? Icons.chat_bubble : Icons.chat_bubble_outline,
                  count: commentCount,
                  active: showComments,
                  onTap: () => setState(() => showComments = !showComments),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: _share,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.slate50,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.share_outlined, size: 18, color: AppColors.slate500),
                        const SizedBox(width: 6),
                        Text('Share', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate500)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            if (showComments)
              CommentSection(
                postId: post.id,
                onCountChange: (c) => setState(() => commentCount = c),
              ),
          ],
        ),
      ),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({required this.icon, required this.count, required this.active, required this.onTap});
  final IconData icon;
  final int count;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.primary : AppColors.slate500;
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 6),
          Text('$count', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}

class _MediaGrid extends StatelessWidget {
  const _MediaGrid({required this.urls});
  final List<String> urls;

  @override
  Widget build(BuildContext context) {
    if (urls.length == 1) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 500),
          child: _MediaItem(url: urls.first, height: 220),
        ),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 4,
        crossAxisSpacing: 4,
        children: urls.map((u) => _MediaItem(url: u, height: 160)).toList(),
      ),
    );
  }
}

class _MediaItem extends StatelessWidget {
  const _MediaItem({required this.url, required this.height});
  final String url;
  final double height;

  @override
  Widget build(BuildContext context) {
    if (isVideoUrl(url)) {
      return SizedBox(height: height, child: InlineVideo(url: url));
    }
    return SizedBox(height: height, width: double.infinity, child: RemoteImage(url: url));
  }
}

class InlineVideo extends StatefulWidget {
  const InlineVideo({super.key, required this.url});
  final String url;

  @override
  State<InlineVideo> createState() => _InlineVideoState();
}

class _InlineVideoState extends State<InlineVideo> {
  VideoPlayerController? _controller;
  String? _resolved;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final resolved = context.read<ApiClient>().media(widget.url);
    if (_resolved == resolved) return;
    _resolved = resolved;
    _controller?.dispose();
    _controller = VideoPlayerController.networkUrl(Uri.parse(resolved))
      ..initialize().then((_) {
        if (mounted) setState(() {});
      });
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = _controller;
    if (c == null || !c.value.isInitialized) {
      return const ColoredBox(color: Colors.black, child: Center(child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)));
    }
    return GestureDetector(
      onTap: () => setState(() => c.value.isPlaying ? c.pause() : c.play()),
      child: Stack(
        alignment: Alignment.center,
        children: [
          ColoredBox(color: Colors.black, child: SizedBox.expand(child: FittedBox(fit: BoxFit.cover, child: SizedBox(width: c.value.size.width, height: c.value.size.height, child: VideoPlayer(c))))),
          if (!c.value.isPlaying)
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5), shape: BoxShape.circle),
              child: const Icon(Icons.play_arrow, color: Colors.white),
            ),
        ],
      ),
    );
  }
}
