import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/models/blog_post.dart';
import 'package:happysnouts/screens/auth/login_screen.dart';
import 'package:happysnouts/screens/blog/blog_editor_screen.dart';
import 'package:happysnouts/screens/blog/blog_screen.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/blog_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/category_icon.dart';
import 'package:happysnouts/widgets/product_image.dart';

export 'package:happysnouts/screens/blog/blog_screen.dart' show BlogPostCard;

class BlogPostScreen extends StatefulWidget {
  final BlogPost post;
  final bool moderation;

  const BlogPostScreen({super.key, required this.post, this.moderation = false});

  @override
  State<BlogPostScreen> createState() => _BlogPostScreenState();
}

class _BlogPostScreenState extends State<BlogPostScreen> {
  late BlogPost _post = widget.post;
  bool _loadFailed = false;

  List<BlogComment>? _comments;
  bool _commentsFailed = false;
  bool _sending = false;
  final _commentController = TextEditingController();

  bool get _canComment => SessionController.isLoggedIn || SessionController.isEmployee;

  // Favoritar (curtir) é só para clientes; a equipe vê apenas o total.
  bool get _canLike => SessionController.isLoggedIn && !SessionController.isEmployee;

  bool _askLogin() {
    if (_canLike) return true;
    if (SessionController.isEmployee) return false;
    AppFeedback.show(context, 'Entre na sua conta para favoritar.');
    Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
    return false;
  }

