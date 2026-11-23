import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/models/coupon.dart';
import 'package:happysnouts/services/coupon_service.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/async_views.dart';

class CouponsScreen extends StatefulWidget {
  const CouponsScreen({super.key});

  @override
  State<CouponsScreen> createState() => _CouponsScreenState();
}

class _CouponsScreenState extends State<CouponsScreen> {
  late Future<List<Coupon>> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() => _future = CouponService.instance.getCoupons();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cupons')),
      body: FutureStateBuilder<List<Coupon>>(
        future: _future,
        onRetry: () => setState(_load),
        builder: (context, coupons) {
          if (coupons.isEmpty) {
            return const EmptyView(
              icon: Icons.confirmation_number_outlined,
              title: 'Nenhum cupom disponível no momento',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: coupons.length + 1,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              if (index == coupons.length) {
                return Text(
                  'Copie o código e cole no campo "Cupom de desconto" ao finalizar a compra.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: context.palette.muted),
                );
              }
              return _buildCoupon(coupons[index]);
            },
          );
        },
      ),
    );
  }

  Widget _buildCoupon(Coupon coupon) {
    final palette = context.palette;
    return Container(
      decoration: BoxDecoration(
        color: palette.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.orangeStrong),
      ),
      child: Row(
        children: [
          Container(
            width: 72,
            height: 96,
            decoration: const BoxDecoration(
              color: AppColors.orange,
              borderRadius: BorderRadius.horizontal(left: Radius.circular(13)),
            ),
            child: Icon(coupon.freeShipping ? Icons.local_shipping : Icons.percent, color: Colors.white, size: 32),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    coupon.title,
                    style: TextStyle(fontWeight: FontWeight.bold, color: palette.title),
                  ),
                  const SizedBox(height: 2),
                  Text(coupon.description, style: TextStyle(fontSize: 12, color: palette.text)),
                  const SizedBox(height: 4),
                  Text(
                    'Válido até ${Formatters.date(coupon.validUntil)}',
                    style: TextStyle(fontSize: 11, color: palette.muted),
                  ),
                ],
              ),
            ),
          ),
          TextButton(
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: coupon.code));
              if (mounted) AppFeedback.show(context, 'Código ${coupon.code} copiado');
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.copy, size: 18, color: palette.accent),
                Text(
                  coupon.code,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: palette.accent),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
