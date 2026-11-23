import 'dart:async';

import 'package:flutter/material.dart';
import 'package:happysnouts/models/blog_post.dart';
import 'package:happysnouts/screens/blog/blog_editor_screen.dart';
import 'package:happysnouts/screens/blog/blog_post_screen.dart';
import 'package:happysnouts/screens/blog/blog_screen.dart' show BlogCover, relativeTime;
import 'package:happysnouts/screens/employee/blog_category_form.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/blog_service.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/category_icon.dart';

class BlogTab extends StatefulWidget {
  const BlogTab({super.key});

  @override
  State<BlogTab> createState() => _BlogTabState();
}

class _BlogTabState extends State<BlogTab> with ReloadOnChange {
  late Future<List<BlogPost>> _future;

  late Future<(List<BlogCategory>, List<BlogPost>?)> _categoriesFuture;
  bool _showCategories = false;

  @override
  List<DataTopic> get reloadTopics => const [DataTopic.blog];

  @override
  void initState() {
    super.initState();
    reload();
  }

  @override
  void reload() {
    _future = BlogService.instance.getAllPostsForAdmin().then(
      (posts) => posts..sort((a, b) => b.publishedAt.compareTo(a.publishedAt)),
    );
    _categoriesFuture = () async {
      final results = await Future.wait<Object?>([
        BlogService.instance.getCategories(),
        _future.then<List<BlogPost>?>((posts) => posts).catchError((_) => null),
      ]);
      return (results[0] as List<BlogCategory>, results[1] as List<BlogPost>?);
    }();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          child: Row(
            children: [
              ChoiceChip(
                avatar: const Icon(Icons.article_outlined, size: 18),
                label: const Text('Posts'),
                selected: !_showCategories,
                showCheckmark: false,
                onSelected: (_) => setState(() => _showCategories = false),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                avatar: const Icon(Icons.sell_outlined, size: 18),
                label: const Text('Categorias'),
                selected: _showCategories,
                showCheckmark: false,
                onSelected: (_) => setState(() => _showCategories = true),
              ),
            ],
          ),
        ),
        Expanded(child: _showCategories ? _buildCategories() : _buildPosts()),
      ],
    );
  }

  Future<void> _openCategory(List<BlogCategory> categories, List<BlogPost>? posts, {BlogCategory? category}) async {
    await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => BlogCategoryForm(
        category: category,
        existing: categories,
        postCount: category == null ? 0 : posts?.where((p) => p.categoryId == category.id).length,
      ),
    );
  }

  Widget _buildCategories() {
    final palette = context.palette;
    return FutureStateBuilder<(List<BlogCategory>, List<BlogPost>?)>(
      future: _categoriesFuture,
      onRetry: () => setState(reload),
      builder: (context, data) {
        final (categories, posts) = data;
        return Scaffold(
          backgroundColor: Colors.transparent,
          floatingActionButton: FloatingActionButton.extended(
            heroTag: 'nova-categoria-blog',
            onPressed: () => _openCategory(categories, posts),
            icon: const Icon(Icons.add_rounded),
            label: const Text('Nova categoria'),
          ),
          body: RefreshIndicator(
            onRefresh: () async {
              setState(reload);
              await _categoriesFuture.catchError((_) => (<BlogCategory>[], null));
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
              children: [
                Text(
                  'Essas categorias viram as abas do blog (no app e no site) e aparecem na hora de criar um post. Só dá para excluir uma categoria sem posts.',
                  style: TextStyle(fontSize: 12.5, color: palette.muted),
                ),
                const SizedBox(height: 12),
                if (categories.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 32),
                    child: EmptyView(
                      icon: Icons.sell_outlined,
                      title: 'Nenhuma categoria do blog',
                      message: 'Toque em "Nova categoria" para criar a primeira.',
                    ),
                  ),
                ...categories.map((c) {
                  final count = posts?.where((p) => p.categoryId == c.id).length;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: AppCard(
                      padding: const EdgeInsets.all(12),
                      onTap: () => _openCategory(categories, posts, category: c),
                      child: Row(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: c.color.withValues(alpha: 0.16),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: CategoryIcon(icon: c.icon, size: 28),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  c.name,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontWeight: FontWeight.w800, color: palette.title),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(color: c.color, shape: BoxShape.circle),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      count == null
                                          ? BlogCategory.toHex(c.color)
                                          : (count == 1 ? '1 post' : '$count posts'),
                                      style: TextStyle(fontSize: 12, color: palette.muted),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Icon(Icons.chevron_right_rounded, color: palette.muted),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPosts() {
    final palette = context.palette;
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'novo-post-equipe',
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BlogEditorScreen())),
        icon: const Icon(Icons.edit_outlined),
        label: const Text('Novo post'),
      ),
      body: FutureStateBuilder<List<BlogPost>>(
        future: _future,
        onRetry: () => setState(reload),
        builder: (context, posts) {
          if (posts.isEmpty) return const EmptyView(icon: Icons.article_outlined, title: 'Nenhum post ainda');
          return RefreshIndicator(
            onRefresh: () async {
              setState(reload);
              await _future.catchError((_) => <BlogPost>[]);
            },
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
              itemCount: posts.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final post = posts[i];
                return Opacity(
                  opacity: post.active ? 1 : 0.55,
                  child: AppCard(
                    padding: EdgeInsets.zero,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => BlogPostScreen(post: post, moderation: true)),
                    ),
                    child: SizedBox(
                      height: 92,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (post.imageUrl.isNotEmpty) SizedBox(width: 92, child: BlogCover(post: post, iconSize: 28)),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(10),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    post.title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontWeight: FontWeight.w800, color: palette.title),
                                  ),
                                  const Spacer(),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          '${post.author} • ${relativeTime(post.publishedAt)} • ${post.views} visualizações',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(fontSize: 11.5, color: palette.muted),
                                        ),
                                      ),
                                      if (!post.active) const StatusPill(label: 'Removido', color: AppColors.red),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
