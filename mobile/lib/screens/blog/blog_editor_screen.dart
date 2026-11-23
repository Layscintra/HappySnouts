import 'package:flutter/material.dart';
import 'package:happysnouts/models/blog_post.dart';
import 'package:happysnouts/services/blog_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/category_icon.dart';
import 'package:happysnouts/widgets/outlined_text_field.dart';
import 'package:happysnouts/widgets/photo_avatar.dart';
import 'package:happysnouts/widgets/product_image.dart';

class BlogEditorScreen extends StatefulWidget {
  final BlogPost? post;

  const BlogEditorScreen({super.key, this.post});

  @override
  State<BlogEditorScreen> createState() => _BlogEditorScreenState();
}

class _BlogEditorScreenState extends State<BlogEditorScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _title = TextEditingController(text: widget.post?.title ?? '');
  late final _content = TextEditingController(text: widget.post?.content ?? '');
  late int? _categoryId = widget.post?.categoryId;
  late final Future<List<BlogCategory>> _categories = BlogService.instance.getCategories();
  PickedPhoto? _photo;
  bool _saving = false;

  bool get _isEditing => widget.post != null;

  @override
  void dispose() {
    _title.dispose();
    _content.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    try {
      final photo = await pickPhoto(context, maxSide: 1200);
      if (photo != null && mounted) setState(() => _photo = photo);
    } catch (_) {
      if (mounted) AppFeedback.show(context, 'Não foi possível abrir as fotos.', error: true);
    }
  }

  Future<void> _save() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await BlogService.instance.savePost(
        id: widget.post?.id ?? '',
        categoryId: _categoryId!,
        title: _title.text,
        content: _content.text,
        currentImagePath: widget.post?.imagePath ?? '',
        photo: _photo,
      );
      if (!mounted) return;
      AppFeedback.show(context, _isEditing ? 'Post atualizado!' : 'Post publicado no BlogSnouts! 🐾');
      Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Editar post' : 'Novo post')),
      body: FutureStateBuilder<List<BlogCategory>>(
        future: _categories,
        onRetry: () => setState(() {}),
        builder: (context, categories) => Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                'Conte sua dica, dúvida ou experiência para ajudar outros tutores.',
                style: TextStyle(color: palette.muted),
              ),
              const SizedBox(height: 14),
              GestureDetector(
                onTap: _pickPhoto,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    height: 170,
                    decoration: BoxDecoration(
                      color: palette.softCard,
                      border: Border.all(color: palette.border),
                    ),
                    child: _photo != null
                        ? Image.memory(_photo!.bytes, fit: BoxFit.cover)
                        : (widget.post?.imageUrl.isNotEmpty ?? false)
                        ? AppImage(source: widget.post!.imageUrl, fit: BoxFit.cover)
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_photo_alternate_outlined, size: 40, color: palette.muted),
                              const SizedBox(height: 6),
                              Text('Foto de capa (opcional)', style: TextStyle(color: palette.muted)),
                            ],
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              DropdownButtonFormField<int>(
                initialValue: categories.any((c) => c.id == _categoryId) ? _categoryId : null,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Categoria'),
                items: categories
                    .map(
                      (c) => DropdownMenuItem(
                        value: c.id,
                        child: CategoryLabel(icon: c.icon, text: c.name, iconSize: 20),
                      ),
                    )
                    .toList(),
                onChanged: (value) => setState(() => _categoryId = value),
                validator: (value) => value == null ? 'Escolha a categoria' : null,
              ),
              const SizedBox(height: 14),
              OutlinedTextField(
                controller: _title,
                label: 'Título',
                hint: 'Ex.: Como ensinei meu cão a passear sem puxar',
                maxLength: 120,
                textCapitalization: TextCapitalization.sentences,
                validator: (v) => (v ?? '').trim().length < 5 ? 'Escreva um título com pelo menos 5 caracteres' : null,
              ),
              const SizedBox(height: 6),
              OutlinedTextField(
                controller: _content,
                label: 'Texto',
                hint: 'Descreva com detalhes para a comunidade te ajudar melhor.',
                maxLines: 12,
                maxLength: 2000,
                textCapitalization: TextCapitalization.sentences,
                validator: (v) => (v ?? '').trim().length < 30 ? 'Escreva pelo menos 30 caracteres' : null,
              ),
              const SizedBox(height: 12),
              const InfoBanner(
                message:
                    'Seja gentil e evite orientações médicas: em caso de doença, o veterinário é sempre o melhor caminho.',
              ),
              const SizedBox(height: 20),
              LoadingButton(
                label: _isEditing ? 'Salvar alterações' : 'Publicar',
                icon: Icons.send_rounded,
                loading: _saving,
                onPressed: _save,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
