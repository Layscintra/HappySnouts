import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/services/admin_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/category_icon.dart';
import 'package:happysnouts/widgets/outlined_text_field.dart';
import 'package:happysnouts/widgets/photo_avatar.dart';
import 'package:happysnouts/widgets/product_image.dart';

class ProductFormScreen extends StatefulWidget {
  final List<ProductCategory> categories;
  final AdminProduct? product;

  const ProductFormScreen({super.key, required this.categories, this.product});

  @override
  State<ProductFormScreen> createState() => _ProductFormScreenState();
}

class _ProductFormScreenState extends State<ProductFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.product?.name ?? '');
  late final _description = TextEditingController(text: widget.product?.description ?? '');
  late final _price = TextEditingController(text: _money(widget.product?.price));
  late final _promo = TextEditingController(text: _money(widget.product?.promoPrice));
  late int? _categoryId = widget.categories.any((c) => c.id == widget.product?.categoryId)
      ? widget.product!.categoryId
      : null;
  PickedPhoto? _photo;
  bool _saving = false;

  bool get _isEditing => widget.product != null;

  static String _money(double? value) => value == null ? '' : value.toStringAsFixed(2).replaceAll('.', ',');
  static double? _parse(String text) => double.tryParse(text.trim().replaceAll('.', '').replaceAll(',', '.'));

  @override
  void dispose() {
    for (final c in [_name, _description, _price, _promo]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    try {
      final photo = await pickPhoto(context, maxSide: 900);
      if (photo != null && mounted) setState(() => _photo = photo);
    } catch (_) {
      if (mounted) AppFeedback.show(context, 'Não foi possível abrir as fotos.', error: true);
    }
  }

  Future<void> _save() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    if (_photo == null && (widget.product?.imagePath.isEmpty ?? true)) {
      AppFeedback.show(context, 'Escolha uma imagem para o produto.', error: true);
      return;
    }
    setState(() => _saving = true);
    try {
      await AdminService.instance.saveProduct(
        id: widget.product?.id,
        name: _name.text.trim(),
        description: _description.text.trim(),
        price: _parse(_price.text)!,
        promoPrice: _promo.text.trim().isEmpty ? null : _parse(_promo.text),
        categoryId: _categoryId!,
        currentImagePath: widget.product?.imagePath ?? '',
        photo: _photo,
      );
      if (!mounted) return;
      AppFeedback.show(context, _isEditing ? 'Produto atualizado!' : 'Produto cadastrado! Já aparece na loja. 🐾');
      Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  Future<void> _deactivate() async {
    final product = widget.product!;
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Desativar produto',
      message:
          'Desativar "${product.name}"? Ele some da loja e não pode mais ser comprado. Hoje o sistema não tem como reativar pelo painel.',
      confirmLabel: 'Desativar',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    setState(() => _saving = true);
    try {
      await AdminService.instance.deactivateProduct(product.id);
      if (!mounted) return;
      AppFeedback.show(context, 'Produto desativado.');
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
    final money = [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))];
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Editar produto' : 'Novo produto')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              GestureDetector(
                onTap: _pickPhoto,
                child: Container(
                  height: 190,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: palette.border),
                  ),
                  child: _photo != null
                      ? Image.memory(_photo!.bytes, fit: BoxFit.contain)
                      : AppImage(
                          source: widget.product?.imageUrl ?? '',
                          fallbackIcon: Icons.add_photo_alternate_outlined,
                        ),
                ),
              ),
              TextButton.icon(
                onPressed: _pickPhoto,
                icon: const Icon(Icons.photo_camera_outlined),
                label: Text(
                  _photo != null || (widget.product?.imagePath.isNotEmpty ?? false)
                      ? 'Trocar imagem'
                      : 'Escolher imagem',
                ),
              ),
              if (_isEditing && !widget.product!.active)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: InfoBanner(
                    icon: Icons.visibility_off_outlined,
                    color: AppColors.red,
                    message: 'Este produto está desativado: não aparece na loja e não pode ir para o carrinho.',
                  ),
                ),
              OutlinedTextField(
                controller: _name,
                label: 'Nome',
                hint: 'Ex.: Coleira de couro',
                textCapitalization: TextCapitalization.sentences,
                validator: (v) => (v ?? '').trim().length < 3 ? 'Digite o nome do produto' : null,
              ),
              const SizedBox(height: 12),
              OutlinedTextField(
                controller: _description,
                label: 'Descrição',
                hint: 'Como é o produto, para quem serve...',
                maxLines: 4,
                textCapitalization: TextCapitalization.sentences,
                validator: (v) => (v ?? '').trim().length < 10 ? 'Escreva uma descrição (pelo menos 10 letras)' : null,
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: OutlinedTextField(
                      controller: _price,
                      label: 'Preço (R\$)',
                      hint: '0,00',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: money,
                      validator: (v) => (_parse(v ?? '') ?? 0) > 0 ? null : 'Maior que zero',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedTextField(
                      controller: _promo,
                      label: 'Promoção (R\$)',
                      hint: 'Opcional',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: money,
                      // O carrinho cobra o preço promocional sempre que ele existe.
                      validator: (v) {
                        if ((v ?? '').trim().isEmpty) return null;
                        final promo = _parse(v!);
                        final price = _parse(_price.text) ?? 0;
                        return promo != null && promo > 0 && promo < price ? null : 'Menor que o preço';
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                initialValue: _categoryId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Categoria'),
                items: widget.categories
                    .map(
                      (c) => DropdownMenuItem(
                        value: c.id,
                        child: Row(
                          children: [
                            CategoryIcon(icon: c.icon, size: 20),
                            const SizedBox(width: 10),
                            Flexible(child: Text(c.name, overflow: TextOverflow.ellipsis)),
                          ],
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (value) => setState(() => _categoryId = value),
                validator: (value) => value == null ? 'Escolha a categoria' : null,
              ),
              const SizedBox(height: 24),
              LoadingButton(
                label: _isEditing ? 'Salvar alterações' : 'Cadastrar produto',
                loading: _saving,
                onPressed: _save,
              ),
              if (_isEditing && widget.product!.active) ...[
                const SizedBox(height: 10),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.red,
                    side: const BorderSide(color: AppColors.red),
                  ),
                  onPressed: _saving ? null : _deactivate,
                  child: const Text('Desativar produto'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
