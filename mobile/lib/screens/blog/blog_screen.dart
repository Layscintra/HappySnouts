import 'package:flutter/material.dart';
import 'package:happysnouts/models/blog_post.dart';
import 'package:happysnouts/screens/auth/login_screen.dart';
import 'package:happysnouts/screens/blog/blog_editor_screen.dart';
import 'package:happysnouts/screens/blog/blog_post_screen.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/blog_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/bottom_nav_bar.dart';
import 'package:happysnouts/widgets/category_icon.dart';
import 'package:happysnouts/widgets/product_image.dart';

class BlogScreen extends StatefulWidget {
  const BlogScreen({super.key});

  @override
  State<BlogScreen> createState() => _BlogScreenState();
}

class _BlogScreenState extends State<BlogScreen> with ReloadOnChange {
  final _search = TextEditingController();
  late Future<(List<BlogPost>, List<BlogCategory>)> _future;
  int? _categoryId;
  bool _mine = false;
  bool _liked = false;
  String _query = '';

  @override
  List<DataTopic> get reloadTopics => const [DataTopic.blog];

  @override
  void initState() {
    super.initState();
    reload();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  void reload() {
    _future = () async {
      final results = await Future.wait([
        BlogService.instance.getPosts(categoryId: _categoryId, search: _query, mine: _mine, liked: _liked),
        BlogService.instance.getCategories().catchError((_) => <BlogCategory>[]),
      ]);
      return (results[0] as List<BlogPost>, results[1] as List<BlogCategory>);
    }();
  }

  void _setFilter({int? categoryId, bool mine = false, bool liked = false}) {
    setState(() {
      _categoryId = categoryId;
      _mine = mine;
      _liked = liked;
      reload();
    });
  }

  void _openEditor() => Navigator.push(context, MaterialPageRoute(builder: (_) => const BlogEditorScreen()));

  @override
  Widget build(BuildContext context) {
    final isTab = !Navigator.of(context).canPop();
    final canWrite = SessionController.isLoggedIn;
    return Scaffold(
      // A tela é aberta tanto como aba (barra inferior) quanto pela Home.
      appBar: AppBar(title: const Text('BlogSnouts'), automaticallyImplyLeading: !isTab),
      bottomNavigationBar: isTab ? const AppBottomNavBar(currentIndex: 3) : null,
      floatingActionButton: canWrite
          ? FloatingActionButton.extended(
              heroTag: 'escrever-post',
              onPressed: _openEditor,
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Escrever'),
            )
          : null,
      body: FutureStateBuilder<(List<BlogPost>, List<BlogCategory>)>(
        future: _future,
        onRetry: () => setState(reload),
        builder: (context, data) {
          final (posts, categories) = data;
          // O destaque grande só aparece quando o post mais recente tem foto.
          final showFeatured =
              _query.isEmpty && !_mine && !_liked && posts.isNotEmpty && posts.first.imageUrl.isNotEmpty;
          return RefreshIndicator(
            onRefresh: () async {
              setState(reload);
              await _future.catchError((_) => (<BlogPost>[], <BlogCategory>[]));
            },
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(child: _buildSearch()),
                SliverToBoxAdapter(child: _buildChips(categories, canWrite)),
                if (posts.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyView(
                      icon: _liked
                          ? Icons.favorite_border_rounded
                          : _mine
                          ? Icons.edit_note_rounded
                          : Icons.article_outlined,
                      title: _liked
                          ? 'Nenhum post favoritado'
                          : _mine
                          ? 'Você ainda não publicou nada'
                          : 'Nenhum post encontrado',
                      message: _liked
                          ? 'Toque no coração de um post para guardá-lo aqui.'
                          : _mine
                          ? 'Compartilhe uma dica ou experiência com outros tutores.'
                          : 'Tente outra categoria ou outra busca.',
                      actionLabel: _mine ? 'Escrever meu primeiro post' : null,
                      onAction: _openEditor,
                    ),
                  )
                else ...[
                  if (showFeatured)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 18),
                        child: FeaturedPostCard(post: posts.first),
                      ),
                    ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
                    sliver: SliverList.separated(
                      itemCount: showFeatured ? posts.length - 1 : posts.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final post = posts[showFeatured ? index + 1 : index];
                        return BlogListTile(post: post);
                      },
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSearch() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: TextField(
        controller: _search,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: 'Buscar dicas, raças, cuidados...',
          prefixIcon: const Icon(Icons.search_rounded),
          suffixIcon: _query.isEmpty
              ? null
              : IconButton(
                  tooltip: 'Limpar busca',
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () {
                    _search.clear();
                    setState(() {
                      _query = '';
                      reload();
                    });
                  },
                ),
        ),
        onSubmitted: (value) => setState(() {
          _query = value.trim();
          reload();
        }),
      ),
    );
  }

  Widget _buildChips(List<BlogCategory> categories, bool canWrite) {
    Widget chip(String label, bool selected, VoidCallback onTap, {Color? color, String? icon}) => Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: icon == null ? Text(label) : CategoryLabel(icon: icon, text: label, iconSize: 16),
        selected: selected,
        showCheckmark: false,
        selectedColor: color?.withValues(alpha: 0.18),
        onSelected: (_) => onTap(),
      ),
    );
    return SizedBox(
      height: 52,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 4, 8, 8),
        children: [
          chip('Todos', _categoryId == null && !_mine && !_liked, () => _setFilter()),
          if (canWrite) chip('❤️ Favoritos', _liked, () => _setFilter(liked: true)),
          ...categories.map(
            (c) => chip(
              c.name,
              _categoryId == c.id,
              () => _setFilter(categoryId: c.id),
              color: c.color,
              icon: c.icon,
            ),
          ),
          if (canWrite) chip('✍️ Meus posts', _mine, () => _setFilter(mine: true)),
        ],
      ),
    );
  }
}

