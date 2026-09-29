// Sri Lankan mobile numbers. Stored as +947XXXXXXXX.

String? parseLkMobile(String raw) {
  var n = raw.replaceAll(RegExp(r'\D'), '');
  if (n.startsWith('94')) n = n.substring(2);
  if (n.startsWith('0')) n = n.substring(1);
  if (!RegExp(r'^7\d{8}$').hasMatch(n)) return null;
  return '+94$n';
}

String formatLkMobileInput(String raw) {
  var n = raw.replaceAll(RegExp(r'[^\d+]'), '');
  if (n.startsWith('+')) {
    n = '+${n.substring(1).replaceAll(RegExp(r'\D'), '')}';
  } else {
    n = n.replaceAll(RegExp(r'\D'), '');
  }
  if (n.startsWith('+94')) {
    if (n.length > 12) n = n.substring(0, 12);
  } else if (n.startsWith('94')) {
    if (n.length > 11) n = n.substring(0, 11);
  } else if (n.length > 10) {
    n = n.substring(0, 10);
  }
  return n;
}

String displayLkMobile(String e164) {
  final parsed = parseLkMobile(e164);
  if (parsed == null) return e164;
  final rest = parsed.substring(3);
  return '+94 ${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5)}';
}
