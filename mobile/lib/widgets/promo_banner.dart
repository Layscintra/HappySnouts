import 'package:flutter/material.dart';
import 'package:happysnouts/theme/app_colors.dart';

/// Banner da página inicial desenhado em código: sempre na mesma proporção,
/// nítido em qualquer tela e sem esticar imagem.
class PromoBanner extends StatelessWidget {
  final String tag;
  final String title;
  final String subtitle;
  final String cta;
  final String image;
  final List<Color> colors;
  final Color textColor;
  final VoidCallback onTap;

  const PromoBanner({
    super.key,
    required this.tag,
    required this.title,
    required this.subtitle,
    required this.cta,
    required this.image,
    required this.colors,
    required this.onTap,
    this.textColor = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    final onLight = textColor != Colors.white;
    return Semantics(
      button: true,
      label: '$title. $cta',
      child: Material(
        borderRadius: BorderRadius.circular(24),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Ink(
            decoration: BoxDecoration(
              gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: colors),
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final h = constraints.maxHeight;
                return Stack(
                  children: [
                    Positioned(
                      right: -h * 0.25,
                      top: -h * 0.35,
                      child: _bubble(h * 0.95, Colors.white.withValues(alpha: 0.12)),
                    ),
                    Positioned(
                      right: h * 0.55,
                      bottom: -h * 0.45,
                      child: _bubble(h * 0.7, Colors.white.withValues(alpha: 0.08)),
                    ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      top: h * 0.08,
                      child: Image.asset(
                        image,
                        fit: BoxFit.contain,
                        alignment: Alignment.bottomRight,
                        excludeFromSemantics: true,
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.fromLTRB(18, h * 0.1, constraints.maxWidth * 0.42, h * 0.1),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _shrink(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                              decoration: BoxDecoration(
                                color: onLight
                                    ? AppColors.navy.withValues(alpha: 0.1)
                                    : Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                tag,
                                maxLines: 1,
                                style: TextStyle(color: textColor, fontSize: 10.5, fontWeight: FontWeight.w800),
                              ),
                            ),
                          ),
                          Flexible(
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    title,
                                    style: TextStyle(
                                      color: textColor,
                                      fontSize: 21,
                                      height: 1.1,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    subtitle,
                                    style: TextStyle(
                                      color: textColor.withValues(alpha: 0.85),
                                      fontSize: 12.5,
                                      height: 1.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          _shrink(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: onLight ? AppColors.navy : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    cta,
                                    style: TextStyle(
                                      color: onLight ? Colors.white : AppColors.navy,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Icon(
                                    Icons.arrow_forward_rounded,
                                    size: 14,
                                    color: onLight ? Colors.white : AppColors.navy,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  /// Encolhe (sem cortar) em telas muito estreitas.
  Widget _shrink(Widget child) => FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: child);

  Widget _bubble(double size, Color color) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
  );
}
