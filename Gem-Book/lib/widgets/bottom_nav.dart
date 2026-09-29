import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import '../theme/app_layout.dart';

class BottomNav extends StatelessWidget {
  const BottomNav({super.key});

  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    final layout = AppLayout.of(context);
    final barHeight = layout.isPhone && layout.isLandscape ? 48.0 : 56.0;

    return Material(
      color: Colors.white,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.slate200)),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: barHeight,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Row(
                    children: [
                      _NavItem(
                        icon: Icons.home_outlined,
                        activeIcon: Icons.home,
                        label: 'Feed',
                        active: path == '/',
                        onTap: () => context.go('/'),
                      ),
                      _NavItem(
                        icon: Icons.shopping_bag_outlined,
                        activeIcon: Icons.shopping_bag,
                        label: 'Shop',
                        active: path == '/marketplace',
                        onTap: () => context.go('/marketplace'),
                      ),
                      const Expanded(child: SizedBox()),
                      _NavItem(
                        icon: Icons.chat_bubble_outline,
                        activeIcon: Icons.chat_bubble,
                        label: 'Chats',
                        active: path == '/messages',
                        onTap: () => context.go('/messages'),
                      ),
                      _NavItem(
                        icon: Icons.people_outline,
                        activeIcon: Icons.people,
                        label: 'Vendors',
                        active: path == '/vendors',
                        onTap: () => context.go('/vendors'),
                      ),
                    ],
                  ),
                  Positioned(
                    top: layout.isPhone && layout.isLandscape ? -8 : -12,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: GestureDetector(
                        onTap: () => context.go('/add-listing'),
                        behavior: HitTestBehavior.opaque,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.30),
                                    blurRadius: 16,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                                border: path == '/add-listing'
                                    ? Border.all(color: AppColors.primary.withValues(alpha: 0.20), width: 4)
                                    : null,
                              ),
                              child: const Icon(Icons.add, color: Colors.white, size: 24),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'LIST',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                height: 1.0,
                                fontWeight: FontWeight.w700,
                                color: AppColors.gray500,
                                letterSpacing: -0.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.primary : AppColors.gray400;
    final labelColor = active ? AppColors.primary : AppColors.gray500;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(active ? activeIcon : icon, size: 18, color: color),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label.toUpperCase(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  height: 1.0,
                  fontWeight: FontWeight.w700,
                  color: labelColor,
                  letterSpacing: -0.4,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