class BlogCover extends StatelessWidget {
  final BlogPost post;
  final double iconSize;

  const BlogCover({super.key, required this.post, this.iconSize = 48});

  @override
  Widget build(BuildContext context) {
    if (post.imageUrl.isNotEmpty) {
      return Container(
        color: Colors.white,
        child: AppImage(source: post.imageUrl, fit: BoxFit.cover),
      );
    }
    final color = post.categoryColor;
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [color.withValues(alpha: 0.95), Color.lerp(color, AppColors.navyDark, 0.45)!],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -10,
            bottom: -14,
            child: CategoryIcon.isImage(post.categoryIcon)
                ? Opacity(
                    opacity: 0.18,
                    child: CategoryIcon(icon: post.categoryIcon, size: iconSize * 2.2),
                  )
                : Text(
                    post.categoryIcon,
                    style: TextStyle(fontSize: iconSize * 2.2, color: Colors.white.withValues(alpha: 0.18)),
                  ),
          ),
          Center(
            child: CategoryIcon(icon: post.categoryIcon, size: iconSize),
          ),
        ],
      ),
    );
  }
}

class _CategoryTag extends StatelessWidget {
  final BlogPost post;
  final bool onImage;

  const _CategoryTag({required this.post, this.onImage = false});

  @override
  Widget build(BuildContext context) {
    if (post.categoryName.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: onImage ? Colors.white : post.categoryColor.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(20),
      ),
      child: CategoryLabel(
        icon: post.categoryIcon,
        text: post.categoryName,
        iconSize: 13,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: onImage ? AppColors.navy : Color.lerp(post.categoryColor, AppColors.navyDark, 0.25),
        ),
      ),
    );
  }
}

class FeaturedPostCard extends StatelessWidget {
  final BlogPost post;

  const FeaturedPostCard({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => BlogPostScreen(post: post))),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: AspectRatio(
          aspectRatio: 16 / 10,
          child: Stack(
            fit: StackFit.expand,
            children: [
              BlogCover(post: post, iconSize: 64),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0xCC071D47)],
                    stops: [0.35, 1],
                  ),
                ),
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const StatusPill(label: 'Destaque', color: AppColors.orange),
                        const SizedBox(width: 6),
                        _CategoryTag(post: post, onImage: true),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      post.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${post.author} • ${relativeTime(post.publishedAt)} • ${post.readingMinutes} min de leitura',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12),
                          ),
                        ),
                        PostStats(post: post, onImage: true),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class BlogListTile extends StatelessWidget {
  final BlogPost post;

  const BlogListTile({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    void open() => Navigator.push(context, MaterialPageRoute(builder: (_) => BlogPostScreen(post: post)));

    // Sem foto: card só de texto, estilo Twitter (sem capa colorida).
    if (post.imageUrl.isEmpty) {
      return AppCard(
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        onTap: open,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${post.author} • ${relativeTime(post.publishedAt)}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 12, color: palette.muted),
            ),
            const SizedBox(height: 6),
            Text(
              post.title,
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, height: 1.25, color: palette.title),
            ),
            if (post.excerpt.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                post.excerpt,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 13.5, height: 1.4, color: palette.text),
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                _CategoryTag(post: post),
                const Spacer(),
                PostStats(post: post),
              ],
            ),
          ],
        ),
      );
    }

    return AppCard(
      padding: EdgeInsets.zero,
      onTap: open,
      child: SizedBox(
        height: 124,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(width: 108, child: BlogCover(post: post, iconSize: 34)),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _CategoryTag(post: post),
                    const SizedBox(height: 6),
                    Text(
                      post.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5, height: 1.25, color: palette.title),
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${post.author} • ${post.readingMinutes} min',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 11.5, color: palette.muted),
                          ),
                        ),
                        PostStats(post: post),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Curtidas e comentários do post, em miniatura (lista do blog).
