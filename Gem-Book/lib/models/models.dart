class UserProfile {
  final String uid;
  final String displayName;
  final String? contactNumber;
  final String? email;
  final String? phone;
  final String? photoURL;
  final String role;
  final String? bio;
  final int followersCount;
  final int followingCount;
  final List<String> following;
  final String createdAt;
  final String lastActive;

  const UserProfile({
    required this.uid,
    required this.displayName,
    this.contactNumber,
    this.email,
    this.phone,
    this.photoURL,
    this.role = 'USER',
    this.bio,
    this.followersCount = 0,
    this.followingCount = 0,
    this.following = const [],
    this.createdAt = '',
    this.lastActive = '',
  });

  bool get isVendor => role == 'VENDOR';
  bool get isAdmin => role == 'ADMIN';

  UserProfile copyWith({
    String? displayName,
    String? contactNumber,
    String? email,
    String? phone,
    String? photoURL,
    String? role,
    String? bio,
    int? followersCount,
    int? followingCount,
    List<String>? following,
  }) {
    return UserProfile(
      uid: uid,
      displayName: displayName ?? this.displayName,
      contactNumber: contactNumber ?? this.contactNumber,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      photoURL: photoURL ?? this.photoURL,
      role: role ?? this.role,
      bio: bio ?? this.bio,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      following: following ?? this.following,
      createdAt: createdAt,
      lastActive: lastActive,
    );
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      uid: json['uid']?.toString() ?? '',
      displayName: json['displayName']?.toString() ?? '',
      contactNumber: json['contactNumber']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      photoURL: json['photoURL']?.toString(),
      role: json['role']?.toString() ?? 'USER',
      bio: json['bio']?.toString(),
      followersCount: _asInt(json['followersCount']),
      followingCount: _asInt(json['followingCount']),
      following: _asStringList(json['following']),
      createdAt: json['createdAt']?.toString() ?? '',
      lastActive: json['lastActive']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'uid': uid,
        'displayName': displayName,
        'contactNumber': contactNumber,
        'email': email,
        'phone': phone,
        'photoURL': photoURL,
        'role': role,
        'bio': bio,
        'followersCount': followersCount,
        'followingCount': followingCount,
        'following': following,
        'createdAt': createdAt,
        'lastActive': lastActive,
      };
}

class VendorProfile {
  final String id;
  final String userId;
  final String companyName;
  final String? logo;
  final String? coverImage;
  final String? description;
  final String location;
  final double rating;
  final int reviewCount;
  final int followersCount;
  final bool verified;
  final String verificationLevel;
  final String contactEmail;
  final String? phone;
  final String? website;
  final String createdAt;

  const VendorProfile({
    required this.id,
    required this.userId,
    required this.companyName,
    this.logo,
    this.coverImage,
    this.description,
    this.location = 'Sri Lanka',
    this.rating = 0,
    this.reviewCount = 0,
    this.followersCount = 0,
    this.verified = false,
    this.verificationLevel = 'NONE',
    this.contactEmail = '',
    this.phone,
    this.website,
    this.createdAt = '',
  });

  factory VendorProfile.fromJson(Map<String, dynamic> json) {
    return VendorProfile(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? json['id']?.toString() ?? '',
      companyName: json['companyName']?.toString() ?? '',
      logo: json['logo']?.toString(),
      coverImage: json['coverImage']?.toString(),
      description: json['description']?.toString(),
      location: json['location']?.toString() ?? 'Sri Lanka',
      rating: _asDouble(json['rating']),
      reviewCount: _asInt(json['reviewCount']),
      followersCount: _asInt(json['followersCount']),
      verified: json['verified'] == true,
      verificationLevel: json['verificationLevel']?.toString() ?? 'NONE',
      contactEmail: json['contactEmail']?.toString() ?? '',
      phone: json['phone']?.toString(),
      website: json['website']?.toString(),
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'companyName': companyName,
        'logo': logo,
        'coverImage': coverImage,
        'description': description,
        'location': location,
        'rating': rating,
        'reviewCount': reviewCount,
        'followersCount': followersCount,
        'verified': verified,
        'verificationLevel': verificationLevel,
        'contactEmail': contactEmail,
        'phone': phone,
        'website': website,
        'createdAt': createdAt,
      };
}

class GemListing {
  final String id;
  final String vendorId;
  final String title;
  final String description;
  final double price;
  final String currency;
  final List<String> images;
  final String status;
  final bool featured;
  final dynamic createdAt;

  const GemListing({
    required this.id,
    required this.vendorId,
    required this.title,
    required this.description,
    required this.price,
    this.currency = 'LKR',
    this.images = const [],
    this.status = 'ACTIVE',
    this.featured = false,
    this.createdAt,
  });

  bool get isSold => status == 'SOLD';

