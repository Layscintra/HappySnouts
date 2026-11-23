import 'package:flutter/material.dart';
import 'package:happysnouts/theme/app_theme.dart';

/// Cartão com borda para envolver ListTile/RadioListTile.
/// Usa Material (e não Container com cor) para que o efeito de toque do
/// ListTile continue visível sobre o fundo do cartão.
class TileCard extends StatelessWidget {
  final Widget child;
  final Color? borderColor;
  final double borderWidth;
  final EdgeInsetsGeometry margin;

  const TileCard({
    super.key,
    required this.child,
    this.borderColor,
    this.borderWidth = 1,
    this.margin = EdgeInsets.zero,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Padding(
      padding: margin,
      child: Material(
        color: palette.card,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: borderColor ?? palette.border, width: borderWidth),
        ),
        child: child,
      ),
    );
  }
}
