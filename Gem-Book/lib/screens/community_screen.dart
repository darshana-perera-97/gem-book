import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import '../theme/app_text.dart';
import '../utils/format.dart';
import '../widgets/remote_image.dart';
import '../widgets/ui.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  List<SocialPost> discussions = [];
  bool loading = true;

  final groups = const [
    ('Sapphire Collectors', '12.4k', Color(0xFFCC10FE)),
    ('Ratnapura Mining Hub', '4.2k', Color(0xFF059669)),
    ('Gemology Enthusiasts', '8.9k', Color(0xFFF59E0B)),
    ('Wholesale Sri Lanka', '2.1k', Color(0xFF2563EB)),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await context.read<ApiClient>().listPosts(6, 0);
      if (mounted) setState(() { discussions = rows; loading = false; });
    } catch (_) {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pad = AppLayout.of(context).pagePadding;
    return ListView(
      padding: EdgeInsets.fromLTRB(pad, pad, pad, 24),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.slate100)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.trending_up, color: AppColors.primary, size: 20),
                  const SizedBox(width: 8),
                  Text('Trending Groups', style: AppText.cardTitle()),
                ],
              ),
              const SizedBox(height: 20),
              ...groups.map((g) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      children: [
                        CircleAvatar(radius: 24, backgroundColor: g.$3, child: Text(g.$1[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(g.$1, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700)),
                              Text('${g.$2} MEMBERS', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.slate500, letterSpacing: 0.8)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: AppColors.slate50, borderRadius: BorderRadius.circular(4), border: Border.all(color: AppColors.slate100)),
                          child: Text('Live', style: GoogleFonts.inter(fontSize: 10, color: AppColors.slate400)),
                        ),
                      ],
                    ),
                  )),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {},
                  child: Text('Explore All Groups', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.slate600)),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(16)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Build Your Expert Network', style: AppText.cardTitle(color: Colors.white)),
              const SizedBox(height: 8),
              Text('Connect with verified miners and lapidaries directly to get the best industry insights.', style: AppText.caption(color: Colors.white70)),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () {},
                style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primary),
                child: Text('Invite Contacts', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 12)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.slate100)),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Icon(Icons.forum_outlined, color: AppColors.primary, size: 20),
                    const SizedBox(width: 8),
                    Expanded(child: Text('Community Discussion', style: AppText.cardTitle())),
                  ],
                ),
              ),
              const Divider(height: 1),
              if (loading)
                const Padding(padding: EdgeInsets.all(24), child: PulseBox(height: 80))
              else if (discussions.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(48),
                  child: Column(
                    children: [
                      const Icon(Icons.forum_outlined, size: 40, color: AppColors.slate300),
                      const SizedBox(height: 12),
                      Text('No discussions yet', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.slate600)),
                      const SizedBox(height: 16),
                      FilledButton(onPressed: () => context.go('/'), style: FilledButton.styleFrom(backgroundColor: AppColors.primary), child: const Text('Go to Feed')),
                    ],
                  ),
                )
              else
                ...discussions.map((post) => InkWell(
                      onTap: () => context.go('/'),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ClipOval(child: SizedBox(width: 40, height: 40, child: RemoteImage(url: post.authorAvatar))),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Wrap(
                                    spacing: 8,
                                    children: [
                                      Text(post.authorName, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14)),
                                      Text('• ${formatRelative(post.createdAt)}', style: GoogleFonts.inter(fontSize: 10, color: AppColors.slate400)),
                                      if (post.authorType == 'VENDOR')
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(4)),
                                          child: Text('DEALER', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.primary)),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(post.content, maxLines: 3, overflow: TextOverflow.ellipsis, style: GoogleFonts.inter(fontSize: 14, color: AppColors.slate600, height: 1.5)),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      const Icon(Icons.chat_bubble_outline, size: 14, color: AppColors.slate400),
                                      const SizedBox(width: 4),
                                      Text('${post.commentsCount} Replies', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate400)),
                                      const SizedBox(width: 16),
                                      const Icon(Icons.favorite_border, size: 14, color: AppColors.slate400),
                                      const SizedBox(width: 4),
                                      Text('${post.likesCount} Likes', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate400)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    )),
            ],
          ),
        ),
      ],
    );
  }
}
