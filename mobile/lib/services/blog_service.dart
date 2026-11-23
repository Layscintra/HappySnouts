import 'package:flutter/painting.dart' show Color;
import 'package:happysnouts/models/blog_post.dart';
import 'package:happysnouts/models/picked_photo.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/widgets/category_icon.dart';

class BlogService {
  BlogService._();
  static final BlogService instance = BlogService._();

  final _api = ApiClient.instance;

  /// GET /postBlog: a listagem não traz o texto completo, só o resumo.
  Future<List<BlogPost>> getPosts({int? categoryId, String search = '', bool mine = false, bool liked = false}) async {
    final data = await _api.get(
      '/postBlog',
      query: {
        'limite': '50',
        if (categoryId != null) 'categoria': '$categoryId',
        if (search.trim().isNotEmpty) 'busca': search.trim(),
        if (mine) 'meus': '1',
        if (liked) 'curtidos': '1',
      },
    );
    return Json.list(data).map(fromJson).toList();
  }

  /// GET /postBlog/:id: post completo (o backend também conta a visualização).
  Future<BlogPost> getPost(String id) async {
    try {
      final data = await _api.get('/postBlog/$id');
      if (data is! Map<String, dynamic>) throw const ServiceException('Post não encontrado.');
      return fromJson(data);
    } on ApiException catch (error) {
      if (error.statusCode == 404) throw const ServiceException('Este post não está mais disponível.');
      rethrow;
    }
  }

  Future<List<BlogCategory>> getCategories() async {
    final data = await _api.get('/categoriaBlog');
    return Json.list(data)
        .map(
          (json) => BlogCategory(
            id: Json.toInt(json['id_categoria']) ?? 0,
            name: Json.text(json['nome']),
            color: BlogCategory.parseColor(json['cor'] as String?),
            // emoji ou imagem ("/uploads/..."): desenhe com CategoryIcon / CategoryLabel
            icon: _iconOf(json['icone']),
          ),
        )
        .toList()
      ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
  }

  /// Imagem enviada ("/uploads/...") fica como está; vazio ou nome de arquivo antigo vira a patinha.
  static String _iconOf(dynamic value) {
    final icon = Json.text(value);
    return CategoryIcon.isImage(icon) ? icon : CategoryIcon.emojiOf(icon);
  }

  /// Funcionário: POST /categoriaBlog (id null) ou PUT /categoriaBlog/:id.
  /// [icon] é um emoji ou "/uploads/..."; com [iconPhoto], envia a imagem antes e usa ela.
  /// [color] vai como "#RRGGBB" (o mesmo formato do site).
  Future<void> saveCategory({
    int? id,
    required String name,
    required Color color,
    required String icon,
    PickedPhoto? iconPhoto,
  }) async {
    final finalIcon = iconPhoto == null
        ? icon
        : await _api.uploadImage(iconPhoto.bytes, fileName: iconPhoto.fileName, mimeType: iconPhoto.mimeType);
    final body = {'nome': name.trim(), 'cor': BlogCategory.toHex(color), 'icone': finalIcon};
    if (id == null) {
      await _api.post('/categoriaBlog', body);
    } else {
      await _api.put('/categoriaBlog/$id', body);
    }
    AppEvents.changed(DataTopic.blog);
  }

  Future<void> deleteCategory(int id) async {
    await _api.delete('/categoriaBlog/$id');
    AppEvents.changed(DataTopic.blog);
  }

  Future<String> savePost({
    String id = '',
    required int categoryId,
    required String title,
    required String content,
    String currentImagePath = '',
    PickedPhoto? photo,
  }) async {
    final imagePath = photo == null
        ? currentImagePath
        : await _api.uploadImage(photo.bytes, fileName: photo.fileName, mimeType: photo.mimeType);
    final body = {
      'id_categoria': categoryId,
      'titulo': title.trim(),
      // O resumo é gerado pelo backend a partir do texto (igual ao site).
      'conteudo': content.trim(),
      'imagem_capa_url': imagePath.isEmpty ? null : imagePath,
    };
    var postId = id;
    if (id.isEmpty) {
      final data = await _api.post('/postBlog', body);
      postId = Json.text(data is Map ? data['id_post'] : null);
    } else {
      await _api.put('/postBlog/$id', body);
    }
    AppEvents.changed(DataTopic.blog);
    return postId;
  }

