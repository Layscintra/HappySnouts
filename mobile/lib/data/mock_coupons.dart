import 'package:happysnouts/models/coupon.dart';

final List<Coupon> mockCoupons = [
  Coupon(
    code: 'PRIMEIRACOMPRA',
    title: 'Frete Grátis',
    description: 'Frete grátis na sua primeira compra.',
    freeShipping: true,
    validUntil: DateTime(2027, 12, 31),
  ),
  Coupon(
    code: 'AMIGOSNOUTS',
    title: '10% de desconto',
    description: '10% de desconto em pedidos acima de R\$ 100,00.',
    discountPercent: 10,
    minimumOrder: 100,
    validUntil: DateTime(2027, 6, 30),
  ),
];
