import 'dart:async';

import 'package:flutter/material.dart';
import 'package:happysnouts/models/order.dart';
import 'package:happysnouts/screens/orders/order_details_screen.dart';
import 'package:happysnouts/screens/orders/orders_screen.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/notification_service.dart';
import 'package:happysnouts/services/order_service.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';

class OrdersTab extends StatefulWidget {
  const OrdersTab({super.key});

  @override
  State<OrdersTab> createState() => _OrdersTabState();
}

class _OrdersTabState extends State<OrdersTab> with ReloadOnChange {
  late Future<(List<Order>, OrdersSummary)> _future;
  OrderStatus? _status;
  Timer? _timer;

  @override
  List<DataTopic> get reloadTopics => const [DataTopic.orders];

  @override
  void initState() {
    super.initState();
    reload();
    // Pedidos novos aparecem sozinhos enquanto o painel está aberto.
    if (NotificationService.instance.autoPoll) {
      _timer = Timer.periodic(const Duration(seconds: 30), (_) {
        if (mounted) setState(reload);
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  void reload() {
    _future = () async {
      final results = await Future.wait([OrderService.instance.getAllOrders(), OrderService.instance.getSummary()]);
      return (results[0] as List<Order>, results[1] as OrdersSummary);
    }();
  }

  @override
  Widget build(BuildContext context) {
    return FutureStateBuilder<(List<Order>, OrdersSummary)>(
      future: _future,
      onRetry: () => setState(reload),
      builder: (context, data) {
        final (orders, summary) = data;
        final list = _status == null
            ? orders.where((o) => o.status != OrderStatus.cancelado && o.status != OrderStatus.entregue).toList()
            : orders.where((o) => o.status == _status).toList();
        return RefreshIndicator(
          onRefresh: () async {
            setState(reload);
            await _future.catchError((_) => (<Order>[], summary));
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            children: [
              _buildStats(summary),
              const SizedBox(height: 16),
              SizedBox(
                height: 40,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _chip(null, 'A fazer (${summary.open + (summary.byStatus[OrderStatus.enviado] ?? 0)})'),
                    ...OrderStatus.values.map((s) => _chip(s, '${s.label} (${summary.byStatus[s] ?? 0})')),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              if (list.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(top: 40),
                  child: EmptyView(
                    icon: Icons.inbox_outlined,
                    title: 'Nenhum pedido aqui',
                    message: 'Os pedidos feitos no app aparecem nesta lista na hora.',
                  ),
                ),
              ...list.map(
                (order) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: OrderTile(
                    order: order,
                    showCustomer: true,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => OrderDetailsScreen(orderId: order.id, order: order, employee: true),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _chip(OrderStatus? status, String label) => Padding(
    padding: const EdgeInsets.only(right: 8),
    child: ChoiceChip(
      label: Text(label),
      selected: _status == status,
      showCheckmark: false,
      onSelected: (_) => setState(() => _status = status),
    ),
  );

  Widget _buildStats(OrdersSummary summary) {
    Widget stat(String label, String value, IconData icon, Color color) => Expanded(
      child: AppCard(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            IconBadge(icon: icon, color: color, size: 34),
            const SizedBox(height: 8),
            FittedBox(
              child: Text(
                value,
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: context.palette.title),
              ),
            ),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 11.5, color: context.palette.muted),
            ),
          ],
        ),
      ),
    );
    return Column(
      children: [
        Row(
          children: [
            stat(
              'Novos',
              '${summary.byStatus[OrderStatus.recebido] ?? 0}',
              Icons.fiber_new_outlined,
              AppColors.formBlue,
            ),
            const SizedBox(width: 10),
            stat(
              'Preparando',
              '${summary.byStatus[OrderStatus.emPreparacao] ?? 0}',
              Icons.inventory_2_outlined,
              AppColors.orangeStrong,
            ),
            const SizedBox(width: 10),
            stat(
              'A caminho',
              '${summary.byStatus[OrderStatus.enviado] ?? 0}',
              Icons.local_shipping_outlined,
              const Color(0xFF7B5CD6),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            stat('Pedidos hoje', '${summary.ordersToday}', Icons.today_outlined, AppColors.navy),
            const SizedBox(width: 10),
            stat('Vendido hoje', Formatters.currency(summary.revenueToday), Icons.payments_outlined, AppColors.green),
            const SizedBox(width: 10),
            stat('Total vendido', Formatters.currency(summary.revenue), Icons.trending_up_rounded, AppColors.green),
          ],
        ),
      ],
    );
  }
}
