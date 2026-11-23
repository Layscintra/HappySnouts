import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/models/order.dart';
import 'package:happysnouts/screens/orders/orders_screen.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/order_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/product_image.dart';

/// Detalhe do pedido com a linha do tempo da entrega. Usada pelo cliente e,
/// com [employee] = true, pelo painel (onde o funcionário avança as etapas).
class OrderDetailsScreen extends StatefulWidget {
  final String orderId;

  final Order? order;

  final bool justPlaced;

  final bool employee;

  const OrderDetailsScreen({
    super.key,
    required this.orderId,
    this.order,
    this.justPlaced = false,
    this.employee = false,
  });

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> with ReloadOnChange {
  late Future<Order> _future;
  bool _busy = false;

  @override
  List<DataTopic> get reloadTopics => const [DataTopic.orders];

  @override
  void initState() {
    super.initState();
    _future = widget.order != null && widget.justPlaced
        ? Future.value(widget.order!)
        : OrderService.instance.getOrder(widget.orderId);
  }

  @override
  void reload() => _future = OrderService.instance.getOrder(widget.orderId);

  Future<void> _cancel(Order order) async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Cancelar pedido',
      message: 'Tem certeza que deseja cancelar o pedido ${order.number}?',
      confirmLabel: 'Cancelar pedido',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    setState(() => _busy = true);
    try {
      final updated = await OrderService.instance.cancel(order.id);
      if (!mounted) return;
      setState(() => _future = Future.value(updated));
      AppFeedback.show(context, 'Pedido cancelado');
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _changeStatus(Order order) async {
    final updated = await showModalBottomSheet<Order>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _StatusSheet(order: order),
    );
    if (updated != null && mounted) {
      setState(() => _future = Future.value(updated));
      AppFeedback.show(context, 'Status atualizado. O cliente foi avisado por notificação e e-mail.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.justPlaced ? 'Pedido confirmado' : 'Detalhes do pedido')),
      body: FutureBuilder<Order>(
        future: _future,
        initialData: widget.order,
        builder: (context, snapshot) {
          if (snapshot.hasError && !snapshot.hasData) {
            return ErrorView(message: errorMessage(snapshot.error!), onRetry: () => setState(reload));
          }
          if (!snapshot.hasData) return const LoadingView();
          return _buildBody(snapshot.data!);
        },
      ),
    );
  }

  Widget _buildBody(Order order) {
    final palette = context.palette;
    return RefreshIndicator(
      onRefresh: () async {
        setState(reload);
        await _future.catchError((_) => order);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          if (widget.justPlaced) _buildSuccessBanner(order),
          _buildHeader(order),
          const SizedBox(height: 14),
          _buildTimeline(order),
          if (widget.employee) ...[
            const SizedBox(height: 14),
            _section('Cliente', [
              _infoRow(Icons.person_outline_rounded, order.customerName),
              if (order.customerEmail.isNotEmpty) _infoRow(Icons.mail_outline_rounded, order.customerEmail),
              if (order.customerPhone.isNotEmpty) _infoRow(Icons.phone_outlined, Formatters.phone(order.customerPhone)),
            ]),
          ],
          const SizedBox(height: 14),
          _section('Itens', [
            ...order.items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: palette.border),
                      ),
                      child: AppImage(source: item.product.imageUrl),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.product.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: palette.text, fontWeight: FontWeight.w600, fontSize: 13.5),
                          ),
                          Text(
                            '${item.quantity} × ${Formatters.currency(item.product.price)}',
                            style: TextStyle(color: palette.muted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      Formatters.currency(item.subtotal),
                      style: TextStyle(color: palette.text, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
            ),
          ]),
          const SizedBox(height: 14),
          _section('Entrega', [
            _infoRow(
              order.deliveryType == 'rapida' ? Icons.bolt_rounded : Icons.local_shipping_outlined,
              order.deliveryType == 'rapida' ? 'Entrega rápida' : 'Entrega normal',
            ),
            _infoRow(
              Icons.place_outlined,
              '${order.address.streetLine}\n${order.address.neighborhood} - ${order.address.city}/${order.address.state} • CEP ${order.address.cep}',
            ),
            if (order.trackingCode.isNotEmpty)
              InkWell(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: order.trackingCode));
                  AppFeedback.show(context, 'Código de rastreio copiado');
                },
                child: _infoRow(Icons.qr_code_2_rounded, 'Rastreio: ${order.trackingCode}  (toque para copiar)'),
              ),
          ]),
          const SizedBox(height: 14),
          _section('Pagamento', [
            _infoRow(Icons.payments_outlined, order.payment?.description ?? order.paymentDescription),
            if (order.payment != null) ..._buildPaymentStatus(order),
            const SizedBox(height: 6),
            _valueRow('Subtotal', Formatters.currency(order.subtotal)),
            _valueRow('Frete', order.freight == 0 ? 'Grátis' : Formatters.currency(order.freight)),
            if (order.discount > 0)
              _valueRow(
                'Desconto${order.couponCode == null ? '' : ' (${order.couponCode})'}',
                '- ${Formatters.currency(order.discount)}',
              ),
            Divider(height: 20, color: palette.border),
            _valueRow('Total', Formatters.currency(order.total), bold: true),
          ]),
          const SizedBox(height: 20),
          if (widget.employee && order.nextStatuses.isNotEmpty)
            LoadingButton(
              label: 'Atualizar status',
              icon: Icons.sync_alt_rounded,
              loading: _busy,
              onPressed: () => _changeStatus(order),
            ),
          if (!widget.employee && order.status.isOpen)
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.red,
                side: const BorderSide(color: AppColors.red),
              ),
              onPressed: _busy ? null : () => _cancel(order),
              child: _busy
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Cancelar pedido'),
            ),
          if (widget.justPlaced) ...[
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () =>
                  Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const OrdersScreen())),
              child: const Text('Ver meus pedidos'),
            ),
            TextButton(
              onPressed: () => Navigator.popUntil(context, (route) => route.isFirst),
              child: const Text('Continuar comprando'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSuccessBanner(Order order) {
    final palette = context.palette;
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: AppColors.green.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(18)),
      child: Column(
        children: [
          const Icon(Icons.check_circle_rounded, color: AppColors.green, size: 52),
          const SizedBox(height: 8),
          Text(
            'Pedido ${order.number} recebido!',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17, color: palette.text),
          ),
          const SizedBox(height: 6),
          Text(
            'Enviamos a confirmação para o seu e-mail. Você recebe um aviso a cada etapa da entrega.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: palette.muted, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(Order order) {
    final palette = context.palette;
    final color = orderStatusColor(order.status);
    return AppCard(
      child: Row(
        children: [
          IconBadge(icon: orderStatusIcon(order.status), color: color, size: 50),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Pedido ${order.number}',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17, color: palette.title),
                ),
                const SizedBox(height: 2),
                Text(
                  'Feito em ${Formatters.dateTime(order.createdAt)}',
                  style: TextStyle(fontSize: 12.5, color: palette.muted),
                ),
              ],
            ),
          ),
          StatusPill(label: order.status.label, color: color),
        ],
      ),
    );
  }

  Widget _buildTimeline(Order order) {
    final palette = context.palette;
    final cancelled = order.status == OrderStatus.cancelado;
    final steps = cancelled ? [...order.history.map((e) => e.status).toSet()] : OrderStatusLabel.flow;
    final current = cancelled ? steps.length - 1 : OrderStatusLabel.flow.indexOf(order.status);
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Acompanhe seu pedido',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: palette.title),
          ),
          const SizedBox(height: 14),
          ...List.generate(steps.length, (i) {
            final step = steps[i];
            final done = i <= current;
            final color = done
                ? orderStatusColor(cancelled && i == current ? OrderStatus.cancelado : step)
                : palette.border;
            final date = order.dateOf(step);
            final note = order.history
                .where((e) => e.status == step && e.note.isNotEmpty)
                .map((e) => e.note)
                .lastOrNull;
            return IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: done ? color : Colors.transparent,
                          shape: BoxShape.circle,
                          border: Border.all(color: color, width: 2),
                        ),
                        child: Icon(
                          done ? (i == current ? orderStatusIcon(step) : Icons.check_rounded) : orderStatusIcon(step),
                          size: 15,
                          color: done ? Colors.white : palette.muted,
                        ),
                      ),
                      if (i < steps.length - 1)
                        Expanded(
                          child: Container(
                            width: 2,
                            margin: const EdgeInsets.symmetric(vertical: 2),
                            color: i < current ? color : palette.border,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 16, top: 3),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            step.label,
                            style: TextStyle(
                              fontWeight: done ? FontWeight.w800 : FontWeight.w600,
                              color: done ? palette.text : palette.muted,
                            ),
                          ),
                          Text(
                            date == null ? step.description : '${step.description} • ${Formatters.dateTime(date)}',
                            style: TextStyle(fontSize: 12, color: palette.muted),
                          ),
                          if (note != null)
                            Text(
                              note,
                              style: TextStyle(fontSize: 12, color: palette.text, fontStyle: FontStyle.italic),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  static Color _paymentColor(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.aprovado:
        return AppColors.green;
      case PaymentStatus.pendente:
        return AppColors.orangeStrong;
      case PaymentStatus.recusado:
      case PaymentStatus.cancelado:
      case PaymentStatus.estornado:
        return AppColors.red;
    }
  }

  List<Widget> _buildPaymentStatus(Order order) {
    final palette = context.palette;
    final payment = order.payment!;
    final color = _paymentColor(payment.status);
    final pixExpired = payment.isPix && payment.status == PaymentStatus.pendente && !payment.pixOpen;
    return [
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Wrap(
          spacing: 8,
          runSpacing: 6,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
              child: Text(
                payment.status.label,
                style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 12),
              ),
            ),
            if (payment.paidAt != null)
              Text(
                'Pago em ${Formatters.dateTime(payment.paidAt!)}',
                style: TextStyle(color: palette.muted, fontSize: 12),
              ),
          ],
        ),
      ),
      if (payment.pixOpen && !widget.employee) _buildPixBox(payment),
      if (pixExpired && !widget.employee)
        _infoRow(
          Icons.timer_off_outlined,
          'O prazo do Pix acabou. Fale com a gente pelo Fale conosco para receber um novo código.',
        ),
      if (payment.status == PaymentStatus.pendente && payment.methodCode == 'boleto' && !widget.employee)
        _infoRow(
          Icons.info_outline_rounded,
          'Assim que o boleto for compensado, a loja confirma o pagamento e você recebe um aviso.',
        ),
      if (widget.employee && payment.nextStatuses.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: payment.nextStatuses.map((status) {
              final positive = status == PaymentStatus.aprovado;
              return positive
                  ? ElevatedButton.icon(
                      onPressed: _busy ? null : () => _changePayment(order, status),
                      icon: const Icon(Icons.check_circle_outline_rounded, size: 18),
                      label: Text(status.actionLabel),
                    )
                  : OutlinedButton(
                      onPressed: _busy ? null : () => _changePayment(order, status),
                      child: Text(status.actionLabel),
                    );
            }).toList(),
          ),
        ),
    ];
  }

  Widget _buildPixBox(OrderPayment payment) {
    final palette = context.palette;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.orangeSoft.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.orange),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Pix copia e cola',
            style: TextStyle(fontWeight: FontWeight.w800, color: palette.title),
          ),
          const SizedBox(height: 4),
          Text(
            'Copie o código e cole na área Pix do app do seu banco.'
            '${payment.pixExpiresAt == null ? '' : ' Válido até ${Formatters.dateTime(payment.pixExpiresAt!)}.'}',
            style: TextStyle(fontSize: 12, color: palette.muted),
          ),
          const SizedBox(height: 8),
          SelectableText(
            payment.pixCode,
            maxLines: 3,
            style: TextStyle(fontSize: 11.5, color: palette.text, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 8),
          ElevatedButton.icon(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: payment.pixCode));
              AppFeedback.show(context, 'Código Pix copiado');
            },
            icon: const Icon(Icons.copy_rounded, size: 18),
            label: const Text('Copiar código Pix'),
          ),
        ],
      ),
    );
  }

  Future<void> _changePayment(Order order, PaymentStatus status) async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: status.actionLabel,
      message: '${status.actionLabel} do pedido ${order.number}? O cliente recebe notificação e e-mail.',
      confirmLabel: status.actionLabel,
      destructive: status != PaymentStatus.aprovado,
    );
    if (!confirmed || !mounted) return;
    setState(() => _busy = true);
    try {
      final updated = await OrderService.instance.updatePaymentStatus(order.id, status);
      if (!mounted) return;
      setState(() => _future = Future.value(updated));
      AppFeedback.show(context, status.label);
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _section(String title, List<Widget> children) {
    final palette = context.palette;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: palette.title),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    final palette = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: palette.muted),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text, style: TextStyle(color: palette.text, height: 1.4, fontSize: 13.5)),
          ),
        ],
      ),
    );
  }

  Widget _valueRow(String label, String value, {bool bold = false}) {
    final palette = context.palette;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(color: bold ? palette.text : palette.muted, fontWeight: bold ? FontWeight.w800 : null),
          ),
          Text(
            value,
            style: TextStyle(
              color: bold ? palette.title : palette.text,
              fontWeight: FontWeight.w800,
              fontSize: bold ? 17 : 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusSheet extends StatefulWidget {
  final Order order;

  const _StatusSheet({required this.order});

  @override
  State<_StatusSheet> createState() => _StatusSheetState();
}

class _StatusSheetState extends State<_StatusSheet> {
  late OrderStatus _status = widget.order.nextStatuses.first;
  final _note = TextEditingController();
  late final _tracking = TextEditingController(text: widget.order.trackingCode);
  bool _saving = false;

  @override
  void dispose() {
    _note.dispose();
    _tracking.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_status == OrderStatus.cancelado) {
      final ok = await AppFeedback.confirm(
        context,
        title: 'Cancelar pedido',
        message: 'O cliente será avisado do cancelamento. Continuar?',
        confirmLabel: 'Cancelar pedido',
        destructive: true,
      );
      if (!ok || !mounted) return;
    }
    setState(() => _saving = true);
    try {
      final updated = await OrderService.instance.updateStatus(
        widget.order.id,
        _status,
        note: _note.text,
        trackingCode: _tracking.text,
      );
      if (mounted) Navigator.pop(context, updated);
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.viewInsetsOf(context).bottom + 20),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Atualizar pedido ${widget.order.number}',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: palette.title),
            ),
            const SizedBox(height: 4),
            Text('Agora: ${widget.order.status.label}', style: TextStyle(color: palette.muted)),
            const SizedBox(height: 16),
            ...widget.order.nextStatuses.map((s) {
              final selected = s == _status;
              final color = orderStatusColor(s);
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Material(
                  color: selected ? color.withValues(alpha: 0.1) : palette.card,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(color: selected ? color : palette.border, width: selected ? 1.6 : 1),
                  ),
                  child: ListTile(
                    onTap: () => setState(() => _status = s),
                    leading: IconBadge(icon: orderStatusIcon(s), color: color, size: 38),
                    title: Text(
                      s.label,
                      style: TextStyle(fontWeight: FontWeight.w800, color: palette.text),
                    ),
                    subtitle: Text(s.description),
                    trailing: Icon(
                      selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                      color: selected ? color : palette.muted,
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: 8),
            if (_status == OrderStatus.enviado) ...[
              TextField(
                controller: _tracking,
                decoration: const InputDecoration(
                  labelText: 'Código de rastreio (opcional)',
                  prefixIcon: Icon(Icons.qr_code_2_rounded),
                ),
              ),
              const SizedBox(height: 12),
            ],
            TextField(
              controller: _note,
              maxLines: 2,
              maxLength: 255,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Mensagem para o cliente (opcional)',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 8),
            LoadingButton(label: 'Salvar e avisar o cliente', loading: _saving, onPressed: _save),
          ],
        ),
      ),
    );
  }
}
