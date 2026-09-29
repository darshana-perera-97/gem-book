import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../auth/auth_controller.dart';
import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import '../theme/app_text.dart';
import '../widgets/remote_image.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool loading = false;
  String notice = '';

  Future<void> _becomeVendor() async {
    final auth = context.read<AuthController>();
    final user = auth.user;
    if (user == null) {
      context.go('/login?next=/profile&mode=signin');
      return;
    }
    setState(() {
      loading = true;
      notice = '';
    });
    try {
      await auth.updateProfile({'role': 'VENDOR'});
      if (!mounted) return;
      await context.read<ApiClient>().ensureVendorProfile(auth.user ?? user);
      if (mounted) setState(() => notice = 'You can now list gems on the marketplace.');
    } catch (_) {
      if (mounted) setState(() => notice = 'Could not complete your application. Please try again.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final user = auth.user;
    if (user == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Sign in to view your profile', textAlign: TextAlign.center, style: AppText.pageTitle()),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.go('/login?next=/profile&mode=signin'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                ),
                child: const Text('Sign In'),
              ),
              TextButton(
                onPressed: () => context.go('/login?next=/profile'),
                child: Text('Create an account', style: AppText.caption(weight: FontWeight.w700)),
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: EdgeInsets.fromLTRB(AppLayout.of(context).pagePadding, AppLayout.of(context).pagePadding, AppLayout.of(context).pagePadding, 24),
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(16, 8, 8, 20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.slate200),
          ),
          child: Column(
            children: [
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  onPressed: auth.logout,
                  icon: const Icon(Icons.logout, color: AppColors.slate400),
                ),
              ),
              ClipOval(child: SizedBox(width: 80, height: 80, child: RemoteImage(url: user.photoURL))),
              const SizedBox(height: 12),
              Text(
                user.displayName,
                textAlign: TextAlign.center,
                style: AppText.pageTitle(),
              ),
              Text(user.contactNumber ?? user.phone ?? '', style: AppText.caption()),
              const SizedBox(height: 16),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                children: [
                  _pill(user.role, AppColors.slate100, AppColors.slate600),
                  if (user.isVendor) _pill('Verified Seller', AppColors.primary.withValues(alpha: 0.05), AppColors.primary),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text('ACCOUNT SETTINGS', style: AppText.section()),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.slate200),
          ),
          child: Column(
            children: [
              _row(Icons.person_outline, 'Display Name', user.displayName),
              const Divider(height: 1),
              _row(Icons.phone_outlined, 'Contact Number', user.contactNumber ?? user.phone ?? 'Not set'),
              const Divider(height: 1),
              _row(Icons.mail_outline, 'Email Address', user.email ?? 'Not set'),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text('BUSINESS PORTAL', style: AppText.section()),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: AppColors.slate900, borderRadius: BorderRadius.circular(20)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                user.isVendor ? 'List a New Gem' : 'Grow Your Business',
                style: AppText.cardTitle(color: Colors.white),
              ),
              const SizedBox(height: 8),
              Text(
                user.isVendor
                    ? 'Add your inventory to the marketplace and reach verified buyers.'
                    : 'Join the premier network of Sri Lankan gemstone dealers. Start listing today.',
                style: AppText.caption(color: AppColors.slate400),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: user.isVendor
                      ? () => context.go('/add-listing')
                      : (loading ? null : _becomeVendor),
                  style: FilledButton.styleFrom(
                    backgroundColor: user.isVendor ? AppColors.primary : Colors.white,
                    foregroundColor: user.isVendor ? Colors.white : AppColors.slate900,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(
                    user.isVendor ? 'Add a Listing' : (loading ? 'Processing...' : 'Start Selling'),
                    style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                ),
              ),
              if (notice.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(notice, style: AppText.caption(color: Colors.white70, weight: FontWeight.w700)),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFFEF3C7)),
          ),
          child: Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: Color(0xFFF59E0B)),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'IDENTITY VERIFICATION IS REQUIRED FOR ALL VENDORS TO MAINTAIN THE HIGHEST STANDARDS OF TRUST IN THE MARKETPLACE.',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w500, color: const Color(0xFFB45309), letterSpacing: 0.6, height: 1.5),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _pill(String label, Color bg, Color fg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(label.toUpperCase(), style: AppText.micro(color: fg, weight: FontWeight.w900, letterSpacing: 1.2)),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.slate100, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: AppColors.slate400, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label.toUpperCase(), style: AppText.micro(weight: FontWeight.w900, letterSpacing: 1.2)),
                Text(value, style: AppText.caption(color: AppColors.slate900, weight: FontWeight.w700)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.slate300),
        ],
      ),
    );
  }
}
