import 'package:flutter/material.dart';
import 'package:happysnouts/widgets/devices/smart_kit.dart';

/// Topo em degradê azul-marinho com título branco centralizado (telas da
/// coleira GPS). O azul se dissolve na cor do fundo embaixo, e [child]
/// (normalmente um card) fica por cima dessa transição.
class NavyHeader extends StatelessWidget {
  final String title;
  final Widget? child;
  final bool showBack;

  final Widget? trailing;

  const NavyHeader({super.key, required this.title, this.child, this.showBack = true, this.trailing});

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    final background = SmartColors.of(context).background;
    return Stack(
      children: [
        Container(
          height: top + 150,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                const Color(0xFF061A2E),
                SmartColors.navy,
                SmartColors.navySoft,
                Color.lerp(SmartColors.navySoft, background, 0.6)!,
                background,
              ],
              stops: const [0, 0.35, 0.62, 0.84, 1],
            ),
          ),
        ),
        Padding(
          padding: EdgeInsets.only(top: top),
          child: Column(
            children: [
              SizedBox(
                height: 56,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (showBack)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: IconButton(
                          tooltip: 'Voltar',
                          onPressed: () => Navigator.maybePop(context),
                          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                        ),
                      ),
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 21,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                    if (trailing != null) Align(alignment: Alignment.centerRight, child: trailing),
                  ],
                ),
              ),
              if (child != null) Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 0), child: child),
            ],
          ),
        ),
      ],
    );
  }
}
