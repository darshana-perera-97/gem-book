import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Width + orientation breakpoints for phone and tablet.
class AppLayout {
  AppLayout(this.size);

  final Size size;

  static AppLayout of(BuildContext context) => AppLayout(MediaQuery.sizeOf(context));

  bool get isPhone => size.shortestSide < 600;
  bool get isTablet => !isPhone;
  bool get isLandscape => size.width > size.height;
  bool get isPortrait => !isLandscape;

  /// Side rail on tablet landscape / wide windows.
  bool get useRail => isTablet && size.width >= 900;

  bool get useBottomNav => !useRail;

  /// Marketplace / vendors / dealer inventory.
  int get gridColumns {
    if (size.width >= 1180) return 3;
    if (size.width >= 700) return 2;
    if (isPhone && isLandscape && size.width >= 640) return 2;
    return 1;
  }

  /// Chat inbox + thread, product gallery + details.
  bool get splitPane => size.width >= 840;

  double get pagePadding {
    if (isTablet && isLandscape) return 24;
    if (isTablet) return 20;
    if (isPhone && isLandscape) return 10;
    return 12;
  }

  double get topBarHeight {
    if (isPhone && isLandscape) return 44;
    if (isTablet) return 56;
    return 52;
  }

  double get railWidth => size.width >= 1100 ? 232 : 204;

  /// Horizontal inset so a 1-column feed stays readable on tablets.
  double feedPadding(double availableWidth) {
    if (gridColumns >= 2) return pagePadding;
    const readable = 680.0;
    if (availableWidth <= readable + pagePadding * 2) return pagePadding;
    return math.max(pagePadding, (availableWidth - readable) / 2);
  }
}
