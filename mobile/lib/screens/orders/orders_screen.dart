import 'package:flutter/material.dart';
import 'package:happysnouts/models/order.dart';
import 'package:happysnouts/screens/orders/order_details_screen.dart';
import 'package:happysnouts/screens/shop/products_screen.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/order_service.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/product_image.dart';

/// Meus pedidos, com filtro por etapa. Atualiza sozinha quando o funcionário
/// muda o status (o aviso chega pelas notificações).
class OrdersScreen extends StatefulWidget {
  final OrderFilter? initialFilter;

  const OrdersScreen({super.key, this.initialFilter});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with ReloadOnChange {
  late OrderFilter? _filter = widget.initialFilter;
  late Future<List<Order>> _future;

  @override
  List<DataTopic> get reloadTopics => const [DataTopic.orders];

  @override
  void initState() {
    super.initState();
    reload();
  }

  @override
  void reload() => _future = OrderService.instance.getOrders();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Meus pedidos')),
      body: Column(
        children: [
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              children: [_filterChip(null, 'Todos'), ...OrderFilter.values.map((f) => _filterChip(f, f.label))],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                setState(reload);
                await _future.catchError((_) => <Order>[]);
              },
              child: FutureStateBuilder<List<Order>>(
                future: _future,
                onRetry: () => setState(reload),
                builder: (context, orders) {
                  final filtered = _filter == null ? orders : orders.where((o) => _filter!.matches(o.status)).toList();
                  if (filtered.isEmpty) {
                    return ListView(
                      children: [
                        const SizedBox(height: 40),
                        EmptyView(
                          icon: Icons.receipt_long_outlined,
                          title: _filter == null
                              ? 'Você ainda não fez nenhum pedido'
                              : 'Nenhum pedido "${_filter!.label}"',
                          message: _filter == null
                              ? 'Quando você comprar, acompanha cada etapa da entrega por aqui.'
                              : null,
                          actionLabel: _filter == null ? 'Ver produtos' : null,
                          onAction: () =>
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen())),
                        ),
                      ],
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, index) => OrderTile(
                      order: filtered[index],
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => OrderDetailsScreen(orderId: filtered[index].id, order: filtered[index]),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(OrderFilter? filter, String label) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: filter == _filter,
        showCheckmark: false,
        onSelected: (_) => setState(() => _filter = filter),
      ),
    );
  }
}

class OrderTile extends StatelessWidget {
  final Order order;
  final VoidCallback onTap;
  final bool showCustomer;

  const OrderTile({super.key, required this.order, required this.onTap, this.showCustomer = false});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final color = orderStatusColor(order.status);
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  showCustomer && order.customerName.isNotEmpty
                      ? '${order.number} • ${order.customerName}'
                      : 'Pedido ${order.number}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: palette.title),
                ),
              ),
              StatusPill(label: order.status.label, color: color, icon: orderStatusIcon(order.status)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '${Formatters.dateTime(order.createdAt)} • ${order.itemCount} ${order.itemCount == 1 ? 'item' : 'itens'}',
            style: TextStyle(fontSize: 12.5, color: palette.muted),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              ...order.items
                  .take(4)
                  .map(
                    (item) => Container(
                      width: 42,
                      height: 42,
                      margin: const EdgeInsets.only(right: 6),
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: palette.border),
                      ),
                      child: AppImage(source: item.product.imageUrl),
                    ),
                  ),
              if (order.items.length > 4)
                Text(
                  '+${order.items.length - 4}',
                  style: TextStyle(color: palette.muted, fontWeight: FontWeight.w700),
                ),
              const Spacer(),
              Text(
                Formatters.currency(order.total),
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: palette.title),
              ),
            ],
          ),
          if (order.status != OrderStatus.cancelado) ...[
            const SizedBox(height: 12),
            OrderProgressBar(status: order.status),
          ],
        ],
      ),
    );
  }
}

class OrderProgressBar extends StatelessWidget {
  final OrderStatus status;

  const OrderProgressBar({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final current = OrderStatusLabel.flow.indexOf(status);
    return Row(
      children: List.generate(OrderStatusLabel.flow.length, (i) {
        return Expanded(
          child: Container(
            height: 5,
            margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
            decoration: BoxDecoration(
              color: i <= current ? orderStatusColor(status) : palette.border,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        );
      }),
    );
  }
}

Color orderStatusColor(OrderStatus status) {
  switch (status) {
    case OrderStatus.recebido:
      return AppColors.formBlue;
    case OrderStatus.emPreparacao:
      return AppColors.orangeStrong;
    case OrderStatus.enviado:
      return const Color(0xFF7B5CD6);
    case OrderStatus.entregue:
      return AppColors.green;
    case OrderStatus.cancelado:
      return AppColors.red;
  }
}

IconData orderStatusIcon(OrderStatus status) {
  switch (status) {
    case OrderStatus.recebido:
      return Icons.receipt_long_outlined;
    case OrderStatus.emPreparacao:
      return Icons.inventory_2_outlined;
    case OrderStatus.enviado:
      return Icons.local_shipping_outlined;
    case OrderStatus.entregue:
      return Icons.check_circle_outline_rounded;
    case OrderStatus.cancelado:
      return Icons.cancel_outlined;
  }
}
