import 'dart:async';

import 'package:flutter/material.dart';
import 'package:happysnouts/services/admin_service.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/category_icon.dart';
import 'package:happysnouts/widgets/outlined_text_field.dart';
import 'package:happysnouts/widgets/photo_avatar.dart';

class CategoriesTab extends StatefulWidget {
  const CategoriesTab({super.key});

  @override
  State<CategoriesTab> createState() => _CategoriesTabState();
}

class _CategoriesTabState extends State<CategoriesTab> with ReloadOnChange {
  late Future<(List<AdminProduct>, List<ProductCategory>)> _future;

  @override
  List<DataTopic> get reloadTopics => const [DataTopic.products, DataTopic.categories];

  @override
  void initState() {
    super.initState();
    reload();
  }

  @override
  void reload() {
    _future = () async {
      final results = await Future.wait([AdminService.instance.getProducts(), AdminService.instance.getCategories()]);
      return (results[0] as List<AdminProduct>, results[1] as List<ProductCategory>);
    }();
  }

  Future<void> _openCategory(List<ProductCategory> categories, {ProductCategory? category}) async {
    await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _CategoryForm(category: category, existing: categories),
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return FutureStateBuilder<(List<AdminProduct>, List<ProductCategory>)>(
      future: _future,
      onRetry: () => setState(reload),
      builder: (context, data) {
        final (products, categories) = data;
        return Scaffold(
          backgroundColor: Colors.transparent,
          floatingActionButton: FloatingActionButton.extended(
            heroTag: 'nova-categoria',
            onPressed: () => _openCategory(categories),
            icon: const Icon(Icons.add_rounded),
            label: const Text('Nova categoria'),
          ),
          body: categories.isEmpty
              ? const EmptyView(
                  icon: Icons.category_outlined,
                  title: 'Nenhuma categoria ainda',
                  message: 'Crie a primeira para poder cadastrar produtos.',
                )
              : GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 200,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.05,
                  ),
                  itemCount: categories.length,
                  itemBuilder: (context, i) {
                    final c = categories[i];
                    final count = products.where((p) => p.categoryId == c.id).length;
                    return AppCard(
                      onTap: () => _openCategory(categories, category: c),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: AppColors.orange.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: CategoryIcon(icon: c.icon, size: 36),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            c.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontWeight: FontWeight.w800, color: palette.title),
                          ),
                          Text(
                            count == 1 ? '1 produto' : '$count produtos',
                            style: TextStyle(fontSize: 12, color: palette.muted),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        );
      },
    );
  }
}

class _CategoryForm extends StatefulWidget {
  final ProductCategory? category;
  final List<ProductCategory> existing;

  const _CategoryForm({this.category, required this.existing});

  @override
  State<_CategoryForm> createState() => _CategoryFormState();
}

