import 'package:flutter/material.dart';
import 'package:happysnouts/theme/app_theme.dart';

/// Card branco (ou escuro no tema escuro) com linhas separadas por divisórias.
/// Usado em Perfil, Configurações e Meus Dados.
class SectionCard extends StatelessWidget {
  final List<Widget> children;
  final Color? dividerColor;

  const SectionCard({super.key, required this.children, this.dividerColor});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Container(
      decoration: BoxDecoration(
        color: palette.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        type: MaterialType.transparency,
        child: Column(
          children: List.generate(children.length, (index) {
            return Column(
              children: [
                children[index],
                if (index != children.length - 1)
                  Divider(height: 1, color: dividerColor ?? palette.border, indent: 16, endIndent: 16),
              ],
            );
          }),
        ),
      ),
    );
  }
}
