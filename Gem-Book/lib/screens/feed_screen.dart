import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../cache/vendor_cache.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import '../theme/app_text.dart';
import '../widgets/create_post.dart';
import '../widgets/listing_card.dart';
import '../widgets/post_card.dart';
import '../widgets/ui.dart';
import '../widgets/vendor_card.dart';
import '../widgets/vendor_reels_strip.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  List<SocialPost> posts = [];
  List<GemListing> listings = [];
  List<VendorProfile> vendors = [];
  SocialPost? freshReel;
  bool loading = true;
  bool loadingMore = false;
  bool hasMore = true;
  String? error;
  int offset = 0;
  static const pageSize = 10;

  @override
  void initState() {
    super.initState();
    _load(false);
    _loadSupport();
  }

  Future<void> _loadSupport() async {
    try {
      final api = context.read<ApiClient>();
      final results = await Future.wait([api.listListings(6, 0), api.listVendors(4, 0)]);
      if (!mounted) return;
      setState(() {
        listings = results[0] as List<GemListing>;
        vendors = results[1] as List<VendorProfile>;
      });
      context.read<VendorCache>().prime(vendors);
    } catch (_) {}
  }

  Future<void> _load(bool append) async {
    setState(() {
      if (append) {
        loadingMore = true;
      } else {
        loading = true;
        error = null;
      }
    });
    try {
      final off = append ? offset : 0;
      final rows = await context.read<ApiClient>().listPosts(pageSize, off);
      if (!mounted) return;
      setState(() {
        offset = off + rows.length;
        hasMore = rows.length == pageSize;
        posts = append ? [...posts, ...rows] : rows;
        loading = false;
        loadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        error = 'Could not load content. Please check your connection.';
        hasMore = false;
        loading = false;
        loadingMore = false;
      });
    }
  }

  List<Widget> _buildItems() {
    final widgets = <Widget>[];
    var listingIdx = 0;
    var vendorIdx = 0;
    for (var i = 0; i < posts.length; i++) {
      widgets.add(PostCard(key: ValueKey(posts[i].id), post: posts[i]));
      if ((i + 1) % 4 == 0 && listingIdx < listings.length) {
        final listing = listings[listingIdx++];
        widgets.add(_FeedLabel(
          label: 'New Listing in Marketplace',
          action: 'See More',
          onAction: () => context.go('/marketplace'),
          child: ListingCard(listing: listing, variant: 'feed'),
        ));
      }
      if ((i + 1) % 7 == 0 && vendorIdx < vendors.length) {
        final vendor = vendors[vendorIdx++];
        widgets.add(_FeedLabel(
          label: 'Suggested Dealer',
          action: 'See More',
          onAction: () => context.go('/vendors'),
          child: VendorCard(vendor: vendor, onTap: () => context.push('/dealers/${vendor.id}')),
        ));
      }
    }
    while (listingIdx < listings.length) {
      final listing = listings[listingIdx++];
      widgets.add(ListingCard(listing: listing, variant: 'feed'));
    }
    while (vendorIdx < vendors.length) {
      final vendor = vendors[vendorIdx++];
      widgets.add(VendorCard(vendor: vendor, onTap: () => context.push('/dealers/${vendor.id}')));
    }
    return widgets;
  }

  @override
  Widget build(BuildContext context) {
    final items = loading ? <Widget>[] : _buildItems();
    final layout = AppLayout.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        final pad = layout.feedPadding(constraints.maxWidth);
        return ListView(
          padding: EdgeInsets.fromLTRB(pad, layout.pagePadding, pad, 24),
          children: [
        CreatePost(
          onPosted: (post) {
            setState(() {
              posts = [post, ...posts];
              if (post.authorType == 'VENDOR' && post.media.isNotEmpty) freshReel = post;
            });
          },
        ),
        VendorReelsStrip(freshReel: freshReel),
        if (error != null) ErrorBanner(error!),
        if (loading)
          ...List.generate(
            3,
            (_) => Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.slate100),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    PulseBox(width: 48, height: 48, radius: 24),
                    SizedBox(width: 12),
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      PulseBox(width: 128, height: 12),
                      SizedBox(height: 8),
                      PulseBox(width: 80, height: 8),
                    ]),
                  ]),
                  SizedBox(height: 16),
                  PulseBox(height: 12),
                  SizedBox(height: 8),
                  PulseBox(width: 220, height: 12),
                ],
              ),
            ),
          )
        else if (items.isEmpty && error == null)
          const EmptyState(
            icon: Icons.chat_bubble_outline,
            title: 'The feed is quiet right now',
            subtitle: 'Share the first post — no sign-up needed.',
          )
        else
          ...items,
        if (!loading && hasMore && posts.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: LoadMoreButton(label: 'Load More Posts', loading: loadingMore, onPressed: () => _load(true)),
          ),
      ],
        );
      },
    );
  }
}

class _FeedLabel extends StatelessWidget {
  const _FeedLabel({required this.label, required this.action, required this.onAction, required this.child});
  final String label;
  final String action;
  final VoidCallback onAction;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    label.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.section(),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: onAction,
                  child: Text(action, style: AppText.caption(color: AppColors.primary, weight: FontWeight.w700)),
                ),
              ],
            ),
          ),
          child,
        ],
      ),
    );
  }
}
