import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../auth/auth_controller.dart';
import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import '../theme/app_text.dart';
import '../widgets/ui.dart';

class AddListingScreen extends StatefulWidget {
  const AddListingScreen({super.key});

  @override
  State<AddListingScreen> createState() => _AddListingScreenState();
}

class _AddListingScreenState extends State<AddListingScreen> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  final _picker = ImagePicker();
  final List<XFile> images = [];
  String status = 'idle';
  String formError = '';
  String? titleErr;
  String? descErr;
  String? priceErr;
  String? imagesErr;

  static const maxImages = 6;
  static const maxTitle = 80;
  static const maxDescription = 1500;
  static const maxPrice = 100000000;

  bool get busy => status != 'idle';

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _price.dispose();
    super.dispose();
  }

  bool _validate() {
    String? t, d, p, i;
    final trimmed = _title.text.trim();
    final priceValue = num.tryParse(_price.text);
    if (trimmed.isEmpty) {
      t = 'Give your gem a name.';
    } else if (trimmed.length < 3) {
      t = 'Name must be at least 3 characters.';
    } else if (trimmed.length > maxTitle) {
      t = 'Keep the name under $maxTitle characters.';
    }
    if (_description.text.trim().isEmpty) {
      d = 'Add a short description for buyers.';
    } else if (_description.text.length > maxDescription) {
      d = 'Description is too long.';
    }
    if (_price.text.trim().isEmpty) {
      p = 'Set an asking price.';
    } else if (priceValue == null || priceValue <= 0) {
      p = 'Enter a price greater than zero.';
    } else if (priceValue > maxPrice) {
      p = 'That price looks too high — please check it.';
    }
    if (images.isEmpty) i = 'Add at least one photo.';
    setState(() {
      titleErr = t;
      descErr = d;
      priceErr = p;
      imagesErr = i;
    });
    return t == null && d == null && p == null && i == null;
  }

  Future<void> _submit() async {
    setState(() => formError = '');
    if (!_validate()) return;
    final profile = context.read<AuthController>().user;
    if (profile == null) {
      setState(() => formError = 'Please set up your profile again.');
      return;
    }
    try {
      final api = context.read<ApiClient>();
      await api.ensureVendorProfile(profile);
      setState(() => status = 'uploading');
      final urls = await Future.wait(images.map((img) => api.uploadFile(File(img.path))));
      setState(() => status = 'saving');
      final saved = await api.createListing({
        'vendorId': profile.uid,
        'title': _title.text.trim(),
        'description': _description.text.trim(),
        'price': num.parse(_price.text),
        'currency': 'LKR',
        'images': urls,
        'status': 'ACTIVE',
      });
      if (!mounted) return;
      context.go('/listings/${saved.id}');
    } catch (_) {
      setState(() {
        formError = 'We could not publish your listing. Please check your connection and try again.';
        status = 'idle';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    if (user == null) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(24)),
              child: const Icon(Icons.verified_user_outlined, size: 40, color: AppColors.primary),
            ),
            const SizedBox(height: 24),
            Text('Set up your profile to sell', textAlign: TextAlign.center, style: AppText.pageTitle()),
            const SizedBox(height: 12),
            Text(
              'Just your name, contact number, and a photo so buyers can reach you — it takes about a minute.',
              textAlign: TextAlign.center,
              style: AppText.pageSubtitle(),
            ),
            const SizedBox(height: 32),
            PrimaryButton(label: 'Get Started', onPressed: () => context.go('/login?next=/add-listing')),
            TextButton(onPressed: () => context.go('/marketplace'), child: const Text('Back to Marketplace')),
          ],
        ),
      );
    }

    return ListView(
      padding: EdgeInsets.fromLTRB(AppLayout.of(context).pagePadding, AppLayout.of(context).pagePadding, AppLayout.of(context).pagePadding, 24),
      children: [
        GestureDetector(
          onTap: () => context.pop(),
          child: Row(
            children: [
              const Icon(Icons.arrow_back, size: 14, color: AppColors.slate400),
              const SizedBox(width: 8),
              Text('BACK', style: AppText.micro(weight: FontWeight.w700, letterSpacing: 1.6)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.slate100),
            boxShadow: const [BoxShadow(color: Color(0x1494A3B8), blurRadius: 20, offset: Offset(0, 8))],
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('List Gem', style: AppText.pageTitle()),
              Text('Marketplace Submission', style: AppText.caption()),
              const SizedBox(height: 20),
              _label('Name'),
              TextField(
                controller: _title,
                maxLength: maxTitle,
                style: AppText.cardTitle(),
                decoration: _input('Natural Unheated Ceylon Blue Sapphire', error: titleErr),
              ),
              if (titleErr != null) _err(titleErr!),
              const SizedBox(height: 20),
              _label('Images'),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: images.length + (images.length < maxImages ? 1 : 0),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 12, mainAxisSpacing: 12),
                itemBuilder: (_, i) {
                  if (i == images.length) {
                    return GestureDetector(
                      onTap: () async {
                        final files = await _picker.pickMultiImage();
                        if (files.isEmpty) return;
                        final room = maxImages - images.length;
                        setState(() => images.addAll(files.take(room)));
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: imagesErr != null ? Colors.red.shade300 : AppColors.slate200, width: 2, style: BorderStyle.solid),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.add_photo_alternate_outlined, color: AppColors.slate400),
                            Text('ADD', style: AppText.micro(weight: FontWeight.w700, letterSpacing: 1.2)),
                          ],
                        ),
                      ),
                    );
                  }
                  return Stack(
                    fit: StackFit.expand,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.file(File(images[i].path), fit: BoxFit.cover),
                      ),
                      if (i == 0)
                        Positioned(
                          left: 6,
                          bottom: 6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(999)),
                            child: Text('COVER', style: AppText.micro(color: Colors.white, weight: FontWeight.w900)),
                          ),
                        ),
                      Positioned(
                        top: 6,
                        right: 6,
                        child: GestureDetector(
                          onTap: () => setState(() => images.removeAt(i)),
                          child: const CircleAvatar(radius: 12, backgroundColor: Colors.black54, child: Icon(Icons.close, size: 14, color: Colors.white)),
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 8),
              if (imagesErr != null) _err(imagesErr!) else Text('First photo is the cover. Images are optimised automatically before upload.', style: AppText.micro()),
              const SizedBox(height: 20),
              _label('Description'),
              TextField(
                controller: _description,
                maxLines: 4,
                maxLength: maxDescription,
                decoration: _input('Tell buyers about this gem — origin, character, what makes it special...', error: descErr),
              ),
              if (descErr != null) _err(descErr!),
              const SizedBox(height: 20),
              _label('Price (LKR)'),
              TextField(
                controller: _price,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: _input('285000', prefix: 'Rs. ', error: priceErr),
              ),
              if (priceErr != null) _err(priceErr!),
              if (formError.isNotEmpty) ...[const SizedBox(height: 16), ErrorBanner(formError)],
              const SizedBox(height: 24),
              PrimaryButton(
                label: status == 'uploading' ? 'Optimising photos...' : status == 'saving' ? 'Publishing...' : 'List Your Gem',
                busy: busy,
                icon: busy ? null : Icons.arrow_forward,
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text.toUpperCase(), style: AppText.section()),
      );

  Widget _err(String t) => Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Text(t, style: AppText.caption(color: Colors.red, weight: FontWeight.w700)),
      );

  InputDecoration _input(String hint, {String? prefix, String? error}) {
    return InputDecoration(
      hintText: hint,
      prefixText: prefix,
      counterText: '',
      filled: true,
      fillColor: AppColors.slate50,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: error != null ? Colors.red.shade300 : AppColors.slate100)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: error != null ? Colors.red.shade300 : AppColors.slate100)),
    );
  }
}