  Future<void> deletePost(String id) async {
    await _api.delete('/postBlog/$id');
    AppEvents.changed(DataTopic.blog);
  }

  Future<List<BlogComment>> getComments(String postId) async {
    final data = await _api.get('/postBlog/$postId/comentarios');
    return Json.list(data)
        .map(
          (json) => BlogComment(
            id: Json.text(json['id_comentario']),
            postId: Json.text(json['id_post']),
            authorId: json['id_autor'] == null ? null : Json.text(json['id_autor']),
            author: json['autor'] == null ? 'Equipe Happy Snouts' : Json.text(json['autor']),
            authorPhotoUrl: ApiClient.imageUrl(Json.text(json['autor_foto'])),
            text: Json.text(json['texto']),
            createdAt: Json.toDate(json['data_comentario']) ?? DateTime.now(),
            likes: Json.toInt(json['total_curtidas']) ?? 0,
            liked: Json.toBool(json['curtido']),
          ),
        )
        .toList();
  }

  Future<void> addComment(String postId, String text) async {
    await _api.post('/postBlog/$postId/comentarios', {'texto': text.trim()});
    AppEvents.changed(DataTopic.blog);
  }

  Future<void> deleteComment(String postId, String commentId) async {
    await _api.delete('/postBlog/$postId/comentarios/$commentId');
    AppEvents.changed(DataTopic.blog);
  }

  /// POST/DELETE /postBlog/:id/curtir: favorita o post. Devolve o total atualizado.
  /// [notify] = false quando o coração é tocado na própria lista (evita recarregá-la).
  Future<int> setPostLiked(String postId, bool liked, {bool notify = true}) async {
    final path = '/postBlog/$postId/curtir';
    final data = liked ? await _api.post(path) : await _api.delete(path);
    if (notify) AppEvents.changed(DataTopic.blog);
    return Json.toInt(data is Map ? data['total_curtidas'] : null) ?? 0;
  }

  Future<int> setCommentLiked(String postId, String commentId, bool liked) async {
    final path = '/postBlog/$postId/comentarios/$commentId/curtir';
    final data = liked ? await _api.post(path) : await _api.delete(path);
    return Json.toInt(data is Map ? data['total_curtidas'] : null) ?? 0;
  }

  Future<List<BlogPost>> getAllPostsForAdmin() async {
    final data = await _api.get('/postBlog/admin/todos');
    return Json.list(data).map(fromJson).toList();
  }

  static BlogPost fromJson(Map<String, dynamic> json) {
    final excerpt = Json.text(json['resumo']);
    final content = Json.text(json['conteudo']);
    final imagePath = Json.text(json['imagem_capa_url']);
    return BlogPost(
      id: Json.text(json['id_post']),
      author: json['autor'] == null ? 'Equipe Happy Snouts' : Json.text(json['autor']),
      authorId: json['id_autor'] == null ? null : Json.text(json['id_autor']),
      publishedAt: Json.toDate(json['data_publicacao']) ?? DateTime.now(),
      title: Json.text(json['titulo']),
      excerpt: excerpt.isEmpty ? _firstLine(content) : excerpt,
      content: content.isEmpty ? excerpt : content,
      imageUrl: ApiClient.imageUrl(imagePath),
      imagePath: imagePath.startsWith('/uploads') ? imagePath : '',
      categoryId: Json.toInt(json['id_categoria']),
      categoryName: Json.text(json['categoria_nome']),
      categoryColor: BlogCategory.parseColor(json['categoria_cor'] as String?),
      categoryIcon: _iconOf(json['categoria_icone']),
      readingMinutes: Json.toInt(json['tempo_leitura_min']) ?? 1,
      views: Json.toInt(json['visualizacoes']) ?? 0,
      active: json['ativo'] == null || Json.toBool(json['ativo']),
      hasFullContent: content.isNotEmpty,
      likes: Json.toInt(json['total_curtidas']) ?? 0,
      liked: Json.toBool(json['curtido']),
      commentCount: Json.toInt(json['total_comentarios']) ?? 0,
    );
  }

  static String _firstLine(String text) {
    final line = text.split('\n').firstWhere((l) => l.trim().isNotEmpty, orElse: () => '');
    return line.length > 160 ? '${line.substring(0, 157)}...' : line;
  }
}
