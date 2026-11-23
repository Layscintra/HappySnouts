import 'package:flutter/material.dart';
import 'package:happysnouts/models/product.dart';
import 'package:happysnouts/screens/shop/cart_screen.dart';
import 'package:happysnouts/services/cart_controller.dart';
import 'package:happysnouts/services/favorites_controller.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/product_image.dart';

class ProductDetailsScreen extends StatefulWidget {
  final Product product;
  const ProductDetailsScreen({super.key, required this.product});

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  int _quantity = 1;

  Product get product => widget.product;

  void _addToCart() {
    CartController.add(product, quantity: _quantity);
    AppFeedback.show(context, '$_quantity × ${product.name} adicionado ao carrinho');
  }

  void _buyNow() {
    CartController.add(product, quantity: _quantity);
    Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildImageSection(context),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: palette.title),
                    ),
                    const SizedBox(height: 8),
                    if (product.reviewCount > 0) _buildRatingRow(palette),
                    const SizedBox(height: 12),
                    Text(
                      Formatters.currency(product.price),
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: palette.accent),
                    ),
                    const SizedBox(height: 4),
                    if (product.oldPrice != null)
                      Text(
                        'De ${Formatters.currency(product.oldPrice!)}',
                        style: TextStyle(fontSize: 12, color: palette.muted, decoration: TextDecoration.lineThrough),
                      ),
                    Text(
                      'Frete calculado na finalização: normal ou rápida',
                      style: TextStyle(fontSize: 12, color: palette.muted),
                    ),
                    if (product.description.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Descrição',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: palette.title),
                      ),
                      const SizedBox(height: 6),
                      Text(product.description, style: TextStyle(fontSize: 13, color: palette.text, height: 1.4)),
                    ],
                    if (product.features.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Características',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: palette.title),
                      ),
                      const SizedBox(height: 6),
                      ...product.features.map(
                        (f) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.check_circle, color: AppColors.orange, size: 16),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(f, style: TextStyle(fontSize: 13, color: palette.text)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    _buildQuantityRow(palette),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _addToCart,
                            child: const Text('Adicionar', textAlign: TextAlign.center),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _buyNow,
                            child: const Text('Comprar agora', textAlign: TextAlign.center),
                          ),
                        ),
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

  Widget _buildImageSection(BuildContext context) {
    return Stack(
      children: [
        Container(
          height: 260,
          width: double.infinity,
          color: Colors.white,
          padding: const EdgeInsets.all(32),
          child: Hero(
            tag: 'product-${product.id}',
            child: AppImage(source: product.imageUrl, fallbackIcon: Icons.pets),
          ),
        ),
        Positioned(
          top: 8,
          left: 8,
          child: IconButton(
            tooltip: 'Voltar',
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.navy),
          ),
        ),
        Positioned(
          top: 8,
          right: 8,
          child: ValueListenableBuilder(
            valueListenable: FavoritesController.productIds,
            builder: (context, ids, _) {
              final favorite = ids.contains(product.id);
              return IconButton(
                tooltip: favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos',
                onPressed: () {
                  final added = FavoritesController.toggle(product.id);
                  AppFeedback.show(context, added ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
                },
                icon: Icon(favorite ? Icons.favorite : Icons.favorite_border, color: Colors.redAccent),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildRatingRow(AppPalette palette) {
    return Row(
      children: [
        ...List.generate(
          5,
          (i) => Icon(
            i < product.rating.round() ? Icons.star : Icons.star_border,
            color: AppColors.orangeStrong,
            size: 18,
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            '${product.rating.toStringAsFixed(1).replaceAll('.', ',')} (${product.reviewCount} avaliações)',
            style: TextStyle(fontSize: 12, color: palette.muted),
          ),
        ),
      ],
    );
  }

  Widget _buildQuantityRow(AppPalette palette) {
    return Row(
      children: [
        Text(
          'Quantidade',
          style: TextStyle(fontWeight: FontWeight.bold, color: palette.title),
        ),
        const Spacer(),
        IconButton(
          tooltip: 'Diminuir',
          onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
          icon: const Icon(Icons.remove_circle_outline),
        ),
        Text(
          '$_quantity',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: palette.text),
        ),
        IconButton(
          tooltip: 'Aumentar',
          onPressed: _quantity < CartController.maxQuantityPerItem ? () => setState(() => _quantity++) : null,
          icon: const Icon(Icons.add_circle_outline),
        ),
      ],
    );
  }
}
