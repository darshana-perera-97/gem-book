import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as p;

import '../config.dart';
import '../models/models.dart';
import '../utils/format.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({String? baseUrl, String? origin})
      : baseUrl = (baseUrl ?? kBackendUrl).replaceAll(RegExp(r'/$'), ''),
        origin = (origin ?? kOriginUrl).replaceAll(RegExp(r'/$'), '');

  final String baseUrl;
  final String origin;

  String media(String? url) => resolveMediaUrl(url, origin);

  Future<dynamic> _req(String path, {String method = 'GET', Object? body, bool form = false}) async {
    final uri = Uri.parse('$baseUrl$path');
    late http.Response res;
    final headers = <String, String>{};
    if (body != null && !form) headers['Content-Type'] = 'application/json';

    switch (method) {
      case 'POST':
        res = await http.post(uri, headers: headers, body: body is String || body is List<int> ? body : jsonEncode(body));
        break;
      case 'PATCH':
        res = await http.patch(uri, headers: headers, body: jsonEncode(body));
        break;
      case 'DELETE':
        res = await http.delete(uri, headers: headers);
        break;
      default:
        res = await http.get(uri, headers: headers);
    }

    final text = res.body;
    dynamic data;
    if (text.isNotEmpty) {
      try {
        data = jsonDecode(text);
      } catch (_) {
        data = null;
      }
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final msg = data is Map && data['error'] != null ? data['error'].toString() : 'Request failed (${res.statusCode})';
      throw ApiException(msg);
    }
    return data;
  }

  String _qs(Map<String, Object?> params) {
    final pairs = params.entries
        .where((e) => e.value != null && e.value.toString().isNotEmpty)
        .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value.toString())}');
    final s = pairs.join('&');
    return s.isEmpty ? '' : '?$s';
  }

  T? _one<T>(dynamic data, T Function(Map<String, dynamic>) parse) {
    if (data is Map<String, dynamic> && data['error'] == null && (data['id'] != null || data['uid'] != null)) {
      return parse(data);
    }
    return null;
  }

  List<T> _list<T>(dynamic data, T Function(Map<String, dynamic>) parse) {
    if (data is List) {
      return data.whereType<Map>().map((e) => parse(Map<String, dynamic>.from(e))).toList();
    }
    return const [];
  }

  Future<String> uploadFile(File file, {String? mimeType}) async {
    return uploadBytes(
      await file.readAsBytes(),
      filename: p.basename(file.path),
      mimeType: mimeType,
    );
  }

  Future<String> uploadBytes(List<int> bytes, {required String filename, String? mimeType}) async {
    final uri = Uri.parse('$baseUrl/upload');
    final req = http.MultipartRequest('POST', uri);
    final ext = p.extension(filename).toLowerCase();
    MediaType? type;
    if (mimeType != null && mimeType.contains('/')) {
      final parts = mimeType.split('/');
      type = MediaType(parts[0], parts[1]);
    } else if (['.jpg', '.jpeg'].contains(ext)) {
      type = MediaType('image', 'jpeg');
    } else if (ext == '.png') {
      type = MediaType('image', 'png');
    } else if (ext == '.webp') {
      type = MediaType('image', 'webp');
    } else if (ext == '.mp4') {
      type = MediaType('video', 'mp4');
    } else if (ext == '.webm') {
      type = MediaType('video', 'webm');
    } else if (ext == '.mov') {
      type = MediaType('video', 'quicktime');
    }
    req.files.add(http.MultipartFile.fromBytes(
      'file',
      bytes,
      filename: filename.isEmpty ? 'upload.bin' : filename,
      contentType: type,
    ));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    final data = res.body.isNotEmpty ? jsonDecode(res.body) : null;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw ApiException((data is Map && data['error'] != null) ? data['error'].toString() : 'Upload failed');
    }
    final url = data is Map ? data['url']?.toString() : null;
    if (url == null || url.isEmpty) throw ApiException('Upload failed');
    return url;
  }

  Future<UserProfile?> getUser(String uid) async {
    final data = await _req('/users/${Uri.encodeComponent(uid)}');
    return _one(data, UserProfile.fromJson);
  }

  Future<UserProfile?> findUserByContact(String contact) async {
    final data = await _req('/users${_qs({'contact': contact})}');
    return _one(data, UserProfile.fromJson);
  }

  Future<UserProfile> saveUser(Map<String, dynamic> data) async {
    final res = await _req('/users', method: 'POST', body: data);
    return UserProfile.fromJson(Map<String, dynamic>.from(res as Map));
  }

  Future<VendorProfile?> getVendor(String id) async {
    final data = await _req('/vendors/${Uri.encodeComponent(id)}');
    return _one(data, VendorProfile.fromJson);
  }

  Future<List<VendorProfile>> getVendorsByIds(List<String> ids) async {
    if (ids.isEmpty) return [];
    final data = await _req('/vendors${_qs({'ids': ids.join(',')})}');
    return _list(data, VendorProfile.fromJson);
  }

  Future<List<VendorProfile>> listVendors([int limit = 20, int offset = 0]) async {
    final data = await _req('/vendors${_qs({'limit': limit, 'offset': offset})}');
    return _list(data, VendorProfile.fromJson);
  }

  Future<VendorProfile> saveVendor(Map<String, dynamic> data) async {
    final res = await _req('/vendors', method: 'POST', body: data);
    return VendorProfile.fromJson(Map<String, dynamic>.from(res as Map));
  }

  Future<List<GemListing>> listListings([int limit = 20, int offset = 0]) async {
    final data = await _req('/listings${_qs({'limit': limit, 'offset': offset})}');
    return _list(data, GemListing.fromJson);
  }

  Future<GemListing?> getListing(String id) async {
    final data = await _req('/listings/${Uri.encodeComponent(id)}');
    return _one(data, GemListing.fromJson);
  }

  Future<List<GemListing>> listingsByVendor(String vendorId, [int limit = 48]) async {
    final data = await _req('/listings${_qs({'vendorId': vendorId, 'limit': limit})}');
    return _list(data, GemListing.fromJson);
  }

  Future<GemListing> createListing(Map<String, dynamic> data) async {
    final res = await _req('/listings', method: 'POST', body: data);
    return GemListing.fromJson(Map<String, dynamic>.from(res as Map));
  }

  Future<List<SocialPost>> listPosts([int limit = 10, int offset = 0]) async {
    final data = await _req('/posts${_qs({'limit': limit, 'offset': offset})}');
    return _list(data, SocialPost.fromJson);
  }

  Future<List<SocialPost>> postsByAuthor(String authorId, [int limit = 24]) async {
    final data = await _req('/posts${_qs({'authorId': authorId, 'limit': limit})}');
    return _list(data, SocialPost.fromJson);
  }

  Future<SocialPost> createPost(Map<String, dynamic> data) async {
    final res = await _req('/posts', method: 'POST', body: data);
    return SocialPost.fromJson(Map<String, dynamic>.from(res as Map));
  }

  Future<int> likePost(String postId, String uid, bool liked) async {
    final res = await _req('/like', method: 'POST', body: {'postId': postId, 'uid': uid, 'liked': liked});
    return (res is Map ? res['likesCount'] : 0) is num ? (res['likesCount'] as num).toInt() : 0;
  }

  Future<List<Comment>> listComments(String postId, [int limit = 20]) async {
    final data = await _req('/comments${_qs({'postId': postId, 'limit': limit})}');
    return _list(data, Comment.fromJson);
  }

  Future<Comment> createComment(Map<String, dynamic> data) async {
    final res = await _req('/comments', method: 'POST', body: data);
    return Comment.fromJson(Map<String, dynamic>.from(res as Map));
  }

  Future<List<Review>> listReviews(String targetId, [int limit = 20]) async {
    final data = await _req('/reviews${_qs({'targetId': targetId, 'limit': limit})}');
    return _list(data, Review.fromJson);
  }

  Future<Review> createReview(Map<String, dynamic> data) async {
    final res = await _req('/reviews', method: 'POST', body: data);
    return Review.fromJson(Map<String, dynamic>.from(res as Map));
  }

  Future<void> followVendor(String uid, String vendorId, bool following) async {
    await _req('/follow', method: 'POST', body: {'uid': uid, 'vendorId': vendorId, 'following': following});
  }

  Future<List<Conversation>> listConversations(String userId) async {
    final data = await _req('/conversations${_qs({'userId': userId})}');
    return _list(data, Conversation.fromJson);
  }

  Future<String> startConversation({
    required Map<String, dynamic> currentUser,
    required Map<String, dynamic> otherUser,
  }) async {
    final res = await _req('/conversations', method: 'POST', body: {
      'currentUser': currentUser,
      'otherUser': otherUser,
    });
    return (res as Map)['id'].toString();
  }

  Future<List<Message>> listMessages(String conversationId) async {
    final data = await _req('/messages${_qs({'conversationId': conversationId})}');
    return _list(data, Message.fromJson);
  }

  Future<Message> sendMessage(Map<String, dynamic> data) async {
    final res = await _req('/messages', method: 'POST', body: data);
    return Message.fromJson(Map<String, dynamic>.from(res as Map));
  }

  Future<void> markConversationRead(String conversationId, String uid) async {
    await _req('/messages/${Uri.encodeComponent(conversationId)}', method: 'PATCH', body: {'uid': uid});
  }

  Future<VendorProfile> ensureVendorProfile(UserProfile profile) async {
    final existing = await getVendor(profile.uid);
    if (existing != null && existing.id.isNotEmpty) return existing;
    return saveVendor({
      'id': profile.uid,
      'userId': profile.uid,
      'companyName': profile.displayName.isNotEmpty ? profile.displayName : 'Independent Dealer',
      'logo': profile.photoURL,
      'description': profile.bio,
      'location': 'Sri Lanka',
      'rating': 0,
      'reviewCount': 0,
      'followersCount': 0,
      'verified': false,
      'verificationLevel': 'NONE',
      'contactEmail': profile.email ?? '',
      'phone': profile.phone ?? profile.contactNumber,
      'createdAt': DateTime.now().toIso8601String(),
    });
  }
}