/// O coração já favorita direto da lista, sem abrir o post.
class PostStats extends StatefulWidget {
  final BlogPost post;

  final bool onImage;

  const PostStats({super.key, required this.post, this.onImage = false});

  @override
  State<PostStats> createState() => _PostStatsState();
}

class _PostStatsState extends State<PostStats> {
  late bool _liked = widget.post.liked;
  late int _likes = widget.post.likes;
  bool _sending = false;

  @override
  void didUpdateWidget(PostStats old) {
    super.didUpdateWidget(old);
    // A lista recarregou: vale o que veio do backend.
    if (old.post.liked != widget.post.liked || old.post.likes != widget.post.likes) {
      _liked = widget.post.liked;
      _likes = widget.post.likes;
    }
  }

  Future<void> _toggle() async {
    if (_sending) return;
    if (!SessionController.isLoggedIn) {
      AppFeedback.show(context, 'Entre na sua conta para favoritar.');
      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }
    final liked = !_liked;
    setState(() {
      _sending = true;
      _liked = liked;
      _likes = (_likes + (liked ? 1 : -1)).clamp(0, 1 << 30);
    });
    try {
      final total = await BlogService.instance.setPostLiked(widget.post.id, liked, notify: false);
      if (mounted) setState(() => _likes = total);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _liked = !liked;
        _likes = (_likes + (liked ? -1 : 1)).clamp(0, 1 << 30);
      });
      AppFeedback.show(context, errorMessage(error), error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final muted = widget.onImage ? Colors.white.withValues(alpha: 0.9) : context.palette.muted;
    final likeColor = _liked ? (widget.onImage ? Colors.white : AppColors.red) : muted;
    final style = TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: muted);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Tooltip(
          message: _liked ? 'Remover dos favoritos' : 'Favoritar post',
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            // A equipe só vê o total (favoritar é de clientes).
            onTap: SessionController.isEmployee ? null : _toggle,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(_liked ? Icons.favorite_rounded : Icons.favorite_border_rounded, size: 18, color: likeColor),
                  const SizedBox(width: 4),
                  Text('$_likes', style: style.copyWith(color: likeColor)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 4),
        Icon(Icons.chat_bubble_outline_rounded, size: 15, color: muted),
        const SizedBox(width: 4),
        Text('${widget.post.commentCount}', style: style),
      ],
    );
  }
}

class BlogPostCard extends StatelessWidget {
  final BlogPost post;
  final VoidCallback onTap;

  const BlogPostCard({super.key, required this.post, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return SizedBox(
      width: 220,
      child: AppCard(
        padding: EdgeInsets.zero,
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (post.imageUrl.isNotEmpty)
              SizedBox(
                height: 108,
                width: double.infinity,
                child: AppImage(source: post.imageUrl, fit: BoxFit.cover),
              ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Sem foto: mostra a categoria e o resumo no lugar da capa.
                    if (post.imageUrl.isEmpty) ...[_CategoryTag(post: post), const SizedBox(height: 8)],
                    Text(
                      post.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: palette.title, fontWeight: FontWeight.w800, fontSize: 13.5, height: 1.25),
                    ),
                    if (post.imageUrl.isEmpty && post.excerpt.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Flexible(
                        child: Text(
                          post.excerpt,
                          maxLines: 5,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: palette.text, fontSize: 12.5, height: 1.35),
                        ),
                      ),
                    ],
                    const Spacer(),
                    Text(
                      '${post.author} • ${relativeTime(post.publishedAt)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: palette.muted, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String relativeTime(DateTime date, {DateTime? now}) {
  final diff = (now ?? DateTime.now()).difference(date);
  if (diff.inMinutes < 1) return 'Agora';
  if (diff.inMinutes < 60) return 'Há ${diff.inMinutes} min';
  if (diff.inHours < 24) return diff.inHours == 1 ? 'Há 1 hora' : 'Há ${diff.inHours} horas';
  if (diff.inDays < 30) return diff.inDays == 1 ? 'Há 1 dia' : 'Há ${diff.inDays} dias';
  final months = diff.inDays ~/ 30;
  return months == 1 ? 'Há 1 mês' : 'Há $months meses';
}
