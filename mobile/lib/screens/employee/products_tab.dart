import 'dart:async';

import 'package:flutter/material.dart';
import 'package:happysnouts/screens/employee/product_form_screen.dart';
import 'package:happysnouts/services/admin_service.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/category_icon.dart';
import 'package:happysnouts/widgets/product_image.dart';

class ProductsTab extends StatefulWidget {
  const ProductsTab({super.key});

  @override
  State<ProductsTab> createState() => _ProductsTabState();
}

class _ProductsTabState extends State<ProductsTab> with ReloadOnChange {
  late Future<(List<AdminProduct>, List<ProductCategory>)> _future;
  final _search = TextEditingController();
  String _status = 'todos';
  int? _categoryFilter;

  @override
  List<DataTopic> get reloadTopics => const [DataTopic.products, DataTopic.categories];

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
      // Categorias primeiro: os produtos mostram o ícone delas.
      final categories = await AdminService.instance.getCategories();
      final products = await AdminService.instance.getProducts();
      return (products, categories);
    }();
  }

  Future<void> _openProduct(List<ProductCategory> categories, {AdminProduct? product}) async {
    if (categories.isEmpty) {
      AppFeedback.show(context, 'Cadastre uma categoria antes do primeiro produto.', error: true);
      return;
    }
    await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => ProductFormScreen(categories: categories, product: product),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureStateBuilder<(List<AdminProduct>, List<ProductCategory>)>(
      future: _future,
      onRetry: () => setState(reload),
      builder: (context, data) {
        final (products, categories) = data;
        return Scaffold(
          backgroundColor: Colors.transparent,
          floatingActionButton: FloatingActionButton.extended(
            heroTag: 'novo-produto',
            onPressed: () => _openProduct(categories),
            icon: const Icon(Icons.add_rounded),
            label: const Text('Novo produto'),
          ),
          body: _buildList(products, categories),
        );
      },
    );
  }

  Widget _buildList(List<AdminProduct> products, List<ProductCategory> categories) {
    final palette = context.palette;
    final query = _search.text.trim().toLowerCase();
    final list = products.where((p) {
      if (query.isNotEmpty && !p.name.toLowerCase().contains(query) && '${p.id}' != query) return false;
      if (_categoryFilter != null && p.categoryId != _categoryFilter) return false;
      if (_status == 'ativos' && !p.active) return false;
      if (_status == 'desativados' && p.active) return false;
      return true;
    }).toList();
    ProductCategory? categoryOf(int? id) => categories.where((c) => c.id == id).firstOrNull;

    Widget stat(String label, int value, Color color) => Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(14)),
        child: Column(
          children: [
            Text(
              '$value',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: palette.title),
            ),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 11, color: palette.muted),
            ),
          ],
        ),
      ),
    );

    return RefreshIndicator(
      onRefresh: () async {
        setState(reload);
        await _future.catchError((_) => (<AdminProduct>[], <ProductCategory>[]));
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        children: [
          Row(
            children: [
              stat('Total', products.length, AppColors.navy),
              const SizedBox(width: 8),
              stat('Ativos', products.where((p) => p.active).length, AppColors.green),
              const SizedBox(width: 8),
              stat('Desativados', products.where((p) => !p.active).length, AppColors.red),
              const SizedBox(width: 8),
              stat('Promoção', products.where((p) => p.active && p.onSale).length, AppColors.orangeStrong),
            ],
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _search,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search_rounded),
              hintText: 'Buscar por nome ou número',
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<int?>(
                  initialValue: _categoryFilter,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Categoria'),
                  items: [
                    const DropdownMenuItem<int?>(value: null, child: Text('Todas')),
                    ...categories.map(
                      (c) => DropdownMenuItem<int?>(
                        value: c.id,
                        child: Text('${c.emoji} ${c.name}', overflow: TextOverflow.ellipsis),
                      ),
                    ),
                  ],
                  onChanged: (value) => setState(() => _categoryFilter = value),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _status,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Situação'),
                  items: const [
                    DropdownMenuItem(value: 'todos', child: Text('Todas')),
                    DropdownMenuItem(value: 'ativos', child: Text('Ativos')),
                    DropdownMenuItem(value: 'desativados', child: Text('Desativados')),
                  ],
                  onChanged: (value) => setState(() => _status = value ?? 'todos'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (list.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Text(
                products.isEmpty
                    ? 'Nenhum produto cadastrado ainda. Toque em "Novo produto" para começar.'
                    : 'Nenhum produto com esses filtros.',
                textAlign: TextAlign.center,
                style: TextStyle(color: palette.muted),
              ),
            ),
          ...list.map((p) {
            final category = categoryOf(p.categoryId);
            return Opacity(
              opacity: p.active ? 1 : 0.55,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: AppCard(
                  padding: const EdgeInsets.all(10),
                  onTap: () => _openProduct(categories, product: p),
                  child: Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        padding: const EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: palette.border),
                        ),
                        child: AppImage(source: p.imageUrl),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontWeight: FontWeight.w800, color: palette.title),
                            ),
                            const SizedBox(height: 3),
                            Row(
                              children: [
                                CategoryIcon(icon: category?.icon ?? '', size: 14),
                                const SizedBox(width: 4),
                                Flexible(
                                  child: Text(
                                    '${p.category.isEmpty ? 'Sem categoria' : p.category} · #${p.id}${p.active ? '' : ' · Desativado'}',
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontSize: 12, color: palette.muted),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Text(
                              p.onSale
                                  ? '${Formatters.currency(p.promoPrice!)}  (de ${Formatters.currency(p.price)})'
                                  : Formatters.currency(p.price),
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: p.onSale ? palette.accent : palette.text,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right_rounded, color: palette.muted),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
