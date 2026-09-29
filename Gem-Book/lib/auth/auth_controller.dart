import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../api/api_client.dart';
import '../config.dart';
import '../models/models.dart';
import '../utils/phone.dart';

class AuthException implements Exception {
  final String code;
  final String message;
  AuthException(this.code, this.message);
  @override
  String toString() => message;
}

class AuthController extends ChangeNotifier {
  AuthController(this.api);

  final ApiClient api;
  UserProfile? user;
  bool loading = true;

  bool get isVerified => user != null;

  String _requireMobile(String raw) {
    final contact = parseLkMobile(raw);
    if (contact == null) {
      throw AuthException('invalid', 'Please enter a valid Sri Lankan mobile number.');
    }
    return contact;
  }

  Future<void> restore() async {
    loading = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final uid = prefs.getString(kStorageUidKey);
      if (uid == null || uid.isEmpty) {
        user = null;
        return;
      }
      final profile = await api.getUser(uid);
      if (profile != null && profile.uid.isNotEmpty) {
        user = profile;
      } else {
        await prefs.remove(kStorageUidKey);
        user = null;
      }
    } catch (_) {
      // Keep going as a guest if the session cannot be restored.
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _persist(UserProfile profile) async {
    user = profile;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(kStorageUidKey, profile.uid);
    notifyListeners();
  }

  Future<UserProfile> createAccount({
    required String displayName,
    required String contactNumber,
    List<int>? photoBytes,
    String? photoFilename,
    String? photoMime,
    String role = 'USER',
  }) async {
    final name = displayName.trim();
    if (name.isEmpty) throw AuthException('invalid', 'Please enter your name.');
    final contact = _requireMobile(contactNumber);

    UserProfile? existing;
    try {
      existing = await api.findUserByContact(contact);
    } catch (_) {
      throw ApiException('Could not check this number. Check your connection and try again.');
    }
    if (existing != null && existing.uid.isNotEmpty) {
      throw AuthException('exists', 'This number is already registered. Sign in instead.');
    }

    final uid = const Uuid().v4();
    var photoURL = kDefaultAvatar;
    if (photoBytes != null && photoBytes.isNotEmpty) {
      photoURL = await api.uploadBytes(
        photoBytes,
        filename: (photoFilename == null || photoFilename.isEmpty) ? 'photo.jpg' : photoFilename,
        mimeType: photoMime,
      );
    }

    final now = DateTime.now().toIso8601String();
    final saved = await api.saveUser({
      'uid': uid,
      'displayName': name,
      'contactNumber': contact,
      'phone': contact,
      'photoURL': photoURL,
      'role': role == 'VENDOR' ? 'VENDOR' : 'USER',
      'followersCount': 0,
      'followingCount': 0,
      'following': <String>[],
      'createdAt': now,
      'lastActive': now,
    });
    if (saved.role == 'VENDOR') {
      await api.ensureVendorProfile(saved);
    }
    await _persist(saved);
    return saved;
  }

  Future<UserProfile> signIn(String contactNumber) async {
    final contact = _requireMobile(contactNumber);
    UserProfile? existing;
    try {
      existing = await api.findUserByContact(contact);
    } catch (_) {
      throw ApiException('Could not look up this number. Check your connection and try again.');
    }
    if (existing == null || existing.uid.isEmpty) {
      throw AuthException('not_found', 'No account found for this number. Create one?');
    }
    await _persist(existing);
    return existing;
  }

  Future<UserProfile?> updateProfile(
    Map<String, dynamic> partial, {
    List<int>? photoBytes,
    String? photoFilename,
    String? photoMime,
  }) async {
    final current = user;
    if (current == null) return null;
    final patch = {...partial, 'uid': current.uid};
    if (photoBytes != null && photoBytes.isNotEmpty) {
      patch['photoURL'] = await api.uploadBytes(
        photoBytes,
        filename: (photoFilename == null || photoFilename.isEmpty) ? 'photo.jpg' : photoFilename,
        mimeType: photoMime,
      );
    }
    final saved = await api.saveUser(patch);
    await _persist(UserProfile(
      uid: current.uid,
      displayName: saved.displayName.isNotEmpty ? saved.displayName : current.displayName,
      contactNumber: saved.contactNumber ?? current.contactNumber,
      email: saved.email ?? current.email,
      phone: saved.phone ?? current.phone,
      photoURL: saved.photoURL ?? current.photoURL,
      role: saved.role.isNotEmpty ? saved.role : current.role,
      bio: saved.bio ?? current.bio,
      followersCount: saved.followersCount,
      followingCount: saved.followingCount,
      following: saved.following.isNotEmpty ? saved.following : current.following,
      createdAt: current.createdAt,
      lastActive: saved.lastActive.isNotEmpty ? saved.lastActive : current.lastActive,
    ));
    return user;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(kStorageUidKey);
    user = null;
    notifyListeners();
  }
}