class _CategoryFormState extends State<_CategoryForm> {
  static const _groups = {
    'Pets': [
      '🐾',
      '🐶',
      '🐱',
      '🐕',
      '🐈',
      '🐩',
      '🐕‍🦺',
      '🐈‍⬛',
      '🐦',
      '🦜',
      '🐟',
      '🐠',
      '🐢',
      '🐰',
      '🐹',
      '🐭',
      '🦎',
      '🐴',
    ],
    'Alimentação': ['🍖', '🦴', '🥩', '🍗', '🐟', '🥕', '🍎', '🥣', '🍽️', '💧', '🥫', '🧀'],
    'Brinquedos': ['🎾', '🧸', '🪀', '⚽', '🏀', '🥏', '🪢', '🎀', '🧶', '🪶'],
    'Cuidados': ['🛁', '🧴', '🧼', '✂️', '🪮', '🪥', '💊', '💉', '🩺', '🩹', '🌡️', '🧽'],
    'Casa e passeio': ['🏠', '🛏️', '🧺', '🦮', '🎒', '🧥', '👕', '🎽', '🚗', '🧳', '⛺', '🌳'],
    'Tecnologia': ['📱', '📡', '🔋', '⌚', '📍', '🛰️', '💡', '🔔', '📷', '⚙️'],
    'Outros': ['⭐', '❤️', '🎁', '🏷️', '🔥', '✨', '🆕', '💎', '🛒', '📦', '➕', '🌈'],
  };

  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.category?.name ?? '');
  final _customEmoji = TextEditingController();
  late String _icon = widget.category?.icon.isNotEmpty == true ? widget.category!.icon : '🐾';
  PickedPhoto? _iconPhoto;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _customEmoji.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action, String message) async {
    setState(() => _saving = true);
    try {
      await action();
      if (!mounted) return;
      AppFeedback.show(context, message);
      Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  void _save() {
    if (_saving || !_formKey.currentState!.validate()) return;
    _run(
      () => AdminService.instance.saveCategory(
        id: widget.category?.id,
        name: _name.text.trim(),
        icon: _icon,
        iconPhoto: _iconPhoto,
      ),
      widget.category == null ? 'Categoria criada!' : 'Categoria atualizada!',
    );
  }

  Future<void> _delete() async {
    final category = widget.category!;
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Excluir categoria',
      message: 'Excluir a categoria "${category.name}"?',
      confirmLabel: 'Excluir',
      destructive: true,
    );
    if (confirmed && mounted) _run(() => AdminService.instance.deleteCategory(category.id), 'Categoria excluída.');
  }

  Future<void> _pickImage() async {
    try {
      final photo = await pickPhoto(context, maxSide: 256);
      if (photo != null && mounted) setState(() => _iconPhoto = photo);
    } catch (_) {
      if (mounted) AppFeedback.show(context, 'Não foi possível abrir as fotos.', error: true);
    }
  }

  void _useCustomEmoji() {
    final text = _customEmoji.text.trim();
    if (text.isEmpty) return;
    // Pega só o primeiro "caractere visível" (um emoji pode ter vários códigos).
    final first = text.characters.first;
    setState(() {
      _icon = first;
      _iconPhoto = null;
      _customEmoji.clear();
    });
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final preview = _iconPhoto != null
        ? ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.memory(_iconPhoto!.bytes, width: 44, height: 44, fit: BoxFit.contain),
          )
        : CategoryIcon(icon: _icon, size: 40);
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.viewInsetsOf(context).bottom + 20),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.category == null ? 'Nova categoria' : 'Editar categoria',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: palette.title),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.orange.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: preview,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: OutlinedTextField(
                      controller: _name,
                      label: 'Nome',
                      hint: 'Ex.: Brinquedos',
                      textCapitalization: TextCapitalization.sentences,
                      validator: (value) {
                        final name = (value ?? '').trim();
                        if (name.length < 2) return 'Digite o nome da categoria';
                        final repeated = widget.existing.any(
                          (c) => c.name.toLowerCase() == name.toLowerCase() && c.id != widget.category?.id,
                        );
                        return repeated ? 'Já existe uma categoria com esse nome' : null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                'Ícone',
                style: TextStyle(fontWeight: FontWeight.w800, color: palette.text),
              ),
              const SizedBox(height: 4),
              Text(
                'Escolha um da lista, digite outro emoji ou envie uma imagem.',
                style: TextStyle(fontSize: 12.5, color: palette.muted),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _customEmoji,
                      decoration: const InputDecoration(hintText: 'Digite ou cole um emoji 🙂', isDense: true),
                      onSubmitted: (_) => _useCustomEmoji(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filledTonal(
                    tooltip: 'Usar este emoji',
                    onPressed: _useCustomEmoji,
                    icon: const Icon(Icons.check_rounded),
                  ),
                  IconButton.filledTonal(
                    tooltip: 'Enviar imagem',
                    onPressed: _pickImage,
                    icon: const Icon(Icons.image_outlined),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ..._groups.entries.map(
                (group) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        group.key,
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: palette.muted),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: group.value.map((icon) {
                          final selected = _iconPhoto == null && icon == _icon;
                          return InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () => setState(() {
                              _icon = icon;
                              _iconPhoto = null;
                            }),
                            child: Container(
                              width: 44,
                              height: 44,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: selected ? AppColors.orange.withValues(alpha: 0.2) : palette.softCard,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: selected ? AppColors.orangeStrong : Colors.transparent,
                                  width: 1.6,
                                ),
                              ),
                              child: Text(icon, style: const TextStyle(fontSize: 22)),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              LoadingButton(label: 'Salvar', loading: _saving, onPressed: _save),
              if (widget.category != null) ...[
                const SizedBox(height: 8),
                TextButton(
                  style: TextButton.styleFrom(foregroundColor: AppColors.red),
                  onPressed: _saving ? null : _delete,
                  child: const Text('Excluir categoria'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