  factory GemListing.fromJson(Map<String, dynamic> json) {
    return GemListing(
      id: json['id']?.toString() ?? '',
      vendorId: json['vendorId']?.toString() ?? '',
      title: (json['title'] ?? json['name'])?.toString() ?? 'Untitled Gem',
      description: json['description']?.toString() ?? '',
      price: _asDouble(json['price']),
      currency: json['currency']?.toString() ?? 'LKR',
      images: _asStringList(json['images']),
      status: json['status']?.toString() ?? 'ACTIVE',
      featured: json['featured'] == true,
      createdAt: json['createdAt'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'vendorId': vendorId,
        'title': title,
        'description': description,
        'price': price,
        'currency': currency,
        'images': images,
        'status': status,
        'featured': featured,
        'createdAt': createdAt,
      };
}

class SocialPost {
  final String id;
  final String authorId;
  final String authorName;
  final String? authorAvatar;
  final String authorType;
  final String content;
  final List<String> media;
  final int likesCount;
  final List<String> likes;
  final int commentsCount;
  final int sharesCount;
  final double averageRating;
  final String type;
  final dynamic createdAt;

  const SocialPost({
    required this.id,
    required this.authorId,
    required this.authorName,
    this.authorAvatar,
    this.authorType = 'USER',
    required this.content,
    this.media = const [],
    this.likesCount = 0,
    this.likes = const [],
    this.commentsCount = 0,
    this.sharesCount = 0,
    this.averageRating = 0,
    this.type = 'DISCUSSION',
    this.createdAt,
  });

  factory SocialPost.fromJson(Map<String, dynamic> json) {
    return SocialPost(
      id: json['id']?.toString() ?? '',
      authorId: json['authorId']?.toString() ?? '',
      authorName: json['authorName']?.toString() ?? '',
      authorAvatar: json['authorAvatar']?.toString(),
      authorType: json['authorType']?.toString() ?? 'USER',
      content: json['content']?.toString() ?? '',
      media: _asStringList(json['media']),
      likesCount: _asInt(json['likesCount']),
      likes: _asStringList(json['likes']),
      commentsCount: _asInt(json['commentsCount']),
      sharesCount: _asInt(json['sharesCount']),
      averageRating: _asDouble(json['averageRating']),
      type: json['type']?.toString() ?? 'DISCUSSION',
      createdAt: json['createdAt'],
    );
  }
}

class Comment {
  final String id;
  final String postId;
  final String authorId;
  final String authorName;
  final String? authorAvatar;
  final String content;
  final dynamic createdAt;

  const Comment({
    required this.id,
    required this.postId,
    required this.authorId,
    required this.authorName,
    this.authorAvatar,
    required this.content,
    this.createdAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id']?.toString() ?? '',
      postId: json['postId']?.toString() ?? '',
      authorId: json['authorId']?.toString() ?? '',
      authorName: json['authorName']?.toString() ?? '',
      authorAvatar: json['authorAvatar']?.toString(),
      content: json['content']?.toString() ?? '',
      createdAt: json['createdAt'],
    );
  }
}

class Review {
  final String id;
  final String targetId;
  final String authorId;
  final String authorName;
  final String? authorAvatar;
  final int rating;
  final String content;
  final dynamic createdAt;

  const Review({
    required this.id,
    required this.targetId,
    required this.authorId,
    required this.authorName,
    this.authorAvatar,
    required this.rating,
    required this.content,
    this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id']?.toString() ?? '',
      targetId: json['targetId']?.toString() ?? '',
      authorId: json['authorId']?.toString() ?? '',
      authorName: json['authorName']?.toString() ?? '',
      authorAvatar: json['authorAvatar']?.toString(),
      rating: _asInt(json['rating']),
      content: json['content']?.toString() ?? '',
      createdAt: json['createdAt'],
    );
  }
}

class Conversation {
  final String id;
  final List<String> participants;
  final Map<String, String> participantNames;
  final Map<String, String> participantAvatars;
  final String? lastMessage;
  final String? lastSenderId;
  final dynamic lastUpdatedAt;
  final Map<String, int> unreadCount;

  const Conversation({
    required this.id,
    required this.participants,
    this.participantNames = const {},
    this.participantAvatars = const {},
    this.lastMessage,
    this.lastSenderId,
    this.lastUpdatedAt,
    this.unreadCount = const {},
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id']?.toString() ?? '',
      participants: _asStringList(json['participants']),
      participantNames: _asStringMap(json['participantNames']),
      participantAvatars: _asStringMap(json['participantAvatars']),
      lastMessage: json['lastMessage']?.toString(),
      lastSenderId: json['lastSenderId']?.toString(),
      lastUpdatedAt: json['lastUpdatedAt'],
      unreadCount: _asIntMap(json['unreadCount']),
    );
  }
}

class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String senderName;
  final String text;
  final dynamic createdAt;
  final List<String> readBy;

  const Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderName,
    required this.text,
    this.createdAt,
    this.readBy = const [],
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id']?.toString() ?? '',
      conversationId: json['conversationId']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? '',
      senderName: json['senderName']?.toString() ?? '',
      text: json['text']?.toString() ?? '',
      createdAt: json['createdAt'],
      readBy: _asStringList(json['readBy']),
    );
  }
}

int _asInt(dynamic v) {
  if (v is int) return v;
  if (v is num) return v.toInt();
  return int.tryParse(v?.toString() ?? '') ?? 0;
}

double _asDouble(dynamic v) {
  if (v is double) return v;
  if (v is num) return v.toDouble();
  return double.tryParse(v?.toString() ?? '') ?? 0;
}

List<String> _asStringList(dynamic v) {
  if (v is List) return v.map((e) => e.toString()).toList();
  return const [];
}

Map<String, String> _asStringMap(dynamic v) {
  if (v is Map) {
    return v.map((k, val) => MapEntry(k.toString(), val?.toString() ?? ''));
  }
  return const {};
}

Map<String, int> _asIntMap(dynamic v) {
  if (v is Map) {
    return v.map((k, val) => MapEntry(k.toString(), _asInt(val)));
  }
  return const {};
}
