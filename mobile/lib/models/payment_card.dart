/// Cartão salvo. Por segurança, o app guarda apenas os dados exibíveis:
/// número completo e CVV nunca são armazenados.
class PaymentCard {
  final String id;
  final String last4;
  final String brand;
  final String holderName;
  final String expiry;
  final bool isDefault;

  const PaymentCard({
    required this.id,
    required this.last4,
    this.brand = 'Cartão',
    this.holderName = '',
    this.expiry = '',
    this.isDefault = false,
  });

  String get maskedNumber => '•••• $last4';
}
