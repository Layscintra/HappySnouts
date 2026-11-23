import 'dart:async';

import 'package:flutter/material.dart';
import 'package:happysnouts/theme/app_colors.dart';

/// Carrossel que passa sozinho a cada [interval] e também aceita arrastar.
/// Ao tocar ou arrastar, a contagem recomeça para não "pular" na mão do usuário.
/// Mostra bolinhas indicando a página atual.
class AutoCarousel extends StatefulWidget {
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final double height;

  /// Fração da largura que cada item ocupa (1 = um por vez; 0.5 = dois visíveis).
  final double viewportFraction;
  final Duration interval;

  const AutoCarousel({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    required this.height,
    this.viewportFraction = 1,
    this.interval = const Duration(seconds: 4),
  });

  @override
  State<AutoCarousel> createState() => _AutoCarouselState();
}

class _AutoCarouselState extends State<AutoCarousel> {
  late final PageController _controller = PageController(viewportFraction: widget.viewportFraction);
  Timer? _timer;
  int _current = 0;

  @override
  void initState() {
    super.initState();
    _restartTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _restartTimer() {
    _timer?.cancel();
    if (widget.itemCount < 2) return;
    _timer = Timer.periodic(widget.interval, (_) {
      if (!_controller.hasClients) return;
      final next = (_current + 1) % widget.itemCount;
      _controller.animateToPage(next, duration: const Duration(milliseconds: 450), curve: Curves.easeInOut);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: widget.height,
          child: Listener(
            onPointerDown: (_) => _restartTimer(),
            child: PageView.builder(
              controller: _controller,
              padEnds: widget.viewportFraction == 1,
              itemCount: widget.itemCount,
              onPageChanged: (index) => setState(() => _current = index),
              itemBuilder: widget.itemBuilder,
            ),
          ),
        ),
        if (widget.itemCount > 1) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(widget.itemCount, (index) {
              final isActive = index == _current;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: isActive ? 18 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: isActive ? AppColors.orange : Colors.grey.shade400,
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
        ],
      ],
    );
  }
}
