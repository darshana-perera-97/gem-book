import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Mobile-first type and spacing. Keep titles readable without crowding a 375px screen.
class AppText {
  static TextStyle pageTitle({Color? color}) => GoogleFonts.inter(
        fontSize: 22,
        height: 1.2,
        fontWeight: FontWeight.w800,
        color: color ?? AppColors.slate900,
      );

  static TextStyle pageSubtitle({Color? color}) => GoogleFonts.inter(
        fontSize: 13,
        height: 1.4,
        fontWeight: FontWeight.w400,
        color: color ?? AppColors.slate500,
      );

  static TextStyle section({Color? color}) => GoogleFonts.inter(
        fontSize: 11,
        height: 1.2,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.2,
        color: color ?? AppColors.slate400,
      );

  static TextStyle cardTitle({Color? color}) => GoogleFonts.inter(
        fontSize: 15,
        height: 1.25,
        fontWeight: FontWeight.w700,
        color: color ?? AppColors.slate900,
      );

  static TextStyle body({Color? color}) => GoogleFonts.inter(
        fontSize: 13,
        height: 1.45,
        fontWeight: FontWeight.w400,
        color: color ?? AppColors.slate800,
      );

  static TextStyle caption({Color? color, FontWeight? weight}) => GoogleFonts.inter(
        fontSize: 12,
        height: 1.35,
        fontWeight: weight ?? FontWeight.w400,
        color: color ?? AppColors.slate500,
      );

  static TextStyle micro({Color? color, FontWeight? weight, double? letterSpacing}) => GoogleFonts.inter(
        fontSize: 10,
        height: 1.15,
        fontWeight: weight ?? FontWeight.w700,
        letterSpacing: letterSpacing ?? 0,
        color: color ?? AppColors.slate400,
      );

  static TextStyle price({Color? color, double size = 22}) => GoogleFonts.inter(
        fontSize: size,
        height: 1.1,
        fontWeight: FontWeight.w900,
        letterSpacing: -0.4,
        color: color ?? AppColors.accent,
      );
}

class AppSpace {
  static const page = 12.0;
  static const card = 14.0;
  static const section = 16.0;
  static const maxContentWidth = 430.0;
}
