import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../auth/auth_controller.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import 'remote_image.dart';

class SelectedMedia {
  SelectedMedia({required this.file, required this.kind});
  final XFile file;
  final String kind;
}

class CreatePost extends StatefulWidget {
  const CreatePost({super.key, this.onPosted});
  final ValueChanged<SocialPost>? onPosted;

  @override
  State<CreatePost> createState() => _CreatePostState();
}

class _CreatePostState extends State<CreatePost> {
  final _text = TextEditingController();
  bool expanded = false;
  String status = 'idle';
  String error = '';
  final List<SelectedMedia> media = [];
  final _picker = ImagePicker();

  static const maxImages = 4;
  static const maxLength = 2000;
  static const maxVideoBytes = 50 * 1024 * 1024;

  bool get hasVideo => media.any((m) => m.kind == 'video');
  bool get busy => status != 'idle';

  Future<void> _pickImages() async {
    if (hasVideo) {
      setState(() => error = 'Remove the reel video before adding photos.');
      return;
    }
    final files = await _picker.pickMultiImage();
    if (files.isEmpty) return;
    final room = maxImages - media.length;
    setState(() {
      error = files.length > room ? 'You can attach up to $maxImages photos.' : '';
      media.addAll(files.take(room).map((f) => SelectedMedia(file: f, kind: 'image')));
    });
  }

  Future<void> _pickVideo() async {
    final file = await _picker.pickVideo(source: ImageSource.gallery);
    if (file == null) return;
    final len = await file.length();
    if (len > maxVideoBytes) {
      setState(() => error = 'Reels must be under 50 MB.');
      return;
    }
    setState(() {
      error = '';
      media
        ..clear()
        ..add(SelectedMedia(file: file, kind: 'video'));
    });
  }

  void _reset() {
    _text.clear();
    setState(() {
      media.clear();
      error = '';
      expanded = false;
      status = 'idle';
    });
  }

  Future<void> _submit() async {
    final trimmed = _text.text.trim();
    if (trimmed.isEmpty && !hasVideo) return;
    if (trimmed.length > maxLength) {
      setState(() => error = 'Posts are limited to $maxLength characters.');
      return;
    }
    final profile = context.read<AuthController>().user;
    if (profile == null) {
      setState(() => error = 'Please set up your profile to post.');
      return;
    }
    setState(() => error = '');
    try {
      final api = context.read<ApiClient>();
      var urls = <String>[];
      if (media.isNotEmpty) {
        setState(() => status = 'uploading');
        urls = await Future.wait(media.map((m) => api.uploadFile(File(m.file.path))));
      }
      setState(() => status = 'posting');
      final saved = await api.createPost({
        'authorId': profile.uid,
        'authorName': profile.displayName,
        'authorAvatar': profile.photoURL ?? '',
        'authorType': profile.isVendor ? 'VENDOR' : 'USER',
        'content': trimmed.isEmpty ? 'New reel' : trimmed,
        'media': urls,
        'likesCount': 0,
        'likes': <String>[],
        'commentsCount': 0,
        'sharesCount': 0,
        'averageRating': 0,
        'type': hasVideo ? 'STORY' : 'DISCUSSION',
      });
      widget.onPosted?.call(saved);
      _reset();
    } catch (_) {
      setState(() {
        error = 'Could not publish your post. Please try again.';
        status = 'idle';
      });
    }
  }

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    if (user == null) {
      return Container(
        margin: const EdgeInsets.only(bottom: 24),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.slate200),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Join the conversation', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.slate900)),
                  Text(
                    'Set up a quick profile to share with the community.',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.slate500),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: () => context.go('/login?next=/'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: const StadiumBorder(),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
              child: Text('Get Started', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate200),
      ),
      child: !expanded
          ? Row(
              children: [
                ClipOval(child: SizedBox(width: 40, height: 40, child: RemoteImage(url: user.photoURL))),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => expanded = true),
                    child: Container(
                      height: 40,
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(color: AppColors.slate50, borderRadius: BorderRadius.circular(999)),
                      child: Text(
                        'Share your latest find or gem story...',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(fontSize: 12, color: AppColors.slate400),
                      ),
                    ),
                  ),
                ),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    ClipOval(child: SizedBox(width: 32, height: 32, child: RemoteImage(url: user.photoURL))),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(user.displayName, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate700)),
                    ),
                    IconButton(onPressed: _reset, icon: const Icon(Icons.close, size: 18, color: AppColors.slate400)),
                  ],
                ),
                TextField(
                  controller: _text,
                  maxLines: 5,
                  maxLength: maxLength,
                  autofocus: true,
                  decoration: InputDecoration(
                    counterText: '',
                    hintText: hasVideo ? 'Add a caption for your reel…' : "What's happening in the gem world?",
                    hintStyle: GoogleFonts.inter(color: AppColors.slate300),
                    border: InputBorder.none,
                  ),
                ),
                if (media.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    children: [
                      for (var i = 0; i < media.length; i++)
                        Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(File(media[i].file.path), width: 72, height: 72, fit: BoxFit.cover),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: GestureDetector(
                                onTap: () => setState(() => media.removeAt(i)),
                                child: const CircleAvatar(radius: 10, backgroundColor: Colors.black54, child: Icon(Icons.close, size: 12, color: Colors.white)),
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                if (error.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(12)),
                    child: Text(error, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.red)),
                  ),
                const Divider(height: 24, color: AppColors.slate50),
                Row(
                  children: [
                    IconButton(
                      onPressed: busy || hasVideo || media.length >= maxImages ? null : _pickImages,
                      icon: const Icon(Icons.image_outlined, color: AppColors.primary),
                    ),
                    if (user.isVendor)
                      IconButton(
                        onPressed: busy ? null : _pickVideo,
                        icon: const Icon(Icons.play_circle_outline, color: AppColors.primary),
                      ),
                    const Spacer(),
                    FilledButton(
                      onPressed: busy || (!hasVideo && _text.text.trim().isEmpty) ? null : _submit,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: const StadiumBorder(),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                      ),
                      child: Row(
                        children: [
                          if (busy)
                            const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          else
                            const Icon(Icons.send, size: 16),
                          const SizedBox(width: 8),
                          Text(
                            status == 'uploading'
                                ? 'Uploading...'
                                : status == 'posting'
                                    ? 'Posting...'
                                    : hasVideo
                                        ? 'Publish Reel'
                                        : 'Post',
                            style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
    );
  }
}
