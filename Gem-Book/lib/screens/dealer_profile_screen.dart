import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api_client.dart';
import '../auth/auth_controller.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import '../theme/app_text.dart';
import '../utils/format.dart';
import '../widgets/listing_card.dart';
import '../widgets/post_card.dart';
import '../widgets/remote_image.dart';
import '../widgets/responsive_grid.dart';
import '../widgets/reviews_section.dart';
import '../widgets/ui.dart';

class DealerProfileScreen extends StatefulWidget {
  const DealerProfileScreen({super.key, required this.id});
  final String id;

  @override
  State<DealerProfileScreen> createState() => _DealerProfileScreenState();
}

class _DealerProfileScreenState extends State<DealerProfileScreen> {
  VendorProfile? vendor;
  bool loading = true;
  bool notFound = false;
  List<GemListing> listings = [];
  List<SocialPost> posts = [];
  bool contentLoading = true;
  String tab = 'INVENTORY';
  bool followBusy = false;
  bool messageLoading = false;
  int followerBump = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final row = await context.read<ApiClient>().getVendor(widget.id);
      if (!mounted) return;
      if (row == null) {
        setState(() { notFound = true; loading = false; });
        return;
      }
      setState(() { vendor = row; loading = false; });
      _loadContent(row);
    } catch (_) {
      if (mounted) setState(() { notFound = true; loading = false; });
    }
  }

  Future<void> _loadContent(VendorProfile v) async {
    try {
      final api = context.read<ApiClient>();
      final results = await Future.wait([
        api.listingsByVendor(v.id, 48),
        api.postsByAuthor(v.userId.isNotEmpty ? v.userId : v.id, 24),
      ]);
      if (!mounted) return;
      setState(() {
        listings = results[0] as List<GemListing>;
        posts = results[1] as List<SocialPost>;
        contentLoading = false;
      });
    } catch (_) {
      if (mounted) setState(() => contentLoading = false);
    }
  }

  Future<void> _follow() async {
    final v = vendor;
    if (v == null) return;
    final auth = context.read<AuthController>();
    final user = auth.user;
    if (user == null) {
      context.go('/login?next=/dealers/${v.id}');
      return;
    }
    final next = !(user.following.contains(v.id));
    final following = next ? [...user.following, v.id] : user.following.where((id) => id != v.id).toList();
    setState(() {
      followBusy = true;
      followerBump += next ? 1 : -1;
    });
    try {
      await context.read<ApiClient>().followVendor(user.uid, v.id, next);
      await auth.updateProfile({'following': following});
    } catch (_) {
      setState(() => followerBump -= next ? 1 : -1);
    } finally {
      if (mounted) setState(() => followBusy = false);
    }
  }

  Future<void> _message() async {
    final v = vendor;
    if (v == null) return;
    final user = context.read<AuthController>().user;
    if (user == null) {
      context.go('/login?next=/dealers/${v.id}');
      return;
    }
    setState(() => messageLoading = true);
    try {
      final id = await context.read<ApiClient>().startConversation(
        currentUser: {'uid': user.uid, 'displayName': user.displayName, 'photoURL': user.photoURL ?? ''},
        otherUser: {'uid': v.userId.isNotEmpty ? v.userId : v.id, 'displayName': v.companyName, 'photoURL': v.logo ?? ''},
      );
      if (!mounted) return;
      context.go('/messages?c=$id');
    } catch (_) {
    } finally {
      if (mounted) setState(() => messageLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Padding(padding: EdgeInsets.all(16), child: PulseBox(height: 200, radius: 24));
    }
    if (notFound || vendor == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.storefront_outlined, size: 48, color: AppColors.slate300),
            const SizedBox(height: 12),
            Text('Dealer not found', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 24),
            FilledButton(onPressed: () => context.go('/vendors'), style: FilledButton.styleFrom(backgroundColor: AppColors.primary), child: const Text('Browse Dealers')),
          ],
        ),
      );
    }

    final v = vendor!;
    final user = context.watch<AuthController>().user;
    final isFollowing = user?.following.contains(v.id) ?? false;
    final followers = ((v.followersCount) + followerBump).clamp(0, 1 << 30);
    final shorts = posts.where((p) => p.media.isNotEmpty).toList();
    final active = listings.where((l) => l.status != 'SOLD').toList();
    final sold = listings.where((l) => l.status == 'SOLD').toList();

    final layout = AppLayout.of(context);
    final pad = layout.pagePadding;
    final cols = layout.gridColumns;

    return ListView(
      padding: EdgeInsets.fromLTRB(pad, pad, pad, 24),
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: SizedBox(
            height: layout.isTablet ? 200 : 160,
            child: Stack(
              fit: StackFit.expand,
              children: [
                ColoredBox(color: AppColors.slate900, child: v.coverImage != null ? Opacity(opacity: 0.7, child: RemoteImage(url: v.coverImage)) : null),
                const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black38]))),
              ],
            ),
          ),
        ),
        Transform.translate(
          offset: const Offset(0, -48),
          child: Column(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(border: Border.all(color: Colors.white, width: 4), color: Colors.white),
                  child: RemoteImage(url: v.logo),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Flexible(child: Text(v.companyName, textAlign: TextAlign.center, style: AppText.pageTitle())),
                  if (v.verified) const Padding(padding: EdgeInsets.only(left: 8), child: Icon(Icons.verified, color: AppColors.primary)),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.location_on_outlined, size: 14, color: AppColors.slate400),
                  Flexible(
                    child: Text(
                      ' ${v.location}, Sri Lanka',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption(),
                    ),
                  ),
                ],
              ),
              if (v.description != null && v.description!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 12, left: 24, right: 24),
                  child: Text('"${v.description}"', textAlign: TextAlign.center, style: GoogleFonts.inter(fontStyle: FontStyle.italic, color: AppColors.slate600)),
                ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _stat(Icons.star, v.rating > 0 ? v.rating.toStringAsFixed(1) : '—', 'Rating'),
                  const SizedBox(width: 32),
                  _stat(Icons.inventory_2_outlined, '${listings.length}', 'Listings'),
                  const SizedBox(width: 32),
                  _stat(Icons.people_outline, formatFollowers(followers), 'Followers'),
                ],
              ),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: followBusy ? null : _follow,
                        icon: Icon(isFollowing ? Icons.person_add_alt_1 : Icons.person_add_alt, size: 16),
                        label: Text(isFollowing ? 'Following' : 'Follow', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                        style: FilledButton.styleFrom(
                          backgroundColor: isFollowing ? AppColors.slate100 : AppColors.slate900,
                          foregroundColor: isFollowing ? AppColors.slate700 : Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: messageLoading ? null : _message,
                        icon: const Icon(Icons.chat_bubble_outline, size: 16),
                        label: Text(messageLoading ? '...' : 'Message', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (v.contactEmail.isNotEmpty || (v.phone != null && v.phone!.isNotEmpty) || (v.website != null && v.website!.isNotEmpty))
                Padding(
                  padding: const EdgeInsets.only(top: 20),
                  child: Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 16,
                    children: [
                      if (v.contactEmail.isNotEmpty)
                        _link(Icons.mail_outline, v.contactEmail, () => launchUrl(Uri.parse('mailto:${v.contactEmail}'))),
                      if (v.phone != null && v.phone!.isNotEmpty)
                        _link(Icons.phone_outlined, v.phone!, () => launchUrl(Uri.parse('tel:${v.phone}'))),
                      if (v.website != null && v.website!.isNotEmpty)
                        _link(Icons.language, 'Website', () => launchUrl(Uri.parse(v.website!))),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _tab('INVENTORY', Icons.grid_view, listings.length),
            _tab('POSTS', Icons.article_outlined, posts.length),
            _tab('SHORTS', Icons.play_arrow, shorts.length),
            _tab('REVIEWS', Icons.star_outline, v.reviewCount),
          ],
        ),
        const Divider(),
        const SizedBox(height: 16),
        if (tab == 'INVENTORY')
          contentLoading
              ? const PulseBox(height: 200, radius: 16)
              : active.isEmpty && sold.isEmpty
                  ? const EmptyState(icon: Icons.inventory_2_outlined, title: 'No listings from this dealer yet.')
                  : Column(children: [
                      ResponsiveGrid(columns: cols, children: active.map((l) => ListingCard(listing: l)).toList()),
                      if (sold.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Align(alignment: Alignment.centerLeft, child: Text('SOLD', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate400, letterSpacing: 1.6))),
                        const SizedBox(height: 8),
                        ResponsiveGrid(columns: cols, children: sold.map((l) => ListingCard(listing: l)).toList()),
                      ],
                    ]),
        if (tab == 'POSTS')
          contentLoading
              ? const PulseBox(height: 200, radius: 16)
              : posts.isEmpty
                  ? const EmptyState(icon: Icons.article_outlined, title: "This dealer hasn't posted yet.")
                  : Column(children: posts.map((p) => PostCard(post: p)).toList()),
        if (tab == 'SHORTS')
          contentLoading
              ? const PulseBox(height: 200, radius: 16)
              : shorts.isEmpty
                  ? const EmptyState(icon: Icons.play_circle_outline, title: 'No shorts published yet.')
                  : GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: shorts.length,
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: cols >= 3 ? 4 : (cols >= 2 ? 3 : 2),
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 9 / 16,
                      ),
                      itemBuilder: (_, i) {
                        final p = shorts[i];
                        return ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              ColoredBox(color: AppColors.slate900, child: RemoteImage(url: p.media.first)),
                              Positioned(
                                left: 8,
                                right: 8,
                                bottom: 8,
                                child: Text(p.content, maxLines: 2, overflow: TextOverflow.ellipsis, style: GoogleFonts.inter(color: Colors.white, fontSize: 10)),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
        if (tab == 'REVIEWS') ReviewsSection(vendorId: v.id),
      ],
    );
  }

  Widget _stat(IconData icon, String value, String label) {
    return Column(
      children: [
        Row(children: [Icon(icon, size: 14, color: AppColors.primary), const SizedBox(width: 4), Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.w900))]),
        Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.slate400, letterSpacing: 1.2)),
      ],
    );
  }

  Widget _tab(String key, IconData icon, int count) {
    final active = tab == key;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => tab = key),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: active ? AppColors.primary : Colors.transparent, width: 2))),
          child: Column(
            children: [
              Icon(icon, size: 16, color: active ? AppColors.primary : AppColors.slate400),
              Text('$count', style: GoogleFonts.inter(fontSize: 10, color: AppColors.slate500, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _link(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 14, color: AppColors.slate500), const SizedBox(width: 6), Text(label, style: GoogleFonts.inter(fontSize: 14, color: AppColors.slate500))]),
    );
  }
}
