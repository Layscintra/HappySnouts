import 'package:flutter/material.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/widgets/product_image.dart';

/// Ícone de categoria: um emoji (🐾) ou uma imagem enviada pelo funcionário
/// ("/uploads/abc.png"). Nomes de arquivo antigos ("brinquedo.png") viram a patinha.
class CategoryIcon extends StatelessWidget {
  final String icon;
  final double size;

  const CategoryIcon({super.key, required this.icon, this.size = 26});

  static bool isImage(String icon) => icon.startsWith('/uploads') || icon.startsWith('http');

  static String emojiOf(String icon) {
    if (icon.isEmpty || isImage(icon) || RegExp(r'^[\w\s./-]+$').hasMatch(icon)) return '🐾';
    return icon;
  }

  @override
  Widget build(BuildContext context) {
    if (isImage(icon)) {
      return SizedBox(
        width: size,
        height: size,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(size * 0.2),
          child: AppImage(source: ApiClient.imageUrl(icon), fit: BoxFit.contain),
        ),
      );
    }
    return SizedBox(
      width: size,
      height: size,
      child: FittedBox(
        child: Text(emojiOf(icon), style: TextStyle(fontSize: size)),
      ),
    );
  }
}

class CategoryLabel extends StatelessWidget {
  final String icon;
  final String text;
  final TextStyle? style;
  final double iconSize;

  const CategoryLabel({super.key, required this.icon, required this.text, this.style, this.iconSize = 14});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        CategoryIcon(icon: icon, size: iconSize),
        const SizedBox(width: 5),
        Flexible(
          child: Text(text, style: style, overflow: TextOverflow.ellipsis),
        ),
      ],
    );
  }
}
