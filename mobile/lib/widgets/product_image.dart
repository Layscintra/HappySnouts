import 'package:flutter/material.dart';
import 'package:happysnouts/theme/app_colors.dart';

/// Imagem de produto/post: aceita asset local ou URL vinda do servidor e
/// mostra um ícone neutro enquanto carrega ou se a imagem falhar.
class AppImage extends StatelessWidget {
  final String source;
  final BoxFit fit;
  final IconData fallbackIcon;
  final double? width;
  final double? height;

  const AppImage({
    super.key,
    required this.source,
    this.fit = BoxFit.contain,
    this.fallbackIcon = Icons.pets,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    Widget fallback() => SizedBox(
      width: width,
      height: height,
      child: Icon(fallbackIcon, color: AppColors.orange, size: 36),
    );

    if (source.isEmpty) return fallback();
    if (source.startsWith('http')) {
      return Image.network(source, fit: fit, width: width, height: height, errorBuilder: (_, _, _) => fallback());
    }
    return Image.asset(source, fit: fit, width: width, height: height, errorBuilder: (_, _, _) => fallback());
  }
}
