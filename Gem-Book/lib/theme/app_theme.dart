import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

ThemeData buildAppTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      secondary: AppColors.accent,
      surface: Colors.white,
    ),
  );

  final textTheme = GoogleFonts.interTextTheme(base.textTheme).copyWith(
    headlineMedium: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w800, height: 1.2, color: AppColors.slate900),
    headlineSmall: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, height: 1.25, color: AppColors.slate900),
    titleLarge: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, height: 1.25, color: AppColors.slate900),
    titleMedium: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, height: 1.3, color: AppColors.slate900),
    titleSmall: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, height: 1.3, color: AppColors.slate800),
    bodyLarge: GoogleFonts.inter(fontSize: 15, height: 1.4, color: AppColors.slate800),
    bodyMedium: GoogleFonts.inter(fontSize: 13, height: 1.45, color: AppColors.slate800),
    bodySmall: GoogleFonts.inter(fontSize: 12, height: 1.4, color: AppColors.slate500),
    labelLarge: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.slate800),
    labelSmall: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.4, color: AppColors.slate400),
  );

  return base.copyWith(
    textTheme: textTheme,
    visualDensity: VisualDensity.standard,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: AppColors.slate800,
      elevation: 0,
      scrolledUnderElevation: 0,
      toolbarHeight: 52,
      systemOverlayStyle: SystemUiOverlayStyle.dark,
    ),
    dividerColor: AppColors.slate200,
    splashFactory: InkRipple.splashFactory,
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(44, 44),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        textStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(44, 44),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        textStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      isDense: true,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.gray400),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.slate200),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.slate200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
      ),
    ),
  );
}
