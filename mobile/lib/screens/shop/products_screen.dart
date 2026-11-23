import 'dart:async';

import 'package:flutter/material.dart';
import 'package:happysnouts/models/product.dart';
import 'package:happysnouts/screens/home/home_screen.dart';
import 'package:happysnouts/screens/shop/cart_screen.dart';
import 'package:happysnouts/screens/shop/product_details_screen.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/cart_controller.dart';
import 'package:happysnouts/services/catalog_service.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/bottom_nav_bar.dart';
import 'package:happysnouts/widgets/product_card.dart';

class ProductsScreen extends StatefulWidget {
  final String initialQuery;

  const ProductsScreen({super.key, this.initialQuery = ''});
  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> with ReloadOnChange {
  @override
  List<DataTopic> get reloadTopics => const [DataTopic.products, DataTopic.categories];

  @override
  void reload() => _load();

  late final _searchController = TextEditingController(text: widget.initialQuery);
  ProductSort _sort = ProductSort.relevance;
  late Future<List<Product>> _future;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = CatalogService.instance.getProducts(query: _searchController.text, sort: _sort);
  }

  /// Espera o usuário parar de digitar antes de buscar, evitando uma
  /// requisição a cada letra.
  void _onSearchChanged(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (mounted) setState(_load);
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const AppBottomNavBar(currentIndex: -1),
      body: Column(
        children: [
          _buildHeader(context),
          _buildSortRow(),
          Expanded(
            child: FutureStateBuilder<List<Product>>(
              future: _future,
              onRetry: () => setState(_load),
              builder: (context, products) {
                if (products.isEmpty) {
                  return EmptyView(
                    icon: Icons.search_off,
                    title: 'Nenhum produto encontrado',
                    message: _searchController.text.isEmpty ? null : 'Tente buscar por outro termo.',
                    actionLabel: _searchController.text.isEmpty ? null : 'Limpar busca',
                    onAction: () {
                      _searchController.clear();
                      setState(_load);
                    },
                  );
                }
                return LayoutBuilder(
                  builder: (context, constraints) {
                    final columns = (constraints.maxWidth / 200).floor().clamp(2, 5);
                    return GridView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                      itemCount: products.length,
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: columns,
                        mainAxisSpacing: 14,
                        crossAxisSpacing: 14,
                        childAspectRatio: 0.66,
                      ),
                      itemBuilder: (context, index) {
                        final product = products[index];
                        return ProductCard(
                          product: product,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => ProductDetailsScreen(product: product)),
                          ),
                          onAddTap: () {
                            CartController.add(product);
                            showAddedToCart(context, product);
                          },
                        );
                      },
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.orange, Theme.of(context).scaffoldBackgroundColor],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Row(
              children: [
                IconButton(
                  tooltip: 'Voltar',
                  onPressed: () => Navigator.maybePop(context),
                  icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
                ),
                const Expanded(
                  child: Text(
                    'Produtos',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
                ValueListenableBuilder(
                  valueListenable: CartController.items,
                  builder: (context, _, _) => IconButton(
                    tooltip: 'Carrinho',
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
                    icon: Badge(
                      isLabelVisible: CartController.itemCount > 0,
                      backgroundColor: AppColors.navy,
                      label: Text('${CartController.itemCount}'),
                      child: const Icon(Icons.shopping_cart, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: palette.card,
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 3)),
                ],
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                textInputAction: TextInputAction.search,
                style: TextStyle(color: palette.text),
                decoration: InputDecoration(
                  hintText: 'Buscar produtos...',
                  hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
                  prefixIcon: const Icon(Icons.search, color: AppColors.orange),
                  suffixIcon: ValueListenableBuilder(
                    valueListenable: _searchController,
                    builder: (context, value, _) => value.text.isEmpty
                        ? const SizedBox.shrink()
                        : IconButton(
                            tooltip: 'Limpar busca',
                            icon: const Icon(Icons.close, color: Colors.grey),
                            onPressed: () {
                              _searchController.clear();
                              setState(_load);
                            },
                          ),
                  ),
                  filled: false,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSortRow() {
    return SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: ProductSort.values.map((sort) {
          final selected = sort == _sort;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(sort.label),
              selected: selected,
              selectedColor: AppColors.orange.withValues(alpha: 0.35),
              onSelected: (_) {
                if (selected) return;
                setState(() {
                  _sort = sort;
                  _load();
                });
              },
            ),
          );
        }).toList(),
      ),
    );
  }
}
