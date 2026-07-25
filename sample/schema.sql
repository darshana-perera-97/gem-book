-- GemBook — MySQL schema for cPanel shared hosting.
-- Import this once via phpMyAdmin (Import tab) into your database.
-- JSON-shaped fields are stored as LONGTEXT for maximum MySQL/MariaDB compatibility.
-- Timestamps are stored as epoch milliseconds (BIGINT) for reliable ordering.

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `uid` VARCHAR(64) NOT NULL PRIMARY KEY,
  `displayName` VARCHAR(160),
  `contactNumber` VARCHAR(48),
  `phone` VARCHAR(48),
  `email` VARCHAR(160),
  `photoURL` LONGTEXT,
  `role` VARCHAR(16) DEFAULT 'USER',
  `bio` TEXT,
  `followersCount` INT DEFAULT 0,
  `followingCount` INT DEFAULT 0,
  `following` LONGTEXT,
  `vendorStatus` VARCHAR(24),
  `seeded` TINYINT DEFAULT 0,
  `createdAt` BIGINT DEFAULT 0,
  `lastActive` BIGINT DEFAULT 0,
  KEY `idx_users_contact` (`contactNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `vendors` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(64),
  `companyName` VARCHAR(200),
  `logo` LONGTEXT,
  `coverImage` LONGTEXT,
  `description` TEXT,
  `location` VARCHAR(120),
  `rating` FLOAT DEFAULT 0,
  `reviewCount` INT DEFAULT 0,
  `followersCount` INT DEFAULT 0,
  `verified` TINYINT DEFAULT 0,
  `verificationLevel` VARCHAR(16) DEFAULT 'NONE',
  `contactEmail` VARCHAR(160),
  `phone` VARCHAR(48),
  `website` VARCHAR(200),
  `seeded` TINYINT DEFAULT 0,
  `createdAt` BIGINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `listings` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `vendorId` VARCHAR(64),
  `title` VARCHAR(200),
  `description` TEXT,
  `price` DOUBLE DEFAULT 0,
  `currency` VARCHAR(8) DEFAULT 'LKR',
  `images` LONGTEXT,
  `status` VARCHAR(16) DEFAULT 'ACTIVE',
  `featured` TINYINT DEFAULT 0,
  `seeded` TINYINT DEFAULT 0,
  `createdAt` BIGINT DEFAULT 0,
  KEY `idx_listings_vendor` (`vendorId`),
  KEY `idx_listings_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `posts` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `authorId` VARCHAR(64),
  `authorName` VARCHAR(160),
  `authorAvatar` LONGTEXT,
  `authorType` VARCHAR(16) DEFAULT 'USER',
  `content` TEXT,
  `media` LONGTEXT,
  `likesCount` INT DEFAULT 0,
  `likes` LONGTEXT,
  `ratingsCount` INT DEFAULT 0,
  `averageRating` FLOAT DEFAULT 0,
  `commentsCount` INT DEFAULT 0,
  `sharesCount` INT DEFAULT 0,
  `type` VARCHAR(16) DEFAULT 'DISCUSSION',
  `category` VARCHAR(80),
  `seeded` TINYINT DEFAULT 0,
  `createdAt` BIGINT DEFAULT 0,
  KEY `idx_posts_author` (`authorId`),
  KEY `idx_posts_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `comments` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `postId` VARCHAR(64),
  `authorId` VARCHAR(64),
  `authorName` VARCHAR(160),
  `authorAvatar` LONGTEXT,
  `content` TEXT,
  `createdAt` BIGINT DEFAULT 0,
  KEY `idx_comments_post` (`postId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `targetId` VARCHAR(64),
  `authorId` VARCHAR(64),
  `authorName` VARCHAR(160),
  `authorAvatar` LONGTEXT,
  `rating` INT DEFAULT 5,
  `content` TEXT,
  `createdAt` BIGINT DEFAULT 0,
  KEY `idx_reviews_target` (`targetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `conversations` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `participants` LONGTEXT,
  `participantNames` LONGTEXT,
  `participantAvatars` LONGTEXT,
  `lastMessage` TEXT,
  `lastSenderId` VARCHAR(64),
  `lastUpdatedAt` BIGINT DEFAULT 0,
  `unreadCount` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `conversationId` VARCHAR(64),
  `senderId` VARCHAR(64),
  `senderName` VARCHAR(160),
  `text` TEXT,
  `readBy` LONGTEXT,
  `createdAt` BIGINT DEFAULT 0,
  KEY `idx_messages_conv` (`conversationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET foreign_key_checks = 1;
