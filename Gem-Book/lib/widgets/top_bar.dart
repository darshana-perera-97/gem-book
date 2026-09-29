import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../auth/auth_controller.dart';
import '../config.dart';
import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import 'remote_image.dart';

class TopBar extends StatelessWidget {
  const TopBar({super.key, this.height = 52, this.compact = false});

  final double height;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    final layout = AppLayout.of(context);
    return Material(
      color: Colors.white,
      child: Container(
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.slate200)),
        ),
        child: SafeArea(
          bottom: false,
          child: SizedBox(
            height: height,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: layout.isTablet ? 20 : 12),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.go('/'),
                    child: Image.asset(
                      'assets/images/gembook_logo.png',
                      height: compact ? 24 : (layout.isTablet ? 32 : 28),
                      fit: BoxFit.contain,
                    ),
                  ),
                  const Spacer(),
                  if (layout.isTablet && !compact) ...[
                    Text(
                      user?.displayName ?? 'Guest',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.slate800),
                    ),
                    const SizedBox(width: 10),
                  ],
                  GestureDetector(
                    onTap: () => context.go(user != null ? '/profile' : '/login'),
                    child: Container(
                      width: compact ? 28 : 32,
                      height: compact ? 28 : 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.slate200,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: const [
                          BoxShadow(color: Color(0x14000000), blurRadius: 4, offset: Offset(0, 1)),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: RemoteImage(
                        url: user?.photoURL ?? kDefaultAvatar,
                        fit: BoxFit.cover,
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
