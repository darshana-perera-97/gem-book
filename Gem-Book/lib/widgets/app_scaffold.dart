import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import 'bottom_nav.dart';
import 'side_nav.dart';
import 'top_bar.dart';

class AppScaffold extends StatelessWidget {
  const AppScaffold({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final layout = AppLayout(media.size);

    return MediaQuery(
      data: media.copyWith(
        textScaler: media.textScaler.clamp(minScaleFactor: 1.0, maxScaleFactor: 1.15),
      ),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: Column(
          children: [
            TopBar(height: layout.topBarHeight, compact: layout.isPhone && layout.isLandscape),
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (layout.useRail) SideNav(width: layout.railWidth),
                  Expanded(child: child),
                ],
              ),
            ),
          ],
        ),
        bottomNavigationBar: layout.useBottomNav ? const BottomNav() : null,
      ),
    );
  }
}

class PagePadding extends StatelessWidget {
  const PagePadding({super.key, required this.child, this.bottom = 24});

  final Widget child;
  final double bottom;

  @override
  Widget build(BuildContext context) {
    final pad = AppLayout.of(context).pagePadding;
    return Padding(
      padding: EdgeInsets.fromLTRB(pad, pad, pad, bottom),
      child: child,
    );
  }
}
