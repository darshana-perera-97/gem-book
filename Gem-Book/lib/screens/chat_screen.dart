import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../auth/auth_controller.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import '../theme/app_text.dart';
import '../utils/format.dart';
import '../widgets/remote_image.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key, this.conversationId});
  final String? conversationId;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<Conversation> conversations = [];
  List<Message> messages = [];
  String? activeId;
  bool loading = true;
  bool sending = false;
  String search = '';
  final _text = TextEditingController();
  final _scroll = ScrollController();
  Timer? _inboxTimer;
  Timer? _msgTimer;
  int lastCount = 0;

  @override
  void initState() {
    super.initState();
    activeId = widget.conversationId;
    _refreshInbox();
    _inboxTimer = Timer.periodic(const Duration(seconds: 15), (_) => _refreshInbox());
    if (activeId != null) _startMessagePoll();
  }

  @override
  void didUpdateWidget(covariant ChatScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.conversationId != oldWidget.conversationId) {
      activeId = widget.conversationId;
      lastCount = 0;
      _startMessagePoll();
    }
  }

  void _startMessagePoll() {
    _msgTimer?.cancel();
    _loadMessages();
    if (activeId != null) {
      _msgTimer = Timer.periodic(const Duration(seconds: 4), (_) => _loadMessages());
    }
  }

  Future<void> _refreshInbox() async {
    final user = context.read<AuthController>().user;
    if (user == null) {
      setState(() => loading = false);
      return;
    }
    try {
      final rows = await context.read<ApiClient>().listConversations(user.uid);
      if (mounted) setState(() { conversations = rows; loading = false; });
    } catch (_) {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _loadMessages() async {
    final id = activeId;
    final user = context.read<AuthController>().user;
    if (id == null || user == null) {
      setState(() => messages = []);
      return;
    }
    try {
      final rows = await context.read<ApiClient>().listMessages(id);
      if (!mounted) return;
      setState(() => messages = rows);
      if (rows.length != lastCount) {
        lastCount = rows.length;
        context.read<ApiClient>().markConversationRead(id, user.uid);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
        });
      }
    } catch (_) {}
  }

  Future<void> _send() async {
    final text = _text.text.trim();
    final id = activeId;
    final user = context.read<AuthController>().user;
    if (text.isEmpty || id == null || user == null || sending) return;
    _text.clear();
    setState(() => sending = true);
    try {
      final saved = await context.read<ApiClient>().sendMessage({
        'conversationId': id,
        'senderId': user.uid,
        'senderName': user.displayName,
        'text': text,
      });
      setState(() => messages = [...messages, saved]);
      _refreshInbox();
    } catch (_) {
      _text.text = text;
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  @override
  void dispose() {
    _inboxTimer?.cancel();
    _msgTimer?.cancel();
    _text.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    if (user == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(24)),
                child: const Icon(Icons.chat_bubble_outline, size: 40, color: AppColors.primary),
              ),
              const SizedBox(height: 24),
              Text('Your Messages', style: AppText.pageTitle()),
              const SizedBox(height: 8),
              Text('Set up a quick profile to message dealers and buyers.', textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.slate500)),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () => context.go('/login?next=/messages'),
                style: FilledButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14)),
                child: const Text('Get Started'),
              ),
            ],
          ),
        ),
      );
    }

    final showingChat = activeId != null;
    final layout = AppLayout.of(context);
    final pad = layout.pagePadding;

    Widget pane(Widget child) => Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.gray100),
          ),
          clipBehavior: Clip.antiAlias,
          child: child,
        );

    if (layout.splitPane) {
      return Padding(
        padding: EdgeInsets.all(pad),
        child: Row(
          children: [
            SizedBox(width: 320, child: pane(_inbox(user))),
            const SizedBox(width: 12),
            Expanded(
              child: pane(
                showingChat
                    ? _thread(user, showBack: false)
                    : Center(child: Text('Select a conversation', style: AppText.caption())),
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: EdgeInsets.all(pad),
      child: pane(showingChat ? _thread(user) : _inbox(user)),
    );
  }

  Widget _inbox(UserProfile user) {
    final q = search.toLowerCase();
    final filtered = conversations.where((c) {
      if (q.isEmpty) return true;
      final otherId = c.participants.firstWhere((p) => p != user.uid, orElse: () => '');
      final name = c.participantNames[otherId] ?? '';
      return name.toLowerCase().contains(q) || (c.lastMessage ?? '').toLowerCase().contains(q);
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Messages', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              TextField(
                onChanged: (v) => setState(() => search = v),
                decoration: InputDecoration(
                  hintText: 'Search conversations...',
                  prefixIcon: const Icon(Icons.search, size: 16),
                  filled: true,
                  fillColor: AppColors.gray100,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(conversations.isEmpty ? 'No conversations yet.' : 'No matches.', style: GoogleFonts.inter(color: AppColors.gray500)),
                          if (conversations.isEmpty)
                            TextButton(onPressed: () => context.go('/vendors'), child: const Text('Find a dealer to message')),
                        ],
                      ),
                    )
                  : ListView.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, _) => const Divider(height: 1, color: AppColors.slate50),
                      itemBuilder: (_, i) {
                        final conv = filtered[i];
                        final otherId = conv.participants.firstWhere((p) => p != user.uid, orElse: () => '');
                        final name = conv.participantNames[otherId] ?? 'User';
                        final avatar = conv.participantAvatars[otherId];
                        final unread = conv.unreadCount[user.uid] ?? 0;
                        return ListTile(
                          onTap: () {
                            setState(() { activeId = conv.id; lastCount = 0; });
                            context.go('/messages?c=${conv.id}');
                            _startMessagePoll();
                          },
                          leading: Stack(
                            children: [
                              ClipOval(child: SizedBox(width: 48, height: 48, child: avatar != null && avatar.isNotEmpty ? RemoteImage(url: avatar) : const ColoredBox(color: Color(0x1ACC10FE), child: Icon(Icons.person, color: AppColors.primary)))),
                              if (unread > 0)
                                Positioned(
                                  right: 0,
                                  child: CircleAvatar(
                                    radius: 8,
                                    backgroundColor: AppColors.primary,
                                    child: Text('$unread', style: const TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold)),
                                  ),
                                ),
                            ],
                          ),
                          title: Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                          subtitle: Text(
                            '${conv.lastSenderId == user.uid ? 'You: ' : ''}${conv.lastMessage ?? 'Start a conversation'}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(fontSize: 12, color: unread > 0 ? AppColors.gray900 : AppColors.gray500, fontWeight: unread > 0 ? FontWeight.w500 : FontWeight.w400),
                          ),
                          trailing: Text(formatClock(conv.lastUpdatedAt), style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray400)),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  Widget _thread(UserProfile user, {bool showBack = true}) {
    final conv = conversations.cast<Conversation?>().firstWhere((c) => c!.id == activeId, orElse: () => null);
    final otherId = conv?.participants.firstWhere((p) => p != user.uid, orElse: () => '');
    final name = (otherId != null ? conv?.participantNames[otherId] : null) ?? 'Conversation';
    final avatar = otherId != null ? conv?.participantAvatars[otherId] : null;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              if (showBack)
                IconButton(
                  onPressed: () {
                    setState(() => activeId = null);
                    context.go('/messages');
                  },
                  icon: const Icon(Icons.arrow_back),
                ),
              ClipOval(child: SizedBox(width: 40, height: 40, child: avatar != null && avatar.isNotEmpty ? RemoteImage(url: avatar) : const ColoredBox(color: Color(0x1ACC10FE), child: Icon(Icons.person, color: AppColors.primary)))),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14)),
                    Text('GEMBOOK CHAT', style: GoogleFonts.inter(fontSize: 10, color: AppColors.slate400, letterSpacing: 0.8)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: ListView.builder(
            controller: _scroll,
            padding: const EdgeInsets.all(16),
            itemCount: messages.isEmpty ? 1 : messages.length,
            itemBuilder: (_, i) {
              if (messages.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.only(top: 32),
                  child: Text('Say hello 👋 — this is the start of your conversation.', textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400)),
                );
              }
              final msg = messages[i];
              final isMe = msg.senderId == user.uid;
              return Align(
                alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * (AppLayout.of(context).splitPane ? 0.35 : 0.7)),
                  decoration: BoxDecoration(
                    color: isMe ? AppColors.primary : Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isMe ? 16 : 0),
                      bottomRight: Radius.circular(isMe ? 0 : 16),
                    ),
                    border: isMe ? null : Border.all(color: AppColors.gray100),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(msg.text, style: GoogleFonts.inter(fontSize: 14, color: isMe ? Colors.white : AppColors.slate800, height: 1.4)),
                      const SizedBox(height: 4),
                      Text(formatClock(msg.createdAt), style: GoogleFonts.inter(fontSize: 10, color: isMe ? Colors.white70 : AppColors.gray400)),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const Divider(height: 1),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _text,
                  decoration: InputDecoration(
                    hintText: 'Type your message...',
                    filled: true,
                    fillColor: AppColors.gray100,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  onSubmitted: (_) => _send(),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: sending ? null : _send,
                style: IconButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                icon: sending ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.send),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
