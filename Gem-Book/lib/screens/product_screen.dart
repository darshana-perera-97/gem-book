import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../api/api_client.dart';
import '../auth/auth_controller.dart';
import '../cache/vendor_cache.dart';
import '../config.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import '../theme/app_text.dart';
import '../utils/format.dart';
import '../widgets/remote_image.dart';
import '../widgets/ui.dart';

class ProductScreen extends StatefulWidget {
  const ProductScreen({super.key, required this.id});
  final String id;

  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  GemListing? listing;
  bool loading = true;
  bool notFound = false;
  bool saved = false;
  bool inquiryLoading = false;
  int galleryIndex = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final row = await context.read<ApiClient>().getListing(widget.id);
      if (!mounted) return;
      if (row == null) {
        setState(() { notFound = true; loading = false; });
        return;
      }
      context.read<VendorCache>().fetch(row.vendorId);
      setState(() { listing = row; loading = false; });
    } catch (_) {
      if (mounted) setState(() { notFound = true; loading = false; });
    }
  }

  Future<void> _inquiry() async {
    final listing = this.listing;
    if (listing == null) return;
    final user = context.read<AuthController>().user;
    if (user == null) {
      context.go('/login?next=/listings/${listing.id}');
      return;
    }
    setState(() => inquiryLoading = true);
    try {
      final api = context.read<ApiClient>();
      final cache = context.read<VendorCache>();
      final vendor = cache.getCached(listing.vendorId);
      final seller = await api.getUser(listing.vendorId);
      final convId = await api.startConversation(
        currentUser: {'uid': user.uid, 'displayName': user.displayName, 'photoURL': user.photoURL ?? ''},
        otherUser: {
          'uid': seller?.uid ?? listing.vendorId,
          'displayName': seller?.displayName ?? vendor?.companyName ?? 'Verified Dealer',
          'photoURL': seller?.photoURL ?? vendor?.logo ?? kPlaceholderVendorLogo,
        },
      );
      if (!mounted) return;
      context.go('/messages?c=$convId');
    } catch (_) {
    } finally {
      if (mounted) setState(() => inquiryLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Padding(padding: EdgeInsets.all(16), child: PulseBox(height: 280, radius: 24));
    }
    if (notFound || listing == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Listing not found', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Text('This gem may have been sold or removed.', style: GoogleFonts.inter(color: AppColors.slate500)),
            const SizedBox(height: 24),
            FilledButton(onPressed: () => context.go('/marketplace'), style: FilledButton.styleFrom(backgroundColor: AppColors.primary), child: const Text('Back to Marketplace')),
          ],
        ),
      );
    }

    final item = listing!;
    final vendor = context.watch<VendorCache>().getCached(item.vendorId);
    final images = item.images.isEmpty ? [kPlaceholderGem] : item.images;
    final layout = AppLayout.of(context);
    final pad = layout.pagePadding;

    final dealerBar = GestureDetector(
      onTap: () => context.push('/dealers/${item.vendorId}'),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.slate900,
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(colors: [AppColors.primary.withValues(alpha: 0.30), AppColors.slate900]),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(width: 48, height: 48, child: RemoteImage(url: vendor?.logo ?? kPlaceholderVendorLogo)),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(vendor?.verified == true ? 'VERIFIED DEALER' : 'DEALER', style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w900, color: AppColors.accent, letterSpacing: 1.6)),
                  Text(vendor?.companyName ?? 'Verified Dealer', maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900)),
                  Text('${vendor?.rating.toStringAsFixed(1) ?? '0.0'} ${vendor?.verified == true ? '• Verified' : ''}', style: GoogleFonts.inter(fontSize: 8, color: Colors.white60, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white38),
          ],
        ),
      ),
    );

    final gallery = Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: AspectRatio(
            aspectRatio: 4 / 3,
            child: Stack(
              fit: StackFit.expand,
              children: [
                RemoteImage(url: images[galleryIndex]),
                Positioned(
                  top: 16,
                  right: 16,
                  child: GestureDetector(
                    onTap: () => setState(() => saved = !saved),
                    child: CircleAvatar(
                      backgroundColor: saved ? Colors.red : const Color(0xCCFFFFFF),
                      child: Icon(saved ? Icons.favorite : Icons.favorite_border, color: saved ? Colors.white : AppColors.gray900),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        if (images.length > 1) ...[
          const SizedBox(height: 12),
          SizedBox(
            height: 72,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: images.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (_, i) => GestureDetector(
                onTap: () => setState(() => galleryIndex = i),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: SizedBox(width: 72, height: 72, child: RemoteImage(url: images[i])),
                ),
              ),
            ),
          ),
        ],
      ],
    );

    final details = Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.gray100)),
          child: Text(item.description, style: AppText.body(color: AppColors.slate600)),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.gray100)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (item.featured)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.warning, borderRadius: BorderRadius.circular(999)),
                  child: Text('MARKET LEADER', style: AppText.micro(color: Colors.white, weight: FontWeight.w700)),
                ),
              Text(item.title, style: AppText.pageTitle()),
              const SizedBox(height: 14),
              Text('ASKING PRICE', style: AppText.section()),
              Text(formatCurrency(item.price, item.currency), style: AppText.price(size: 26)),
              const SizedBox(height: 16),
              PrimaryButton(
                label: inquiryLoading ? 'Initiating Chat...' : 'Send Inquiry',
                busy: inquiryLoading,
                icon: Icons.chat_bubble_outline,
                onPressed: _inquiry,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => setState(() => saved = !saved),
                      icon: Icon(saved ? Icons.favorite : Icons.favorite_border, size: 18, color: saved ? Colors.red : AppColors.gray900),
                      label: Text(saved ? 'Saved' : 'Save', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: saved ? Colors.red : AppColors.gray900)),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => Share.share('Check out this gem on Ceylon Gem Book!\nhttps://www.gem-book.nexgenai.lk/listings/${item.id}'),
                      icon: const Icon(Icons.share_outlined, size: 18, color: AppColors.gray900),
                      label: Text('Share', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.gray900)),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.slate900, borderRadius: BorderRadius.circular(16)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.verified_user, color: AppColors.primary, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text('Global Trust Standard', style: AppText.cardTitle(color: Colors.white))),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Every transaction via ABEC Premier is protected by our global escrow system. Funds are released only after your verification.',
                style: AppText.caption(color: AppColors.slate400),
              ),
            ],
          ),
        ),
      ],
    );

    return ListView(
      padding: EdgeInsets.fromLTRB(pad, pad, pad, 24),
      children: [
        dealerBar,
        const SizedBox(height: 12),
        Row(
          children: [
            GestureDetector(onTap: () => context.go('/marketplace'), child: Text('MARKETPLACE', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.gray500, letterSpacing: 0.8))),
            const Icon(Icons.chevron_right, size: 14, color: AppColors.gray500),
            Flexible(child: Text(item.title.toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.gray900, letterSpacing: 0.8))),
          ],
        ),
        const SizedBox(height: 12),
        if (layout.splitPane)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 5, child: gallery),
              const SizedBox(width: 16),
              Expanded(flex: 4, child: details),
            ],
          )
        else ...[
          gallery,
          const SizedBox(height: 16),
          details,
        ],
      ],
    );
  }
}
