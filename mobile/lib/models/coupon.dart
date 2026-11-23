class Coupon {
  final String code;
  final String title;
  final String description;

  /// Desconto percentual sobre o subtotal (0 a 100).
  final double discountPercent;
  final bool freeShipping;
  final double minimumOrder;
  final DateTime validUntil;

  const Coupon({
    required this.code,
    required this.title,
    required this.description,
    required this.validUntil,
    this.discountPercent = 0,
    this.freeShipping = false,
    this.minimumOrder = 0,
  });

  double discountFor(double subtotal) => subtotal * discountPercent / 100;

  /// O cupom vale até o fim do dia [validUntil] (23:59:59), igual ao site (lib/cupons.js).
  bool isExpired([DateTime? now]) {
    final end = DateTime(validUntil.year, validUntil.month, validUntil.day, 23, 59, 59);
    return (now ?? DateTime.now()).isAfter(end);
  }
}
