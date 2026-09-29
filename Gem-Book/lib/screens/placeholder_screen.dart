import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';

class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({super.key, required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: AppColors.gray100,
              child: Text('?', style: GoogleFonts.inter(fontSize: 36, color: AppColors.slate300)),
            ),
            const SizedBox(height: 24),
            Text(title, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              'This page is part of our upcoming industry-first digital platform. The core MVP elements of Feed and Marketplace are already live!',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(color: AppColors.gray500),
            ),
          ],
        ),
      ),
    );
  }
}
