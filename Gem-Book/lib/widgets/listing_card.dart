import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../cache/vendor_cache.dart';
import '../config.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_text.dart';
import '../utils/format.dart';
import 'remote_image.dart';

class ListingCard extends StatelessWidget {
  const ListingCard({super.key, required this.listing, this.variant = 'grid'});

  final GemListing listing;
  final String variant;

  @override
  Widget build(BuildContext context) {
    final cache = context.watch<VendorCache>();
    cache.fetch(listing.vendorId);
    final vendor = cache.getCached(listing.vendorId);

    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(bottom: variant == 'feed' ? 16 : 0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate200),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 1))],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
            child: GestureDetector(
              onTap: () => context.push('/dealers/${listing.vendorId}'),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: SizedBox(
                      width: 32,
                      height: 32,
                      child: RemoteImage(url: vendor?.logo ?? kPlaceholderVendorLogo),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          vendor?.verified == true ? 'VERIFIED DEALER' : 'DEALER',
                          style: AppText.micro(color: AppColors.primary, weight: FontWeight.w900, letterSpacing: 1.2),
                        ),
                        Text(
                          vendor?.companyName ?? 'Ceylon Gemstone Hub',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption(color: AppColors.slate900, weight: FontWeight.w700),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 8, color: AppColors.slate400),
                            const SizedBox(width: 2),
                            Expanded(
                              child: Text(
                                vendor?.location ?? 'Beruwala, SL',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.micro(color: AppColors.slate500, weight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          GestureDetector(
            onTap: () => context.push('/listings/${listing.id}'),
            child: AspectRatio(
              aspectRatio: 1,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ColorFiltered(
                    colorFilter: listing.isSold
                        ? const ColorFilter.matrix(<double>[
                            0.5, 0.5, 0.5, 0, 0,
                            0.5, 0.5, 0.5, 0, 0,
                            0.5, 0.5, 0.5, 0, 0,
                            0, 0, 0, 0.8, 0,
                          ])
                        : const ColorFilter.mode(Colors.transparent, BlendMode.dst),
                    child: RemoteImage(
                      url: listing.images.isNotEmpty ? listing.images.first : kPlaceholderGem,
                    ),
                  ),
                  if (listing.isSold)
                    Container(
                      color: Colors.black.withValues(alpha: 0.4),
                      alignment: Alignment.center,
                      child: Transform.rotate(
                        angle: -0.2,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 8),
                          decoration: BoxDecoration(border: Border.all(color: Colors.white, width: 4)),
                          child: Text(
                            'SOLD',
                            style: AppText.pageTitle(color: Colors.white).copyWith(fontSize: 22, letterSpacing: 3),
                          ),
                        ),
                      ),
                    ),
                  Positioned(
                    top: 16,
                    left: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (listing.featured && !listing.isSold) _chip('PREMIUM', AppColors.amber400),
                        if (vendor?.verified == true) ...[
                          const SizedBox(height: 8),
                          _chip('VERIFIED', AppColors.primary, icon: Icons.verified),
                        ],
                      ],
                    ),
                  ),
                  if (!listing.isSold)
                    const Positioned(
                      bottom: 16,
                      right: 16,
                      child: CircleAvatar(
                        backgroundColor: Color(0xE6FFFFFF),
                        child: Icon(Icons.favorite_border, color: AppColors.slate500, size: 20),
                      ),
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => context.push('/listings/${listing.id}'),
                        child: Text(
                          listing.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.cardTitle(),
                        ),
                      ),
                    ),
                    if (!listing.isSold) ...[
                      const SizedBox(width: 8),
                      Flexible(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerRight,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                'ASKING PRICE',
                                style: AppText.micro(weight: FontWeight.w900, letterSpacing: 1.0),
                              ),
                              Text(
                                formatCurrency(listing.price, listing.currency),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.price(size: 15),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ]
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.10)),
                        ),
                        child: Text(
                          'SOLD',
                          style: AppText.micro(color: AppColors.primary, weight: FontWeight.w900),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                const Divider(height: 1, color: AppColors.slate50),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.star, size: 12, color: AppColors.amber400),
                    const Icon(Icons.star, size: 12, color: AppColors.amber400),
                    const Icon(Icons.star, size: 12, color: AppColors.amber400),
                    const Icon(Icons.star, size: 12, color: AppColors.amber400),
                    const Icon(Icons.star, size: 12, color: AppColors.amber400),
                    const SizedBox(width: 6),
                    Text(
                      '${vendor?.rating.toStringAsFixed(1) ?? '4.9'} (${vendor?.reviewCount ?? 24})',
                      style: AppText.micro(color: AppColors.slate500, weight: FontWeight.w700),
                    ),
                    const Spacer(),
                    const Icon(Icons.chat_bubble_outline, size: 18, color: AppColors.slate400),
                    const SizedBox(width: 12),
                    const Icon(Icons.share_outlined, size: 18, color: AppColors.slate400),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, Color color, {IconData? icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
        boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 8)],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 10, color: Colors.white), const SizedBox(width: 4)],
          Text(
            label,
            style: AppText.micro(color: Colors.white, weight: FontWeight.w900, letterSpacing: 1.0),
          ),
        ],
      ),
    );
  }
}
