import 'dart:async';

import 'package:flutter/material.dart';
import 'package:happysnouts/models/blog_post.dart';
import 'package:happysnouts/services/blog_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/category_icon.dart';
import 'package:happysnouts/widgets/outlined_text_field.dart';
import 'package:happysnouts/widgets/photo_avatar.dart';

class BlogCategoryForm extends StatefulWidget {
  final BlogCategory? category;
  final List<BlogCategory> existing;

  final int? postCount;

  const BlogCategoryForm({super.key, this.category, required this.existing, this.postCount});

  @override
  State<BlogCategoryForm> createState() => _BlogCategoryFormState();
}

class _BlogCategoryFormState extends State<BlogCategoryForm> {
  static const _groups = {
    'Temas': ['🐾', '🩺', '🩹', '💊', '🧠', '❤️', '📚', '💡', '⭐', '🎉', '📰', '❓'],
    'Dia a dia': ['🍖', '🥕', '🦴', '🎾', '🧸', '🛁', '✂️', '🦮', '🏃', '🌳', '🏠', '✈️'],
    'Pets': ['🐶', '🐱', '🐦', '🐟', '🐰', '🐹', '🐢', '🦎'],
  };

  static const _colors = [
    Color(0xFF6F8BDA),
    Color(0xFFE57373),
    Color(0xFF4DB6AC),
    Color(0xFFFFB74D),
    Color(0xFFBA68C8),
    Color(0xFF81C784),
    Color(0xFFF06292),
    Color(0xFFA1887F),
  ];

  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.category?.name ?? '');
  final _customEmoji = TextEditingController();

  late final String _savedImage = CategoryIcon.isImage(widget.category?.icon ?? '') ? widget.category!.icon : '';
  late bool _useImage = _savedImage.isNotEmpty;
  late String _icon = widget.category != null && _savedImage.isEmpty ? widget.category!.icon : '🐾';
  PickedPhoto? _iconPhoto;
  late Color _color = widget.category?.color ?? _colors.first;

  /// Se a categoria já tem uma cor fora da lista (escolhida no site), ela entra na lista.
  /// A cor escolhida em "Outra cor" também entra no começo da lista.
  late final List<Color> _palette = [
    if (widget.category != null && !_colors.any((c) => c.toARGB32() == widget.category!.color.toARGB32()))
      widget.category!.color,
    ..._colors,
  ];
  bool _saving = false;

  /// "Outra cor": escolhe qualquer cor pelos controles de matiz, intensidade e
  /// brilho, ou digitando o código #RRGGBB (o mesmo que o site salva).
  Future<void> _pickCustomColor() async {
    var hsv = HSVColor.fromColor(_color);
    final hex = TextEditingController(text: BlogCategory.toHex(_color));
    String? hexError;

    final picked = await showDialog<Color>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialog) {
          final palette = dialogContext.palette;
          final current = hsv.toColor();

          void setHsv(HSVColor value) => setDialog(() {
            hsv = value;
            hex.text = BlogCategory.toHex(value.toColor());
            hexError = null;
          });

          Widget slider(String label, double value, double max, ValueChanged<double> onChanged, List<Color> track) =>
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: palette.muted),
                  ),
                  Container(
                    height: 10,
                    margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(5),
                      gradient: LinearGradient(colors: track),
                    ),
                  ),
                  Slider(value: value, max: max, onChanged: onChanged),
                ],
              );

          return AlertDialog(
            title: const Text('Outra cor'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    height: 56,
                    decoration: BoxDecoration(
                      color: current,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: palette.border),
                    ),
                  ),
                  const SizedBox(height: 12),
                  slider('Cor', hsv.hue, 360, (v) => setHsv(hsv.withHue(v)), [
                    for (var h = 0; h <= 360; h += 60) HSVColor.fromAHSV(1, h.toDouble(), 1, 1).toColor(),
                  ]),
                  slider('Intensidade', hsv.saturation, 1, (v) => setHsv(hsv.withSaturation(v)), [
                    hsv.withSaturation(0).toColor(),
                    hsv.withSaturation(1).toColor(),
                  ]),
                  slider('Brilho', hsv.value, 1, (v) => setHsv(hsv.withValue(v)), [
                    hsv.withValue(0).toColor(),
                    hsv.withValue(1).toColor(),
                  ]),
                  TextField(
                    controller: hex,
                    maxLength: 7,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(
                      labelText: 'Código da cor',
                      hintText: '#6F8BDA',
                      errorText: hexError,
                      counterText: '',
                    ),
                    onChanged: (text) {
                      final value = text.trim().replaceAll('#', '');
                      final valid = RegExp(r'^[0-9a-fA-F]{6}$').hasMatch(value);
                      setDialog(() {
                        hexError = valid || value.length < 6 ? null : 'Use o formato #RRGGBB';
                        if (valid) hsv = HSVColor.fromColor(BlogCategory.parseColor(value));
                      });
                    },
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancelar')),
              FilledButton(onPressed: () => Navigator.pop(dialogContext, hsv.toColor()), child: const Text('Usar cor')),
            ],
          );
        },
      ),
    );
    hex.dispose();

    if (picked == null || !mounted) return;
    // Guarda só RGB (o banco salva #RRGGBB), para a comparação com a lista bater.
    final color = BlogCategory.parseColor(BlogCategory.toHex(picked));
    setState(() {
      if (!_palette.any((c) => c.toARGB32() == color.toARGB32())) _palette.insert(0, color);
      _color = color;
    });
  }

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
    if (_useImage && _iconPhoto == null && _savedImage.isEmpty) {
      AppFeedback.show(context, 'Escolha uma imagem ou volte para um ícone da lista.', error: true);
      return;
    }
    _run(
      () => BlogService.instance.saveCategory(
        id: widget.category?.id,
        name: _name.text.trim(),
        color: _color,
        icon: _useImage ? _savedImage : _icon,
        iconPhoto: _useImage ? _iconPhoto : null,
      ),
      widget.category == null ? 'Categoria criada! Já aparece no blog. 🐾' : 'Categoria do blog atualizada!',
    );
  }

  Future<void> _pickImage() async {
    try {
      final photo = await pickPhoto(context, maxSide: 256);
      if (photo != null && mounted) setState(() => _iconPhoto = photo);
    } catch (_) {
      if (mounted) AppFeedback.show(context, 'Não foi possível abrir as fotos.', error: true);
    }
  }

  Widget _preview(double size) {
    if (!_useImage) return Text(_icon, style: TextStyle(fontSize: size));
    if (_iconPhoto != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(size * 0.2),
        child: Image.memory(_iconPhoto!.bytes, width: size, height: size, fit: BoxFit.cover),
      );
    }
    if (_savedImage.isNotEmpty) return CategoryIcon(icon: _savedImage, size: size);
    return Icon(Icons.image_outlined, size: size * 0.9, color: context.palette.muted);
  }

  Future<void> _delete() async {
    final category = widget.category!;
    if ((widget.postCount ?? 0) > 0) {
      AppFeedback.show(context, 'Essa categoria tem posts. Só dá para excluir uma categoria sem posts.', error: true);
      return;
    }
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Excluir categoria',
      message: 'Excluir a categoria do blog "${category.name}"?',
      confirmLabel: 'Excluir',
      destructive: true,
    );
    if (confirmed && mounted) _run(() => BlogService.instance.deleteCategory(category.id), 'Categoria excluída.');
  }

  void _useCustomEmoji() {
    final text = _customEmoji.text.trim();
    if (text.isEmpty) return;
    // Pega só o primeiro "caractere visível" (um emoji pode ter vários códigos).
    setState(() {
      _icon = text.characters.first;
      _customEmoji.clear();
    });
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    Widget label(String text) => Text(
      text,
      style: TextStyle(fontWeight: FontWeight.w800, color: palette.text),
    );

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
                widget.category == null ? 'Nova categoria do blog' : 'Editar categoria do blog',
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
                      color: _color.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: _preview(36),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: OutlinedTextField(
                      controller: _name,
                      label: 'Nome',
                      hint: 'Ex.: Saúde',
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
              label('Cor'),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: _palette
                    .map<Widget>((color) {
                      final selected = color.toARGB32() == _color.toARGB32();
                      return Semantics(
                        button: true,
                        selected: selected,
                        label: 'Cor ${BlogCategory.toHex(color)}',
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () => setState(() => _color = color),
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                              border: Border.all(color: selected ? AppColors.orangeStrong : Colors.white, width: 3),
                              boxShadow: [BoxShadow(color: palette.border, spreadRadius: 1)],
                            ),
                            child: selected ? const Icon(Icons.check_rounded, color: Colors.white, size: 20) : null,
                          ),
                        ),
                      );
                    })
                    .followedBy([
                      Tooltip(
                        message: 'Outra cor',
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: _pickCustomColor,
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const SweepGradient(
                                colors: [
                                  Colors.red,
                                  Colors.yellow,
                                  Colors.green,
                                  Colors.cyan,
                                  Colors.blue,
                                  Color(0xFFFF00FF),
                                  Colors.red,
                                ],
                              ),
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: [BoxShadow(color: palette.border, spreadRadius: 1)],
                            ),
                            child: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                          ),
                        ),
                      ),
                    ])
                    .toList(),
              ),
              const SizedBox(height: 18),
              label('Ícone'),
              const SizedBox(height: 10),
              SegmentedButton<bool>(
                showSelectedIcon: false,
                segments: const [
                  ButtonSegment(value: false, icon: Icon(Icons.sell_outlined), label: Text('Ícone da lista')),
                  ButtonSegment(value: true, icon: Icon(Icons.image_outlined), label: Text('Imagem própria')),
                ],
                selected: {_useImage},
                onSelectionChanged: (value) => setState(() => _useImage = value.first),
              ),
              const SizedBox(height: 12),
              if (_useImage)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: palette.softCard,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: palette.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      OutlinedButton.icon(
                        onPressed: _pickImage,
                        icon: const Icon(Icons.image_outlined),
                        label: Text(_iconPhoto != null || _savedImage.isNotEmpty ? 'Trocar imagem' : 'Escolher imagem'),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'A imagem é reduzida para 256 px. Imagens quadradas ficam melhores.',
                        style: TextStyle(fontSize: 12.5, color: palette.muted),
                      ),
                    ],
                  ),
                ),
              if (!_useImage) ...[
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _customEmoji,
                        decoration: const InputDecoration(hintText: 'Digite ou cole outro emoji 🙂', isDense: true),
                        onSubmitted: (_) => _useCustomEmoji(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filledTonal(
                      tooltip: 'Usar este emoji',
                      onPressed: _useCustomEmoji,
                      icon: const Icon(Icons.check_rounded),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
              ],
              if (!_useImage)
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
                            final selected = icon == _icon;
                            return InkWell(
                              borderRadius: BorderRadius.circular(12),
                              onTap: () => setState(() => _icon = icon),
                              child: Container(
                                width: 44,
                                height: 44,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: selected ? _color.withValues(alpha: 0.2) : palette.softCard,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: selected ? _color : Colors.transparent, width: 1.6),
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
              const SizedBox(height: 6),
              Row(
                children: [
                  Text(
                    'Como aparece no blog:',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: palette.muted),
                  ),
                  const SizedBox(width: 10),
                  Flexible(
                    child: ValueListenableBuilder<TextEditingValue>(
                      valueListenable: _name,
                      builder: (context, value, _) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                        decoration: BoxDecoration(
                          color: _color.withValues(alpha: 0.13),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _preview(14),
                            const SizedBox(width: 5),
                            Flexible(
                              child: Text(
                                value.text.trim().isEmpty ? 'Nome da categoria' : value.text.trim(),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: Color.lerp(_color, AppColors.navyDark, 0.25),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
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
