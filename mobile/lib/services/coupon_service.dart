import 'package:happysnouts/data/mock_coupons.dart';
import 'package:happysnouts/models/coupon.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/utils/formatters.dart';

/// Cupons de desconto.
///
/// INTEGRAÇÃO: a validação do cupom deve ser feita pelo backend no momento
/// do pedido; aqui ela é feita localmente com os cupons de lib/data/mock_coupons.dart.
class CouponService {
  CouponService._();
  static final CouponService instance = CouponService._();

  Future<List<Coupon>> getCoupons() async {
    await localDelay();
    return mockCoupons.where((c) => !c.isExpired()).toList();
  }

  Future<Coupon> validate(String code, double subtotal) async {
    await localDelay();
    final normalized = code.trim().toUpperCase();
    final matches = mockCoupons.where((c) => c.code == normalized);
    if (matches.isEmpty) throw const ServiceException('Cupom não encontrado.');
    final coupon = matches.first;
    if (coupon.isExpired()) {
      throw const ServiceException('Este cupom expirou.');
    }
    if (subtotal < coupon.minimumOrder) {
      throw ServiceException('Cupom válido para pedidos a partir de ${Formatters.currency(coupon.minimumOrder)}.');
    }
    return coupon;
  }
}
