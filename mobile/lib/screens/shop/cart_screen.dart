import 'package:flutter/material.dart';
import 'package:happysnouts/models/cart_item.dart';
import 'package:happysnouts/screens/shop/checkout_screen.dart';
import 'package:happysnouts/screens/shop/products_screen.dart';
import 'package:happysnouts/services/cart_controller.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/bottom_nav_bar.dart';
import 'package:happysnouts/widgets/product_image.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // A tela é aberta tanto como aba quanto empilhada (Produtos/Detalhes).
    final isTab = !Navigator.of(context).canPop();
    return Scaffold(
      appBar: AppBar(title: const Text('Carrinho'), automaticallyImplyLeading: !isTab),
      bottomNavigationBar: isTab ? const AppBottomNavBar(currentIndex: 2) : null,
      body: ValueListenableBuilder<List<CartItem>>(
        valueListenable: CartController.items,
        builder: (context, items, _) {
          if (items.isEmpty) {
            return EmptyView(
              icon: Icons.shopping_cart_outlined,
              title: 'Seu carrinho está vazio',
              message: 'Explore os produtos e adicione o que seu pet precisa.',
              actionLabel: 'Ver produtos',
              onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen())),
            );
          }
          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) => _CartItemCard(item: items[index]),
                ),
              ),
              _buildSummaryCard(context, hasUnavailable: items.any((item) => !item.product.isActive)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSummaryCard(BuildContext context, {required bool hasUnavailable}) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: palette.card,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, -2)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            _summaryRow(context, 'Itens (${CartController.itemCount})', Formatters.currency(CartController.subtotal)),
            const SizedBox(height: 6),
            _summaryRow(context, 'Frete', 'Na finalização'),
            const Divider(height: 20),
            _summaryRow(context, 'Subtotal', Formatters.currency(CartController.subtotal), bold: true),
            const SizedBox(height: 16),
            // O backend não finaliza com produto desativado no carrinho (igual ao site).
            if (hasUnavailable) ...[
              Text(
                'Remova os produtos indisponíveis para finalizar.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.w600, fontSize: 13),
              ),
              const SizedBox(height: 8),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: hasUnavailable ? null : () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CheckoutScreen())),
                child: const Text('Finalizar compra'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(BuildContext context, String label, String value, {bool bold = false}) {
    final palette = context.palette;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Flexible(
          child: Text(
            label,
            style: TextStyle(
              color: bold ? palette.text : palette.muted,
              fontWeight: bold ? FontWeight.bold : null,
              fontSize: bold ? 16 : 14,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: bold ? palette.accent : palette.text,
            fontSize: bold ? 16 : 14,
          ),
        ),
      ],
    );
  }
}

class _CartItemCard extends StatelessWidget {
  final CartItem item;

  const _CartItemCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final product = item.product;
    final available = product.isActive;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: palette.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.border),
      ),
      child: Row(
        children: [
          Container(
            height: 64,
            width: 64,
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
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.text),
                ),
                const SizedBox(height: 4),
                Text(
                  Formatters.currency(product.price),
                  style: TextStyle(color: palette.accent, fontWeight: FontWeight.bold, fontSize: 13),
                ),
                // Produto desativado pela loja: avisa e trava a quantidade (igual ao site).
                if (!available)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Indisponível. Remova para finalizar.',
                      style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.w600, fontSize: 12),
                    ),
                  ),
                Row(
                  children: [
                    _qtyButton(
                      Icons.remove_circle_outline,
                      'Diminuir quantidade',
                      available ? () => CartController.setQuantity(product.id, item.quantity - 1) : null,
                    ),
                    Text(
                      '${item.quantity}',
                      style: TextStyle(fontWeight: FontWeight.bold, color: palette.text),
                    ),
                    _qtyButton(
                      Icons.add_circle_outline,
                      'Aumentar quantidade',
                      available && item.quantity < CartController.maxQuantityPerItem
                          ? () => CartController.setQuantity(product.id, item.quantity + 1)
                          : null,
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Remover do carrinho',
            onPressed: () {
              CartController.remove(product.id);
              final messenger = ScaffoldMessenger.of(context);
              messenger.hideCurrentSnackBar();
              messenger.showSnackBar(
                SnackBar(
                  content: Text('${product.name} removido'),
                  action: SnackBarAction(
                    label: 'DESFAZER',
                    onPressed: () => CartController.add(product, quantity: item.quantity),
                  ),
                ),
              );
            },
            icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
          ),
        ],
      ),
    );
  }

  Widget _qtyButton(IconData icon, String tooltip, VoidCallback? onPressed) {
    return IconButton(
      tooltip: tooltip,
      visualDensity: VisualDensity.compact,
      onPressed: onPressed,
      icon: Icon(icon, size: 20, color: onPressed == null ? Colors.grey : AppColors.orangeStrong),
    );
  }
}
