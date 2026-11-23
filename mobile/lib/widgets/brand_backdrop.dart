import 'package:flutter/material.dart';

class BrandColors {
  BrandColors._();

  static const brown = Color(0xFF4A2C0E);
  static const brownSoft = Color(0xFF7A5230);
  static const cream = Color(0xFFFFF4E0);
  static const creamLight = Color(0xFFFFF9EE);
  static const orange = Color(0xFFF08A1C);
  static const orangeDark = Color(0xFFE2730C);
  static const orangeLight = Color(0xFFFFB553);

  static const buttonGradient = LinearGradient(colors: [Color(0xFFF7A23B), Color(0xFFE8770F)]);
}

class BrandBackdrop extends StatelessWidget {
  final List<Color> colors;
  final Color blobColor;
  final Color pawColor;
  final Widget child;

  const BrandBackdrop({
    super.key,
    required this.colors,
    required this.blobColor,
    required this.pawColor,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: colors),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(child: CustomPaint(painter: _BlobPainter(blobColor))),
          Positioned(top: 110, left: 14, child: _paw(54, -0.3)),
          Positioned(top: 270, right: 18, child: _paw(46, 0.35)),
          Positioned(bottom: 26, right: 30, child: _paw(44, 0.2)),
          Positioned(bottom: 160, left: 10, child: _paw(30, -0.4)),
          child,
        ],
      ),
    );
  }

  Widget _paw(double size, double angle) => IgnorePointer(
    child: Transform.rotate(
      angle: angle,
      child: Icon(Icons.pets_rounded, size: size, color: pawColor),
    ),
  );
}

class _BlobPainter extends CustomPainter {
  final Color color;

  const _BlobPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final w = size.width;
    final h = size.height;

    final topRight = Path()
      ..moveTo(w * 0.6, 0)
      ..cubicTo(w * 0.7, h * 0.08, w * 0.85, h * 0.04, w * 0.9, h * 0.14)
      ..cubicTo(w * 0.95, h * 0.22, w * 0.9, h * 0.28, w, h * 0.3)
      ..lineTo(w, 0)
      ..close();
    final left = Path()
      ..moveTo(0, h * 0.3)
      ..cubicTo(w * 0.12, h * 0.33, w * 0.1, h * 0.45, w * 0.03, h * 0.5)
      ..lineTo(0, h * 0.52)
      ..close();
    final bottomLeft = Path()
      ..moveTo(0, h * 0.82)
      ..cubicTo(w * 0.25, h * 0.84, w * 0.3, h * 0.95, w * 0.55, h)
      ..lineTo(0, h)
      ..close();
    final topLeft = Path()
      ..moveTo(0, 0)
      ..lineTo(w * 0.32, 0)
      ..cubicTo(w * 0.28, h * 0.05, w * 0.12, h * 0.06, 0, h * 0.1)
      ..close();

    for (final p in [topRight, left, bottomLeft, topLeft]) {
      canvas.drawPath(p, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _BlobPainter oldDelegate) => oldDelegate.color != color;
}

class BrandButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;

  const BrandButton({super.key, required this.label, required this.onPressed, this.loading = false});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: BrandColors.buttonGradient,
          borderRadius: BorderRadius.circular(40),
          boxShadow: [
            BoxShadow(
              color: BrandColors.orangeDark.withValues(alpha: 0.35),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(40),
            onTap: loading ? null : onPressed,
            child: SizedBox(
              height: 58,
              child: loading
                  ? const Center(
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2.6, color: Colors.white),
                      ),
                    )
                  : Stack(
                      alignment: Alignment.center,
                      children: [
                        Text(
                          label,
                          style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w800),
                        ),
                        const Positioned(
                          right: 22,
                          child: Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 24),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
