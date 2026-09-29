import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../auth/auth_controller.dart';
import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import '../theme/app_text.dart';
import '../utils/phone.dart';
import '../widgets/ui.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.nextPath, this.initialMode = 'create'});
  final String nextPath;
  final String initialMode;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _name = TextEditingController();
  final _contact = TextEditingController();
  final _contactConfirm = TextEditingController();
  late String mode;
  String createStep = 'details';
  String role = 'USER';
  XFile? photo;
  Uint8List? photoBytes;
  bool loading = false;
  String error = '';
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    mode = widget.initialMode == 'signin' ? 'signin' : 'create';
  }

  @override
  void dispose() {
    _name.dispose();
    _contact.dispose();
    _contactConfirm.dispose();
    super.dispose();
  }

  void _switchMode(String next) {
    setState(() {
      mode = next;
      createStep = 'details';
      error = '';
    });
  }

  void _setPhone(TextEditingController controller, String value) {
    final next = formatLkMobileInput(value);
    if (next == controller.text) return;
    controller.value = TextEditingValue(
      text: next,
      selection: TextSelection.collapsed(offset: next.length),
    );
  }

  Future<void> _goRole() async {
    setState(() => error = '');
    if (_name.text.trim().isEmpty) {
      setState(() => error = 'Please enter your name.');
      return;
    }
    final parsed = parseLkMobile(_contact.text);
    final confirmed = parseLkMobile(_contactConfirm.text);
    if (parsed == null) {
      setState(() => error = 'Please enter a valid Sri Lankan mobile number.');
      return;
    }
    if (parsed != confirmed) {
      setState(() => error = 'Contact numbers do not match.');
      return;
    }

    setState(() => loading = true);
    try {
      final existing = await context.read<ApiClient>().findUserByContact(parsed);
      if (!mounted) return;
      if (existing != null && existing.uid.isNotEmpty) {
        _switchMode('signin');
        setState(() => error = 'This number is already registered. Sign in instead.');
        return;
      }
      setState(() => createStep = 'role');
    } catch (_) {
      if (mounted) setState(() => error = 'Could not check this number. Check your connection and try again.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _finishCreate() async {
    setState(() {
      error = '';
      loading = true;
    });
    try {
      await context.read<AuthController>().createAccount(
            displayName: _name.text,
            contactNumber: _contact.text,
            photoBytes: photoBytes,
            photoFilename: photo?.name,
            photoMime: photo?.mimeType,
            role: role,
          );
      if (!mounted) return;
      context.go(widget.nextPath);
    } catch (e) {
      if (!mounted) return;
      if (e is AuthException && e.code == 'exists') {
        _switchMode('signin');
      }
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  Future<void> _finishSignIn() async {
    setState(() {
      error = '';
      loading = true;
    });
    try {
      await context.read<AuthController>().signIn(_contact.text);
      if (!mounted) return;
      context.go(widget.nextPath);
    } catch (e) {
      if (!mounted) return;
      if (e is AuthException && e.code == 'not_found') {
        _switchMode('create');
      }
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  String get _heading {
    if (mode == 'signin') return 'Welcome back';
    if (createStep == 'role') return 'How will you use GemBook?';
    if (createStep == 'photo') return 'Add a profile photo';
    return 'Create your account';
  }

  String get _subtitle {
    if (mode == 'signin') return 'Enter the mobile number you registered with — no password needed.';
    if (createStep == 'role') return 'You can change this later from your profile.';
    if (createStep == 'photo') return 'Help dealers and buyers recognise you.';
    return 'Name and Sri Lankan mobile number. That’s your identity.';
  }

  IconData get _headerIcon {
    if (mode == 'signin') return Icons.phone_outlined;
    if (createStep == 'photo') return Icons.photo_camera_outlined;
    if (createStep == 'role') return Icons.storefront_outlined;
    return Icons.person_outline;
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    if (user != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go(widget.nextPath);
      });
    }

    return Center(
      child: SingleChildScrollView(
        padding: EdgeInsets.all(AppLayout.of(context).pagePadding),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.slate200),
              boxShadow: const [BoxShadow(color: Color(0x14000000), blurRadius: 24, offset: Offset(0, 8))],
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  color: AppColors.slate50,
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
                  child: Column(
                    children: [
                      _tabs(),
                      const SizedBox(height: 20),
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(_headerIcon, size: 28, color: AppColors.primary),
                      ),
                      const SizedBox(height: 16),
                      Text(_heading, textAlign: TextAlign.center, style: AppText.pageTitle()),
                      const SizedBox(height: 6),
                      Text(_subtitle, textAlign: TextAlign.center, style: AppText.pageSubtitle()),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: mode == 'signin'
                      ? _signIn()
                      : createStep == 'details'
                          ? _details()
                          : createStep == 'role'
                              ? _role()
                              : _photo(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _tabs() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Row(
        children: [
          Expanded(child: _tab('Create', mode == 'create', () => _switchMode('create'))),
          Expanded(child: _tab('Sign in', mode == 'signin', () => _switchMode('signin'))),
        ],
      ),
    );
  }

  Widget _tab(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label.toUpperCase(),
          textAlign: TextAlign.center,
          style: AppText.micro(
            weight: FontWeight.w800,
            letterSpacing: 1.2,
            color: active ? Colors.white : AppColors.slate500,
          ),
        ),
      ),
    );
  }

  Widget _details() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('NAME', style: AppText.section()),
        const SizedBox(height: 8),
        TextField(
          controller: _name,
          textCapitalization: TextCapitalization.words,
          decoration: _fieldDeco(Icons.person_outline, 'Your full name'),
        ),
        const SizedBox(height: 16),
        Text('CONTACT NUMBER', style: AppText.section()),
        const SizedBox(height: 8),
        TextField(
          controller: _contact,
          keyboardType: TextInputType.phone,
          onChanged: (v) => _setPhone(_contact, v),
          decoration: _fieldDeco(Icons.phone_outlined, '+94771234567'),
        ),
        const SizedBox(height: 16),
        Text('CONFIRM NUMBER', style: AppText.section()),
        const SizedBox(height: 8),
        TextField(
          controller: _contactConfirm,
          keyboardType: TextInputType.phone,
          onChanged: (v) => _setPhone(_contactConfirm, v),
          decoration: _fieldDeco(Icons.phone_outlined, '+94771234567'),
        ),
        if (error.isNotEmpty) ...[
          const SizedBox(height: 16),
          ErrorBanner(error),
        ],
        const SizedBox(height: 20),
        PrimaryButton(label: loading ? 'Checking...' : 'Continue', busy: loading, icon: Icons.arrow_forward, onPressed: _goRole),
        TextButton(
          onPressed: () => context.go('/'),
          child: Text('Keep browsing for now', style: AppText.caption(weight: FontWeight.w700)),
        ),
      ],
    );
  }

  Widget _role() {
    return Column(
      children: [
        _roleCard(
          selected: role == 'USER',
          icon: Icons.shopping_bag_outlined,
          title: 'Buyer',
          subtitle: 'Browse listings, chat with dealers, follow shops.',
          onTap: () => setState(() => role = 'USER'),
        ),
        const SizedBox(height: 12),
        _roleCard(
          selected: role == 'VENDOR',
          icon: Icons.storefront_outlined,
          title: 'Dealer',
          subtitle: 'Get a storefront and list gems on the marketplace.',
          onTap: () => setState(() => role = 'VENDOR'),
        ),
        if (error.isNotEmpty) ...[
          const SizedBox(height: 16),
          ErrorBanner(error),
        ],
        const SizedBox(height: 20),
        PrimaryButton(label: 'Continue', icon: Icons.arrow_forward, onPressed: () => setState(() => createStep = 'photo')),
        TextButton(
          onPressed: () => setState(() => createStep = 'details'),
          child: Text('Back', style: AppText.caption(weight: FontWeight.w700)),
        ),
      ],
    );
  }

  Widget _roleCard({
    required bool selected,
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Material(
      color: selected ? AppColors.primary.withValues(alpha: 0.05) : AppColors.slate50,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: selected ? AppColors.primary : AppColors.slate100, width: 2),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AppText.cardTitle()),
                    const SizedBox(height: 2),
                    Text(subtitle, style: AppText.caption()),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _photo() {
    return Column(
      children: [
        GestureDetector(
          onTap: () async {
            final file = await _picker.pickImage(source: ImageSource.gallery);
            if (file == null) return;
            final bytes = await file.readAsBytes();
            if (!mounted) return;
            setState(() {
              photo = file;
              photoBytes = bytes;
            });
          },
          child: CircleAvatar(
            radius: 52,
            backgroundColor: AppColors.slate100,
            backgroundImage: photoBytes != null ? MemoryImage(photoBytes!) : null,
            child: photoBytes == null
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.photo_camera_outlined, color: AppColors.slate400),
                      Text('UPLOAD', style: AppText.micro(weight: FontWeight.w700, letterSpacing: 1.2)),
                    ],
                  )
                : null,
          ),
        ),
        const SizedBox(height: 12),
        Text('Optional — you can add or change this later.', style: AppText.caption()),
        if (error.isNotEmpty) ...[const SizedBox(height: 16), ErrorBanner(error)],
        const SizedBox(height: 24),
        PrimaryButton(
          label: loading ? 'Creating account...' : 'Create account',
          busy: loading,
          icon: Icons.check,
          onPressed: _finishCreate,
        ),
        TextButton(
          onPressed: loading ? null : () => setState(() => createStep = 'role'),
          child: Text('Back', style: AppText.caption(weight: FontWeight.w700)),
        ),
      ],
    );
  }

  Widget _signIn() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('CONTACT NUMBER', style: AppText.section()),
        const SizedBox(height: 8),
        TextField(
          controller: _contact,
          keyboardType: TextInputType.phone,
          autofocus: true,
          onChanged: (v) => _setPhone(_contact, v),
          decoration: _fieldDeco(Icons.phone_outlined, '+94771234567'),
        ),
        if (error.isNotEmpty) ...[
          const SizedBox(height: 16),
          ErrorBanner(error),
        ],
        const SizedBox(height: 20),
        PrimaryButton(label: loading ? 'Signing in...' : 'Sign in', busy: loading, icon: Icons.arrow_forward, onPressed: _finishSignIn),
        TextButton(
          onPressed: () => _switchMode('create'),
          child: Text('New here? Create an account', style: AppText.caption(weight: FontWeight.w700)),
        ),
      ],
    );
  }

  InputDecoration _fieldDeco(IconData icon, String hint) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: AppColors.slate400),
      filled: true,
      fillColor: AppColors.slate50,
      contentPadding: const EdgeInsets.symmetric(vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.slate100, width: 2)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.slate100, width: 2)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
    );
  }
}
