import 'package:flutter/material.dart';
import 'package:happysnouts/models/product.dart';
import 'package:happysnouts/screens/shop/product_details_screen.dart';
import 'package:happysnouts/screens/shop/products_screen.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/cart_controller.dart';
import 'package:happysnouts/services/catalog_service.dart';
import 'package:happysnouts/services/favorites_controller.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/product_image.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});
  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> with ReloadOnChange {
  @override
  List<DataTopic> get reloadTopics => const [DataTopic.products];

  @override
  void reload() => _load();

  late Future<List<Product>> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() => _future = CatalogService.instance.getProducts();

  void _remove(Product product) {
    FavoritesController.toggle(product.id);
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: const Text('Removido dos favoritos'),
        action: SnackBarAction(label: 'DESFAZER', onPressed: () => FavoritesController.toggle(product.id)),
      ),
    );
  }

  void _buy(Product product) {
    CartController.add(product);
    AppFeedback.show(context, '${product.name} adicionado ao carrinho');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Meus Favoritos')),
      body: FutureStateBuilder<List<Product>>(
        future: _future,
        onRetry: () => setState(_load),
        builder: (context, products) {
          return ValueListenableBuilder<Set<String>>(
            valueListenable: FavoritesController.productIds,
            builder: (context, ids, _) {
              final favorites = products.where((p) => ids.contains(p.id)).toList();
              if (favorites.isEmpty) {
                return EmptyView(
                  icon: Icons.favorite_border,
                  title: 'Você ainda não tem favoritos',
                  message: 'Toque no coração na página de um produto para salvá-lo aqui.',
                  actionLabel: 'Ver produtos',
                  onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen())),
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: favorites.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, index) => _buildFavoriteCard(favorites[index]),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildFavoriteCard(Product product) {
    final palette = context.palette;
    return Material(
      color: palette.card,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailsScreen(product: product))),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.orangeStrong),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 70,
                width: 70,
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                child: AppImage(source: product.imageUrl),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.title),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      Formatters.currency(product.price),
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.accent),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        IconButton(
                          tooltip: 'Remover dos favoritos',
                          visualDensity: VisualDensity.compact,
                          onPressed: () => _remove(product),
                          icon: const Icon(Icons.favorite, color: Colors.redAccent, size: 22),
                        ),
                        const Spacer(),
                        TextButton.icon(
                          onPressed: () => _buy(product),
                          icon: Icon(Icons.shopping_cart_outlined, color: palette.accent, size: 18),
                          label: Text(
                            'Comprar',
                            style: TextStyle(fontSize: 12, color: palette.accent, fontWeight: FontWeight.bold),
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
}
