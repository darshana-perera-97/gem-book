import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import '../theme/app_text.dart';

class SideNav extends StatelessWidget {
  const SideNav({super.key, required this.width});

  final double width;

  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    return Material(
      color: Colors.white,
      child: Container(
        width: width,
        decoration: const BoxDecoration(
          border: Border(right: BorderSide(color: AppColors.slate200)),
        ),
        child: SafeArea(
          left: false,
          right: false,
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _item(context, Icons.home_outlined, Icons.home, 'Feed', '/', path == '/'),
                _item(context, Icons.shopping_bag_outlined, Icons.shopping_bag, 'Marketplace', '/marketplace', path == '/marketplace'),
                _item(context, Icons.storefront_outlined, Icons.storefront, 'Vendors', '/vendors', path == '/vendors'),
                _item(context, Icons.forum_outlined, Icons.forum, 'Community', '/community', path == '/community'),
                _item(context, Icons.chat_bubble_outline, Icons.chat_bubble, 'Messages', '/messages', path.startsWith('/messages')),
                const SizedBox(height: 12),
                const Divider(height: 1, color: AppColors.slate100),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  child: Text('PROFESSIONAL', style: AppText.micro(weight: FontWeight.w900, letterSpacing: 1.4)),
                ),
                _item(context, Icons.add_circle_outline, Icons.add_circle, 'Add Listing', '/add-listing', path == '/add-listing'),
                _item(context, Icons.person_outline, Icons.person, 'My Profile', '/profile', path == '/profile'),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.slate50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.slate200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('MARKET ACTIVITY', style: AppText.micro(weight: FontWeight.w800, letterSpacing: 1.2)),
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: const [
                          _Bar(0.4),
                          _Bar(0.6),
                          _Bar(0.55),
                          _Bar(0.9),
                          _Bar(0.75),
                          _Bar(0.85),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(text: '+12.4% ', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate800)),
                            TextSpan(text: 'this week', style: GoogleFonts.inter(fontSize: 12, color: AppColors.slate400)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _item(BuildContext context, IconData icon, IconData activeIcon, String label, String href, bool active) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: InkWell(
        onTap: () => context.go(href),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: active ? AppColors.primary.withValues(alpha: 0.06) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Icon(active ? activeIcon : icon, size: 18, color: active ? AppColors.primary : AppColors.slate600),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: active ? AppColors.primary : AppColors.slate600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar(this.t);
  final double t;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: Container(
          height: 36 * t,
          decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(2)),
        ),
      ),
    );
  }
}