  Future<void> _togglePostLike() async {
    if (!_askLogin()) return;
    final liked = !_post.liked;
    setState(() => _post = _post.copyWith(liked: liked, likes: (_post.likes + (liked ? 1 : -1)).clamp(0, 1 << 30)));
    try {
      final total = await BlogService.instance.setPostLiked(_post.id, liked);
      if (mounted) setState(() => _post = _post.copyWith(likes: total));
    } catch (error) {
      if (!mounted) return;
      setState(() => _post = _post.copyWith(liked: !liked, likes: (_post.likes + (liked ? -1 : 1)).clamp(0, 1 << 30)));
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  void _replaceComment(BlogComment updated) {
    final list = _comments;
    if (list == null) return;
    setState(() => _comments = [for (final c in list) c.id == updated.id ? updated : c]);
  }

  Future<void> _toggleCommentLike(BlogComment comment) async {
    if (!_askLogin()) return;
    final liked = !comment.liked;
    _replaceComment(comment.copyWith(liked: liked, likes: (comment.likes + (liked ? 1 : -1)).clamp(0, 1 << 30)));
    try {
      final total = await BlogService.instance.setCommentLiked(_post.id, comment.id, liked);
      if (mounted) _replaceComment(comment.copyWith(liked: liked, likes: total));
    } catch (error) {
      if (!mounted) return;
      _replaceComment(comment);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  Widget _likeButton({
    required bool liked,
    required int count,
    required VoidCallback onTap,
    required String tooltip,
    double size = 22,
  }) {
    final palette = context.palette;
    return Tooltip(
      message: tooltip,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: SessionController.isEmployee ? null : onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                liked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                size: size,
                color: liked ? AppColors.red : palette.muted,
              ),
              const SizedBox(width: 4),
              Text(
                '$count',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: size * 0.62,
                  color: liked ? AppColors.red : palette.muted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Pode apagar: quem escreveu o comentário, o autor do post ou a equipe.
  bool _canDeleteComment(BlogComment comment) {
    if (widget.moderation || SessionController.isEmployee) return true;
    final me = ApiClient.instance.userId;
    if (me == null) return false;
    return comment.authorId == '$me' || _post.authorId == '$me';
  }

  bool get _canEdit {
    if (widget.moderation || SessionController.isEmployee) return true;
    final me = ApiClient.instance.userId;
    return me != null && _post.authorId == '$me';
  }

  @override
  void initState() {
    super.initState();
    _loadFull();
    _loadComments();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadComments() async {
    try {
      final comments = await BlogService.instance.getComments(_post.id);
      if (!mounted) return;
      setState(() {
        _comments = comments;
        _commentsFailed = false;
      });
    } catch (_) {
      if (mounted) setState(() => _commentsFailed = true);
    }
  }

  Future<void> _sendComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await BlogService.instance.addComment(_post.id, text);
      _commentController.clear();
      if (mounted) FocusScope.of(context).unfocus();
      await _loadComments();
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _deleteComment(BlogComment comment) async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Remover comentário',
      message: 'O comentário deixa de aparecer neste post.',
      confirmLabel: 'Remover',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    try {
      await BlogService.instance.deleteComment(_post.id, comment.id);
      if (!mounted) return;
      setState(() => _comments?.removeWhere((c) => c.id == comment.id));
      AppFeedback.show(context, 'Comentário removido');
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  Widget _buildComments(AppPalette palette) {
    final comments = _comments;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Divider(height: 24, color: palette.border),
        Text(
          comments == null || comments.isEmpty ? 'Comentários' : 'Comentários (${comments.length})',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: palette.title),
        ),
        const SizedBox(height: 12),
        if (_canComment && _post.active)
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: TextField(
                  controller: _commentController,
                  minLines: 1,
                  maxLines: 5,
                  inputFormatters: [LengthLimitingTextInputFormatter(1000)],
                  textCapitalization: TextCapitalization.sentences,
                  decoration: const InputDecoration(hintText: 'Escreva um comentário...'),
                ),
              ),
              const SizedBox(width: 8),
              // Cor explícita: com a cor do tema a seta some no fundo azul.
              IconButton.filled(
                tooltip: 'Enviar comentário',
                onPressed: _sending ? null : _sendComment,
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.navy,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: AppColors.navy.withValues(alpha: 0.6),
                  disabledForegroundColor: Colors.white,
                ),
                icon: _sending
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    // A seta do ícone é desenhada um pouco à esquerda; o recuo a centraliza no círculo.
                    : const Padding(
                        padding: EdgeInsets.only(left: 3),
                        child: Icon(Icons.send_rounded, color: Colors.white),
                      ),
              ),
            ],
          )
        else if (!_canComment)
          OutlinedButton.icon(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
            icon: const Icon(Icons.login_rounded),
            label: const Text('Entre na sua conta para comentar'),
          ),
        const SizedBox(height: 16),
        if (_commentsFailed)
          TextButton.icon(
            onPressed: () {
              setState(() => _commentsFailed = false);
              _loadComments();
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Não foi possível carregar os comentários. Tentar novamente'),
          )
        else if (comments == null)
          const Center(
            child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator()),
          )
        else if (comments.isEmpty)
          Text('Ninguém comentou ainda. Seja o primeiro!', style: TextStyle(color: palette.muted))
        else
          for (final comment in comments)
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: comment.isTeamComment ? AppColors.navy : AppColors.orange,
                    backgroundImage: comment.authorPhotoUrl.startsWith('http')
                        ? NetworkImage(comment.authorPhotoUrl)
                        : null,
                    child: comment.authorPhotoUrl.startsWith('http')
                        ? null
                        : Icon(
                            comment.isTeamComment ? Icons.verified_rounded : Icons.person_rounded,
                            size: 16,
                            color: Colors.white,
                          ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(12, 8, 4, 10),
                      decoration: BoxDecoration(color: palette.softCard, borderRadius: BorderRadius.circular(14)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text.rich(
                                  TextSpan(
                                    children: [
                                      TextSpan(
                                        text: comment.author,
                                        style: TextStyle(fontWeight: FontWeight.w800, color: palette.text),
                                      ),
                                      TextSpan(
                                        text: '  •  ${relativeTime(comment.createdAt)}',
                                        style: TextStyle(fontSize: 12, color: palette.muted),
                                      ),
                                    ],
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              _likeButton(
                                liked: comment.liked,
                                count: comment.likes,
                                size: 17,
                                tooltip: comment.liked ? 'Remover dos favoritos' : 'Favoritar comentário',
                                onTap: () => _toggleCommentLike(comment),
                              ),
                              if (_canDeleteComment(comment))
                                IconButton(
                                  tooltip: 'Remover comentário',
                                  visualDensity: VisualDensity.compact,
                                  iconSize: 18,
                                  color: palette.muted,
                                  onPressed: () => _deleteComment(comment),
                                  icon: const Icon(Icons.delete_outline_rounded),
                                )
                              else
                                const SizedBox(height: 32),
                            ],
                          ),
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: SelectableText(
                              comment.text,
                              style: TextStyle(fontSize: 14.5, height: 1.45, color: palette.text),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
      ],
    );
  }

  // Enquanto o texto completo não chega, a tela mostra o resumo.
  Future<void> _loadFull() async {
    try {
      final full = await BlogService.instance.getPost(_post.id);
      if (mounted) setState(() => _post = full);
    } catch (_) {
      if (mounted && !_post.hasFullContent) setState(() => _loadFailed = true);
    }
  }

  Future<void> _edit() async {
    final saved = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => BlogEditorScreen(post: _post)));
    if (saved == true) _loadFull();
  }

  Future<void> _delete() async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Remover post',
      message: 'O post "${_post.title}" deixa de aparecer no BlogSnouts.',
      confirmLabel: 'Remover',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    try {
      await BlogService.instance.deletePost(_post.id);
      if (!mounted) return;
      AppFeedback.show(context, 'Post removido');
      Navigator.pop(context);
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final post = _post;
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            actions: [
              if (_canEdit && post.active)
                PopupMenuButton<String>(
                  tooltip: 'Opções',
                  onSelected: (value) => value == 'editar' ? _edit() : _delete(),
                  itemBuilder: (_) => [
                    if (!widget.moderation || post.authorId == null)
                      const PopupMenuItem(value: 'editar', child: Text('Editar')),
                    const PopupMenuItem(value: 'remover', child: Text('Remover')),
                  ],
                ),
            ],
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: post.isTeamPost ? AppColors.navy : AppColors.orange,
                        child: Icon(
                          post.isTeamPost ? Icons.verified_rounded : Icons.person_rounded,
                          size: 22,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    post.author,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15.5, color: palette.text),
                                  ),
                                ),
                                if (post.isTeamPost) ...[
                                  const SizedBox(width: 4),
                                  const Icon(Icons.verified_rounded, size: 16, color: AppColors.navy),
                                ],
                              ],
                            ),
                            Text(relativeTime(post.publishedAt), style: TextStyle(fontSize: 13, color: palette.muted)),
                          ],
                        ),
                      ),
                      if (post.categoryName.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: post.categoryColor.withValues(alpha: 0.13),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: CategoryLabel(
                            icon: post.categoryIcon,
                            text: post.categoryName,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: Color.lerp(post.categoryColor, AppColors.navyDark, 0.25),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    post.title,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 22,
                      height: 1.25,
                      letterSpacing: -0.3,
                      color: palette.title,
                    ),
                  ),
                  // O resumo não aparece aqui: ele é só o começo do próprio texto.
                  const SizedBox(height: 8),
                  SelectableText(post.content, style: TextStyle(fontSize: 15.5, height: 1.6, color: palette.text)),
                  if (!post.hasFullContent && !_loadFailed)
                    const Padding(
                      padding: EdgeInsets.only(top: 16),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  if (_loadFailed)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: TextButton.icon(
                        onPressed: () {
                          setState(() => _loadFailed = false);
                          _loadFull();
                        },
                        icon: const Icon(Icons.refresh),
                        label: const Text('Não foi possível carregar o post completo. Tentar novamente'),
                      ),
                    ),
                  if (post.imageUrl.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        width: double.infinity,
                        constraints: const BoxConstraints(maxHeight: 420),
                        foregroundDecoration: BoxDecoration(
                          border: Border.all(color: palette.border),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: AppImage(source: post.imageUrl, fit: BoxFit.cover, width: double.infinity),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Text.rich(
                    TextSpan(
                      style: TextStyle(fontSize: 13, color: palette.muted),
                      children: [
                        TextSpan(
                          text:
                              '${Formatters.dateTime(post.publishedAt.toLocal())} · ${post.readingMinutes} min de leitura · ',
                        ),
                        TextSpan(
                          text: '${post.views}',
                          style: TextStyle(fontWeight: FontWeight.w800, color: palette.text),
                        ),
                        TextSpan(text: post.views == 1 ? ' visualização' : ' visualizações'),
                      ],
                    ),
                  ),
                  Divider(height: 24, color: palette.border),
                  Row(
                    children: [
                      _likeButton(
                        liked: post.liked,
                        count: post.likes,
                        tooltip: post.liked ? 'Remover dos favoritos' : 'Favoritar post',
                        onTap: _togglePostLike,
                      ),
                      const SizedBox(width: 16),
                      Icon(Icons.chat_bubble_outline_rounded, size: 20, color: palette.muted),
                      const SizedBox(width: 6),
                      Text(
                        '${_comments?.length ?? post.commentCount}',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: palette.muted),
                      ),
                    ],
                  ),
                  _buildComments(palette),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
