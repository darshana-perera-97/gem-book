import 'package:intl/intl.dart';

String resolveMediaUrl(String? url, String origin) {
  if (url == null || url.isEmpty) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('file:')) {
    return url;
  }
  if (url.startsWith('/')) return '$origin$url';
  return '$origin/$url';
}

bool isVideoUrl(String url) {
  return RegExp(r'\.(mp4|webm|mov|m4v|ogg)(\?|#|$)', caseSensitive: false).hasMatch(url);
}

String formatCurrency(num amount, [String currency = 'LKR']) {
  if (amount >= 1000000) {
    final millions = amount / 1000000;
    final symbol = currency == 'LKR' ? 'Rs.' : currency;
    final value = millions % 1 == 0 ? millions.toStringAsFixed(0) : millions.toStringAsFixed(1);
    return '$symbol ${value}M';
  }
  try {
    return NumberFormat.currency(locale: 'en_LK', symbol: currency == 'LKR' ? 'Rs.' : '$currency ', decimalDigits: 0)
        .format(amount);
  } catch (_) {
    return 'Rs. ${amount.round()}';
  }
}

String formatRelative(dynamic createdAt) {
  final date = parseDate(createdAt);
  if (date == null) return 'just now';
  final diff = DateTime.now().difference(date);
  if (diff.inSeconds < 45) return 'just now';
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inMinutes < 60) {
    final n = diff.inMinutes;
    return n == 1 ? '1 minute ago' : '$n minutes ago';
  }
  if (diff.inHours < 24) {
    final n = diff.inHours;
    return n == 1 ? '1 hour ago' : '$n hours ago';
  }
  if (diff.inDays < 30) {
    final n = diff.inDays;
    return n == 1 ? '1 day ago' : '$n days ago';
  }
  if (diff.inDays < 365) {
    final n = (diff.inDays / 30).floor();
    return n == 1 ? '1 month ago' : '$n months ago';
  }
  final n = (diff.inDays / 365).floor();
  return n == 1 ? '1 year ago' : '$n years ago';
}

DateTime? parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  if (value is String) return DateTime.tryParse(value);
  if (value is Map && value['seconds'] != null) {
    final seconds = value['seconds'];
    if (seconds is num) {
      return DateTime.fromMillisecondsSinceEpoch(seconds.toInt() * 1000);
    }
  }
  return null;
}

String formatClock(dynamic value, [String pattern = 'HH:mm']) {
  final d = parseDate(value);
  if (d == null) return '';
  return DateFormat(pattern).format(d.toLocal());
}

String formatFollowers(num count) {
  if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
  return count.toString();
}
