import 'package:flutter/material.dart';
import 'package:happysnouts/models/address.dart';
import 'package:happysnouts/models/coupon.dart';
import 'package:happysnouts/models/payment_card.dart';
import 'package:happysnouts/models/payment_method.dart';
import 'package:happysnouts/screens/orders/order_details_screen.dart';
import 'package:happysnouts/screens/profile/addresses_screen.dart';
import 'package:happysnouts/screens/profile/payment_methods_screen.dart';
import 'package:happysnouts/services/address_service.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/cart_controller.dart';
import 'package:happysnouts/services/coupon_service.dart';
import 'package:happysnouts/services/order_service.dart';
import 'package:happysnouts/services/payment_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/tile_card.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> with ReloadOnChange {
  @override
  List<DataTopic> get reloadTopics => const [DataTopic.addresses, DataTopic.cards];

  @override
  void reload() => _loadFuture = _load();

  late Future<void> _loadFuture;
  List<Address> _addresses = [];
  List<PaymentCard> _cards = [];
  Address? _address;
  PaymentCard? _card;
  Coupon? _coupon;
  String _deliveryType = 'normal';

  List<PaymentMethod> _methods = [];
  String _paymentMethod = 'pix';
  int _installments = 1;

  PaymentMethod? get _method => _methods.where((m) => m.code == _paymentMethod).firstOrNull;
  bool get _usesCard => _method?.usesCard ?? false;
  final _couponController = TextEditingController();
  bool _validatingCoupon = false;
  bool _placing = false;

  @override
  void initState() {
    super.initState();
    _loadFuture = _load();
  }

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final results = await Future.wait([
      AddressService.instance.getAddresses(),
      PaymentService.instance.getCards(),
      PaymentService.instance.getMethods(),
    ]);
    _addresses = results[0] as List<Address>;
    _cards = results[1] as List<PaymentCard>;
    _methods = results[2] as List<PaymentMethod>;
    if (_method == null && _methods.isNotEmpty) _paymentMethod = _methods.first.code;
    // Mantém a escolha feita se ela ainda existir; senão usa o padrão.
    _address =
        _addresses.where((a) => a.id == _address?.id).firstOrNull ??
        _addresses.where((a) => a.isCurrent).firstOrNull ??
        _addresses.firstOrNull;
    _card = _cards.where((c) => c.id == _card?.id).firstOrNull ?? _cards.firstOrNull;
  }

  void _reload() => setState(() => _loadFuture = _load());

  double get _subtotal => CartController.subtotal;
  double get _freight => _coupon?.freeShipping == true ? 0 : CartController.deliveryFees[_deliveryType]!;
  double get _discount => _coupon?.discountFor(_subtotal) ?? 0;
  double get _total => _subtotal + _freight - _discount;

  Future<void> _applyCoupon() async {
    final code = _couponController.text.trim();
    if (code.isEmpty) return;
    FocusScope.of(context).unfocus();
    setState(() => _validatingCoupon = true);
    try {
      final coupon = await CouponService.instance.validate(code, _subtotal);
      if (!mounted) return;
      setState(() => _coupon = coupon);
      AppFeedback.show(context, 'Cupom ${coupon.code} aplicado');
    } catch (error) {
      if (!mounted) return;
      AppFeedback.show(context, errorMessage(error), error: true);
    } finally {
      if (mounted) setState(() => _validatingCoupon = false);
    }
  }

  Future<void> _placeOrder() async {
    if (_address == null) {
      AppFeedback.show(context, 'Cadastre um endereço de entrega.', error: true);
      return;
    }
    if (_method == null) {
      AppFeedback.show(context, 'Escolha a forma de pagamento.', error: true);
      return;
    }
    if (_usesCard && _card == null) {
      AppFeedback.show(context, 'Escolha ou adicione um cartão.', error: true);
      return;
    }
    if (CartController.items.value.isEmpty) {
      AppFeedback.show(context, 'Seu carrinho está vazio.', error: true);
      return;
    }

    setState(() => _placing = true);
    try {
      final order = await OrderService.instance.placeOrder(
        items: CartController.items.value,
        address: _address!,
        paymentMethodCode: _paymentMethod,
        cardId: _usesCard ? _card!.id : null,
        installments: _usesCard ? _installments.clamp(1, _method!.maxInstallments) : 1,
        deliveryType: _deliveryType,
        coupon: _coupon,
      );
      if (!mounted) return;
      // Só limpa o carrinho depois que o serviço confirmou o pedido.
      CartController.clear();
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (_) => OrderDetailsScreen(orderId: order.id, order: order, justPlaced: true),
        ),
        (route) => route.isFirst,
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _placing = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  Future<void> _manageAddresses() async {
    await Navigator.push(context, MaterialPageRoute(builder: (_) => const AddressesScreen()));
    if (mounted) _reload();
  }

  Future<void> _manageCards() async {
    await Navigator.push(context, MaterialPageRoute(builder: (_) => const PaymentMethodsScreen()));
    if (mounted) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Finalizar compra')),
      body: FutureStateBuilder<void>(
        future: _loadFuture,
        onRetry: _reload,
        builder: (context, _) {
          return ValueListenableBuilder(
            valueListenable: CartController.items,
            builder: (context, items, _) {
              if (items.isEmpty) {
                return EmptyView(
                  icon: Icons.shopping_cart_outlined,
                  title: 'Seu carrinho está vazio',
                  actionLabel: 'Voltar',
                  onAction: () => Navigator.pop(context),
                );
              }
              return Column(
                children: [
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        _sectionTitle('Endereço de entrega', onManage: _manageAddresses),
                        _buildAddressSection(),
                        const SizedBox(height: 20),
                        _sectionTitle('Tipo de entrega'),
                        _buildDeliverySection(),
                        const SizedBox(height: 20),
                        _sectionTitle('Pagamento', onManage: _usesCard ? _manageCards : null),
                        _buildPaymentSection(),
                        const SizedBox(height: 20),
                        _sectionTitle('Cupom de desconto'),
                        _buildCouponSection(),
                        const SizedBox(height: 20),
                        _sectionTitle('Resumo'),
                        _buildSummary(items.length),
                      ],
                    ),
                  ),
                  _buildConfirmBar(),
                ],
              );
            },
          );
        },
      ),
    );
  }

  Widget _sectionTitle(String title, {VoidCallback? onManage}) {
    final palette = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: palette.title),
            ),
          ),
          if (onManage != null)
            TextButton(
              onPressed: onManage,
              child: Text(
                'Gerenciar',
                style: TextStyle(color: palette.accent, fontWeight: FontWeight.bold),
              ),
            ),
        ],
      ),
    );
  }

  BoxDecoration _cardDecoration(bool selected) {
    final palette = context.palette;
    return BoxDecoration(
      color: palette.card,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: selected ? AppColors.orangeStrong : palette.border, width: selected ? 2 : 1),
    );
  }

  Widget _buildAddressSection() {
    if (_addresses.isEmpty) {
      return _missingTile(
        Icons.location_off_outlined,
        'Nenhum endereço cadastrado',
        'Adicionar endereço',
        _manageAddresses,
      );
    }
    final palette = context.palette;
    return RadioGroup<String>(
      groupValue: _address?.id,
      onChanged: (id) => setState(() => _address = _addresses.firstWhere((a) => a.id == id)),
      child: Column(
        children: _addresses.map((address) {
          final selected = address.id == _address?.id;
          return TileCard(
            margin: const EdgeInsets.only(bottom: 8),
            borderColor: selected ? AppColors.orangeStrong : null,
            borderWidth: selected ? 2 : 1,
            child: RadioListTile<String>(
              value: address.id,
              activeColor: AppColors.orangeStrong,
              title: Text(
                address.nickname.isEmpty ? address.streetLine : '${address.nickname} • ${address.streetLine}',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.text),
              ),
              subtitle: Text(
                '${address.neighborhood} - ${address.city}/${address.state}\nCEP ${address.cep}',
                style: TextStyle(fontSize: 12, color: palette.muted),
              ),
              isThreeLine: true,
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDeliverySection() {
    final palette = context.palette;
    const options = {'normal': ('Normal', 'Até 7 dias úteis'), 'rapida': ('Rápida', 'Até 2 dias úteis')};
    return RadioGroup<String>(
      groupValue: _deliveryType,
      onChanged: (type) => setState(() => _deliveryType = type ?? _deliveryType),
      child: Column(
        children: options.entries.map((option) {
          final selected = option.key == _deliveryType;
          return TileCard(
            margin: const EdgeInsets.only(bottom: 8),
            borderColor: selected ? AppColors.orangeStrong : null,
            borderWidth: selected ? 2 : 1,
            child: RadioListTile<String>(
              value: option.key,
              activeColor: AppColors.orangeStrong,
              title: Text(
                option.value.$1,
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.text),
              ),
              subtitle: Text(option.value.$2, style: TextStyle(fontSize: 12, color: palette.muted)),
              secondary: Text(
                Formatters.currency(CartController.deliveryFees[option.key]!),
                style: TextStyle(fontWeight: FontWeight.bold, color: palette.text),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  static (IconData, String) _methodInfo(PaymentMethod method) {
    switch (method.code) {
      case 'pix':
        return (Icons.pix, 'Pague com o código copia e cola');
      case 'cartao_credito':
        return (
          Icons.credit_card,
          method.maxInstallments > 1 ? 'Em até ${method.maxInstallments}x sem juros' : 'À vista',
        );
      case 'cartao_debito':
        return (Icons.payment, 'À vista, aprovado na hora');
      case 'boleto':
        return (Icons.receipt_long, 'Vence em 3 dias úteis');
      default:
        return (Icons.payments_outlined, '');
    }
  }

  String get _paymentSummary {
    final method = _method;
    if (method == null) return 'Escolha a forma de pagamento';
    if (method.maxInstallments > 1 && _installments > 1) {
      return '${method.name}: $_installments× de ${Formatters.currency(_total / _installments)} sem juros';
    }
    return 'Pagamento via ${method.name}${method.usesCard ? ' • à vista' : ''}';
  }

  Widget _buildPaymentSection() {
    final palette = context.palette;
    if (_methods.isEmpty) {
      return Text(
        'Nenhuma forma de pagamento disponível no momento.',
        style: TextStyle(fontSize: 13, color: palette.muted),
      );
    }
    final method = _method;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RadioGroup<String>(
          groupValue: _paymentMethod,
          onChanged: (code) => setState(() {
            _paymentMethod = code ?? _paymentMethod;
            _installments = 1;
          }),
          child: Column(
            children: _methods.map((option) {
              final selected = option.code == _paymentMethod;
              final info = _methodInfo(option);
              return TileCard(
                margin: const EdgeInsets.only(bottom: 8),
                borderColor: selected ? AppColors.orangeStrong : null,
                borderWidth: selected ? 2 : 1,
                child: RadioListTile<String>(
                  value: option.code,
                  activeColor: AppColors.orangeStrong,
                  secondary: Icon(info.$1, color: palette.title),
                  title: Text(
                    option.name,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.text),
                  ),
                  subtitle: info.$2.isEmpty
                      ? null
                      : Text(info.$2, style: TextStyle(fontSize: 12, color: palette.muted)),
                ),
              );
            }).toList(),
          ),
        ),
        if (method != null && method.usesCard) ...[
          const SizedBox(height: 8),
          Text(
            method.code == 'cartao_debito' ? 'Qual cartão usar no débito?' : 'Qual cartão usar no crédito?',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.title),
          ),
          const SizedBox(height: 8),
          _buildCardSection(),
          if (_cards.isNotEmpty && method.maxInstallments > 1) ...[
            const SizedBox(height: 4),
            DropdownButtonFormField<int>(
              key: ValueKey(method.code),
              isExpanded: true,
              initialValue: _installments.clamp(1, method.maxInstallments),
              decoration: const InputDecoration(labelText: 'Parcelas'),
              items: List.generate(method.maxInstallments, (i) => i + 1).map((n) {
                final value = Formatters.currency(_total / n);
                return DropdownMenuItem(
                  value: n,
                  child: Text(
                    n == 1 ? '1× de $value (à vista)' : '$n× de $value sem juros',
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              }).toList(),
              onChanged: (n) => setState(() => _installments = n ?? 1),
            ),
          ],
        ],
      ],
    );
  }

  Widget _buildCardSection() {
    if (_cards.isEmpty) {
      return _missingTile(Icons.credit_card_off_outlined, 'Nenhum cartão cadastrado', 'Adicionar cartão', _manageCards);
    }
    final palette = context.palette;
    return RadioGroup<String>(
      groupValue: _card?.id,
      onChanged: (id) => setState(() => _card = _cards.firstWhere((c) => c.id == id)),
      child: Column(
        children: _cards.map((card) {
          final selected = card.id == _card?.id;
          return TileCard(
            margin: const EdgeInsets.only(bottom: 8),
            borderColor: selected ? AppColors.orangeStrong : null,
            borderWidth: selected ? 2 : 1,
            child: RadioListTile<String>(
              value: card.id,
              activeColor: AppColors.orangeStrong,
              secondary: Icon(Icons.credit_card, color: palette.title),
              title: Text(
                '${card.brand} ${card.maskedNumber}',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.text),
              ),
              subtitle: card.expiry.isEmpty
                  ? null
                  : Text('Validade ${card.expiry}', style: TextStyle(fontSize: 12, color: palette.muted)),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _missingTile(IconData icon, String title, String action, VoidCallback onTap) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: _cardDecoration(false),
      child: Row(
        children: [
          Icon(icon, color: palette.muted),
          const SizedBox(width: 12),
          Expanded(
            child: Text(title, style: TextStyle(color: palette.text)),
          ),
          TextButton(onPressed: onTap, child: Text(action)),
        ],
      ),
    );
  }

  Widget _buildCouponSection() {
    final palette = context.palette;
    if (_coupon != null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: _cardDecoration(true),
        child: Row(
          children: [
            const Icon(Icons.confirmation_number_outlined, color: AppColors.green),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                '${_coupon!.code} • ${_coupon!.title}',
                style: TextStyle(fontWeight: FontWeight.bold, color: palette.text),
              ),
            ),
            IconButton(
              tooltip: 'Remover cupom',
              onPressed: () => setState(() {
                _coupon = null;
                _couponController.clear();
              }),
              icon: const Icon(Icons.close),
            ),
          ],
        ),
      );
    }
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _couponController,
            textCapitalization: TextCapitalization.characters,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _applyCoupon(),
            style: TextStyle(color: palette.text),
            decoration: InputDecoration(
              hintText: 'Código do cupom',
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: palette.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppColors.orangeStrong, width: 2),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        OutlinedButton(
          onPressed: _validatingCoupon ? null : _applyCoupon,
          child: _validatingCoupon
              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Aplicar'),
        ),
      ],
    );
  }

  Widget _buildSummary(int lineCount) {
    final palette = context.palette;
    Widget row(String label, String value, {Color? color, bool bold = false}) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(color: bold ? palette.text : palette.muted, fontWeight: bold ? FontWeight.bold : null),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            value,
            style: TextStyle(color: color ?? palette.text, fontWeight: FontWeight.bold, fontSize: bold ? 16 : 14),
          ),
        ],
      ),
    );
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: _cardDecoration(false),
      child: Column(
        children: [
          ...CartController.items.value.map(
            (item) => row('${item.quantity}× ${item.product.name}', Formatters.currency(item.subtotal)),
          ),
          const Divider(),
          row('Subtotal', Formatters.currency(_subtotal)),
          row('Frete', _freight == 0 ? 'Grátis' : Formatters.currency(_freight)),
          if (_discount > 0) row('Desconto', '- ${Formatters.currency(_discount)}', color: AppColors.green),
          const Divider(),
          row('Total', Formatters.currency(_total), color: palette.accent, bold: true),
        ],
      ),
    );
  }

  Widget _buildConfirmBar() {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: BoxDecoration(
        color: palette.card,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, -2)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                _paymentSummary,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: palette.muted),
              ),
            ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _placing || _address == null || _method == null || (_usesCard && _card == null)
                    ? null
                    : _placeOrder,
                child: _placing
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text('Confirmar pedido • ${Formatters.currency(_total)}'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
