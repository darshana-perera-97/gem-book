import 'package:flutter/material.dart';

import '../models/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_text.dart';
import 'remote_image.dart';

class VendorCard extends StatelessWidget {
  const VendorCard({super.key, required this.vendor, this.onTap});

  final VendorProfile vendor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.slate100),
          boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 1))],
        ),
        child: Column(
          children: [
            SizedBox(
              height: 128,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                    child: SizedBox(
                      height: 80,
                      width: double.infinity,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Opacity(opacity: 0.6, child: RemoteImage(url: vendor.coverImage)),
                          const DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [Colors.transparent, Colors.white],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    top: 28,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white, width: 4),
                          boxShadow: const [BoxShadow(color: Color(0x26000000), blurRadius: 16)],
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: RemoteImage(url: vendor.logo),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Column(
                children: [
                  if (vendor.verified)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.verified, size: 14, color: AppColors.success),
                          const SizedBox(width: 4),
                          Text('VERIFIED', style: AppText.micro(color: AppColors.success, weight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Flexible(
                        child: Text(
                          vendor.companyName,
                          textAlign: TextAlign.center,
                          style: AppText.cardTitle(),
                        ),
                      ),
                      if (vendor.verificationLevel == 'GOLD')
                        const Padding(
                          padding: EdgeInsets.only(left: 8),
                          child: Icon(Icons.emoji_events, size: 16, color: AppColors.warning),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.location_on_outlined, size: 12, color: AppColors.slate400),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          '${vendor.location}, Sri Lanka',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption(),
                        ),
                      ),
                    ],
                  ),
                  if (vendor.description != null && vendor.description!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      '"${vendor.description}"',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: AppText.caption(color: AppColors.slate600).copyWith(fontStyle: FontStyle.italic),
                    ),
                  ],
                  const SizedBox(height: 16),
                  const Divider(height: 1, color: AppColors.slate50),
                  const SizedBox(height: 16),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.star, size: 12, color: AppColors.primary),
                        const SizedBox(width: 4),
                        Text(vendor.rating.toStringAsFixed(1), style: AppText.caption(color: AppColors.primary, weight: FontWeight.w700)),
                        Text(' (${vendor.reviewCount})', style: AppText.micro()),
                        const SizedBox(width: 16),
                        const Icon(Icons.people_outline, size: 12, color: AppColors.slate500),
                        const SizedBox(width: 4),
                        Text('${(vendor.followersCount / 1000).toStringAsFixed(1)}k followers', style: AppText.caption(weight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
