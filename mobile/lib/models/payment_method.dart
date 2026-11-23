class PaymentMethod {
  final String id;

  final String code;
  final String name;

  final bool usesCard;

  final int maxInstallments;

  const PaymentMethod({
    required this.id,
    required this.code,
    required this.name,
    this.usesCard = false,
    this.maxInstallments = 1,
  });
}
