import 'package:flutter/material.dart';
import 'package:happysnouts/models/product.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/product_image.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;
  final VoidCallback? onAddTap;

  const ProductCard({super.key, required this.product, this.onTap, this.onAddTap});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Semantics(
      button: onTap != null,
      child: Material(
        color: AppColors.yellow.withValues(alpha: palette.isDark ? 0.12 : 0.3),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AspectRatio(
                  aspectRatio: 1,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                    child: AppImage(source: product.imageUrl),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  product.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: palette.text, height: 1.2),
                ),
                const Spacer(),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        Formatters.currency(product.price),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: palette.accent, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                    if (onAddTap != null)
                      Semantics(
                        button: true,
                        label: 'Adicionar ${product.name} ao carrinho',
                        child: InkWell(
                          onTap: onAddTap,
                          customBorder: const CircleBorder(),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: palette.accent),
                            ),
                            child: Icon(Icons.add, size: 16, color: palette.accent),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
