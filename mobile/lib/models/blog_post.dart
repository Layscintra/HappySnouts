import 'package:flutter/material.dart';

class BlogCategory {
  final int id;
  final String name;
  final Color color;
  final String icon;

  const BlogCategory({required this.id, required this.name, required this.color, required this.icon});

  static Color parseColor(String? hex, {Color fallback = const Color(0xFF6F8BDA)}) {
    final value = (hex ?? '').replaceAll('#', '');
    if (value.length != 6) return fallback;
    final parsed = int.tryParse(value, radix: 16);
    return parsed == null ? fallback : Color(0xFF000000 | parsed);
  }

  static String toHex(Color color) =>
      '#${(color.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0').toUpperCase()}';
}

class BlogPost {
  final String id;
  final String author;

  final String? authorId;
  final DateTime publishedAt;
  final String title;
  final String excerpt;
  final String content;
  final String imageUrl;

  final String imagePath;
  final int? categoryId;
  final String categoryName;
  final Color categoryColor;
  final String categoryIcon;
  final int readingMinutes;
  final int views;
  final bool active;

  /// A listagem do backend traz só o resumo; o texto completo vem ao abrir o post.
  final bool hasFullContent;

  final int likes;
  final bool liked;
  final int commentCount;

  const BlogPost({
    required this.id,
    required this.author,
    required this.publishedAt,
    required this.title,
    required this.excerpt,
    required this.content,
    required this.imageUrl,
    this.authorId,
    this.imagePath = '',
    this.categoryId,
    this.categoryName = '',
    this.categoryColor = const Color(0xFF6F8BDA),
    this.categoryIcon = '🐾',
    this.readingMinutes = 1,
    this.views = 0,
    this.active = true,
    this.hasFullContent = true,
    this.likes = 0,
    this.liked = false,
    this.commentCount = 0,
  });

  bool get isTeamPost => authorId == null;

  BlogPost copyWith({int? likes, bool? liked, int? commentCount}) => BlogPost(
    id: id,
    author: author,
    authorId: authorId,
    publishedAt: publishedAt,
    title: title,
    excerpt: excerpt,
    content: content,
    imageUrl: imageUrl,
    imagePath: imagePath,
    categoryId: categoryId,
    categoryName: categoryName,
    categoryColor: categoryColor,
    categoryIcon: categoryIcon,
    readingMinutes: readingMinutes,
    views: views,
    active: active,
    hasFullContent: hasFullContent,
    likes: likes ?? this.likes,
    liked: liked ?? this.liked,
    commentCount: commentCount ?? this.commentCount,
  );
}

class BlogComment {
  final String id;
  final String postId;

  final String? authorId;
  final String author;
  final String authorPhotoUrl;
  final String text;
  final DateTime createdAt;
  final int likes;
  final bool liked;

  const BlogComment({
    required this.id,
    required this.postId,
    required this.author,
    required this.text,
    required this.createdAt,
    this.authorId,
    this.authorPhotoUrl = '',
    this.likes = 0,
    this.liked = false,
  });

  bool get isTeamComment => authorId == null;

  BlogComment copyWith({int? likes, bool? liked}) => BlogComment(
    id: id,
    postId: postId,
    authorId: authorId,
    author: author,
    authorPhotoUrl: authorPhotoUrl,
    text: text,
    createdAt: createdAt,
    likes: likes ?? this.likes,
    liked: liked ?? this.liked,
  );
}
