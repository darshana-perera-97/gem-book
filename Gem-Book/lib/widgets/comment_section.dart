import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../auth/auth_controller.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../utils/format.dart';
import 'remote_image.dart';

class CommentSection extends StatefulWidget {
  const CommentSection({super.key, required this.postId, this.onCountChange});
  final String postId;
  final ValueChanged<int>? onCountChange;

  @override
  State<CommentSection> createState() => _CommentSectionState();
}

class _CommentSectionState extends State<CommentSection> {
  final _controller = TextEditingController();
  List<Comment> comments = [];
  bool loading = true;
  bool submitting = false;
  String error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await context.read<ApiClient>().listComments(widget.postId);
      if (mounted) setState(() { comments = rows; loading = false; });
    } catch (_) {
      if (mounted) setState(() { error = 'Could not load comments.'; loading = false; });
    }
  }

  Future<void> _submit() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    final profile = context.read<AuthController>().user;
    if (profile == null) {
      context.go('/login?next=/');
      return;
    }
    setState(() { submitting = true; error = ''; });
    try {
      final saved = await context.read<ApiClient>().createComment({
        'postId': widget.postId,
        'authorId': profile.uid,
        'authorName': profile.displayName,
        'authorAvatar': profile.photoURL ?? '',
        'content': text,
      });
      setState(() {
        comments = [saved, ...comments];
        _controller.clear();
        submitting = false;
      });
      widget.onCountChange?.call(comments.length);
    } catch (_) {
      setState(() {
        error = 'Could not post your comment. Please try again.';
        submitting = false;
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        children: [
          const Divider(color: AppColors.slate100),
          const SizedBox(height: 16),
          Row(
            children: [
              ClipOval(
                child: SizedBox(
                  width: 32,
                  height: 32,
                  child: user?.photoURL != null
                      ? RemoteImage(url: user!.photoURL)
                      : const ColoredBox(color: AppColors.slate100, child: Icon(Icons.person, size: 16, color: AppColors.slate400)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _controller,
                  maxLength: 500,
                  onSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    counterText: '',
                    hintText: 'Write a comment...',
                    hintStyle: GoogleFonts.inter(fontSize: 12, color: AppColors.slate400),
                    filled: true,
                    fillColor: AppColors.slate50,
                    contentPadding: const EdgeInsets.fromLTRB(16, 10, 40, 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(999),
                      borderSide: const BorderSide(color: AppColors.slate100),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(999),
                      borderSide: const BorderSide(color: AppColors.slate100),
                    ),
                    suffixIcon: IconButton(
                      onPressed: submitting ? null : _submit,
                      icon: submitting
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.send, color: AppColors.primary, size: 18),
                    ),
                  ),
                ),
              ),
            ],
          ),
          if (error.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(error, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.red)),
            ),
          const SizedBox(height: 16),
          if (loading)
            Text('Loading comments...', style: GoogleFonts.inter(fontSize: 10, color: AppColors.slate400))
          else if (comments.isEmpty)
            Text(
              'No comments yet. Be the first to share your thoughts!',
              style: GoogleFonts.inter(fontSize: 10, fontStyle: FontStyle.italic, color: AppColors.slate400),
            )
          else
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 240),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: comments.length,
                separatorBuilder: (_, _) => const SizedBox(height: 16),
                itemBuilder: (_, i) {
                  final c = comments[i];
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipOval(
                        child: SizedBox(width: 32, height: 32, child: RemoteImage(url: c.authorAvatar)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.slate50,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(c.authorName, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.slate900)),
                                  Text(c.content, style: GoogleFonts.inter(fontSize: 12, color: AppColors.slate700, height: 1.4)),
                                ],
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.only(left: 8, top: 4),
                              child: Text(formatRelative(c.createdAt), style: GoogleFonts.inter(fontSize: 9, color: AppColors.slate400)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
