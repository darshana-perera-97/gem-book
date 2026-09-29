import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../auth/auth_controller.dart';
import '../config.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../utils/format.dart';
import 'remote_image.dart';

class ReviewsSection extends StatefulWidget {
  const ReviewsSection({super.key, required this.vendorId});
  final String vendorId;

  @override
  State<ReviewsSection> createState() => _ReviewsSectionState();
}

class _ReviewsSectionState extends State<ReviewsSection> {
  List<Review> reviews = [];
  int rating = 5;
  final _content = TextEditingController();
  bool loading = false;
  String error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await context.read<ApiClient>().listReviews(widget.vendorId);
      if (mounted) setState(() => reviews = rows);
    } catch (_) {}
  }

  Future<void> _submit() async {
    final text = _content.text.trim();
    final user = context.read<AuthController>().user;
    if (text.isEmpty || user == null) return;
    setState(() { loading = true; error = ''; });
    try {
      final saved = await context.read<ApiClient>().createReview({
        'targetId': widget.vendorId,
        'authorId': user.uid,
        'authorName': user.displayName,
        'authorAvatar': user.photoURL ?? '',
        'rating': rating,
        'content': text,
      });
      setState(() {
        reviews = [saved, ...reviews];
        _content.clear();
        rating = 5;
        loading = false;
      });
    } catch (_) {
      setState(() {
        error = 'Could not submit your review. Please try again.';
        loading = false;
      });
    }
  }

  @override
  void dispose() {
    _content.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (user == null)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.slate50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.slate200),
            ),
            child: Column(
              children: [
                Text('Set up a profile to leave a review', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate600)),
                Text('Takes a minute — just your name and number.', style: GoogleFonts.inter(fontSize: 10, color: AppColors.slate400)),
              ],
            ),
          )
        else
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.gray100),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.chat_bubble_outline, size: 18, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Text('Write a Review', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16)),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    for (var s = 1; s <= 5; s++)
                      IconButton(
                        onPressed: () => setState(() => rating = s),
                        icon: Icon(Icons.star, color: s <= rating ? AppColors.amber400 : AppColors.slate200, size: 24),
                      ),
                    Text('$rating/5 Stars', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.slate500)),
                  ],
                ),
                TextField(
                  controller: _content,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: 'Share your experience with this dealer...',
                    filled: true,
                    fillColor: AppColors.slate50,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.slate100)),
                  ),
                ),
                if (error.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(error, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.red)),
                  ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: loading || _content.text.trim().isEmpty ? null : _submit,
                    style: FilledButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(vertical: 12)),
                    child: Text(loading ? 'Submitting...' : 'Submit Review', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: 24),
        Row(
          children: [
            Text('Customer Reviews', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(999)),
              child: Text('${reviews.length}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.gray500)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (reviews.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 40),
            decoration: BoxDecoration(
              color: AppColors.slate50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.slate200),
            ),
            child: Text('No reviews yet for this business.', textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.slate400)),
          )
        else
          ...reviews.map((r) => Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.gray100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ClipOval(child: SizedBox(width: 40, height: 40, child: RemoteImage(url: r.authorAvatar ?? kDefaultAvatar))),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(r.authorName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700)),
                              Text(formatRelative(r.createdAt), style: GoogleFonts.inter(fontSize: 10, color: AppColors.slate400)),
                            ],
                          ),
                        ),
                        Row(children: [
                          for (var s = 1; s <= 5; s++)
                            Icon(Icons.star, size: 12, color: s <= r.rating ? AppColors.amber400 : AppColors.slate100),
                        ]),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text('"${r.content}"', style: GoogleFonts.inter(fontSize: 14, fontStyle: FontStyle.italic, color: AppColors.slate600)),
                  ],
                ),
              )),
      ],
    );
  }
}
