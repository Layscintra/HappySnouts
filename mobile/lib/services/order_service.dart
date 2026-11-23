import 'package:happysnouts/models/address.dart';
import 'package:happysnouts/models/cart_item.dart';
import 'package:happysnouts/models/coupon.dart';
import 'package:happysnouts/models/order.dart';
import 'package:happysnouts/models/product.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/cart_controller.dart';
import 'package:happysnouts/services/notification_service.dart';
import 'package:happysnouts/services/service_exception.dart';

/// Pedidos (rotas /pedidos do backend).
///
/// A compra é finalizada no backend (PUT /carrinho/entrega + POST
/// /carrinho/finalizar), que grava o pedido; a partir daí o funcionário
/// avança as etapas pelo painel e o cliente acompanha em Meus pedidos.
class OrderService {
  OrderService._();
  static final OrderService instance = OrderService._();

  final _api = ApiClient.instance;

  Future<List<Order>> getOrders() async {
    final data = await _api.get('/pedidos');
    return Json.list(data).map(fromJson).toList();
  }

  Future<Order> getOrder(String id) async {
    try {
      final data = await _api.get('/pedidos/$id');
      if (data is! Map<String, dynamic>) throw const ServiceException('Pedido não encontrado.');
      return fromJson(data);
    } on ApiException catch (error) {
      if (error.statusCode == 404) throw const ServiceException('Pedido não encontrado.');
      rethrow;
    }
  }

  Future<Order> placeOrder({
    required List<CartItem> items,
    required Address address,
    required String paymentMethodCode,
    String? cardId,
    int installments = 1,
    required String deliveryType,
    Coupon? coupon,
  }) async {
    if (items.isEmpty) throw const ServiceException('Seu carrinho está vazio.');
    await CartController.synced;

    await _api.put('/carrinho/entrega', {'id_endereco': int.parse(address.id), 'tipo_entrega': deliveryType});
    final subtotal = items.fold<double>(0, (sum, item) => sum + item.subtotal);
    final dynamic data;
    try {
      data = await _api.post('/carrinho/finalizar', {
        'forma_pagamento': paymentMethodCode,
        if (cardId != null) 'id_cartao': int.parse(cardId),
        'parcelas': installments,
        if (coupon != null) 'cupom': coupon.code,
        if (coupon != null) 'desconto': double.parse(coupon.discountFor(subtotal).toStringAsFixed(2)),
        if (coupon?.freeShipping == true) 'frete_gratis': true,
      });
    } on ApiException catch (error) {
      // Ex.: "Alguns produtos não estão mais disponíveis": atualiza o carrinho.
      await CartController.load().catchError((_) {});
      throw ServiceException(error.message);
    }

    final id = Json.text(data is Map ? data['id_pedido'] : null);
    AppEvents.changed(DataTopic.orders);
    NotificationService.instance.refresh();
    if (id.isEmpty) throw const ServiceException('Resposta inesperada do servidor.');
    return getOrder(id);
  }

  /// PATCH /pedidos/:id/cancelar: só antes de sair para entrega.
  Future<Order> cancel(String orderId) async {
    final data = await _api.patch('/pedidos/$orderId/cancelar');
    AppEvents.changed(DataTopic.orders);
    NotificationService.instance.refresh();
    if (data is! Map<String, dynamic>) return getOrder(orderId);
    return fromJson(data);
  }

  Future<List<Order>> getAllOrders({OrderStatus? status}) async {
    final data = await _api.get('/pedidos/admin/todos', query: status == null ? null : {'status': status.apiValue});
    return Json.list(data).map(fromJson).toList();
  }

  Future<OrdersSummary> getSummary() async {
    final data = await _api.get('/pedidos/admin/resumo');
    final map = data is Map ? data : const {};
    final byStatus = map['por_status'] is Map ? map['por_status'] as Map : const {};
    return OrdersSummary(
      byStatus: {for (final s in OrderStatus.values) s: Json.toInt(byStatus[s.apiValue]) ?? 0},
      revenue: Json.toDouble(map['faturamento']) ?? 0,
      revenueToday: Json.toDouble(map['faturamento_hoje']) ?? 0,
      ordersToday: Json.toInt(map['pedidos_hoje']) ?? 0,
    );
  }

  /// PATCH /pedidos/:id/status: o cliente recebe notificação e e-mail.
  Future<Order> updateStatus(String orderId, OrderStatus status, {String note = '', String trackingCode = ''}) async {
    final data = await _api.patch('/pedidos/$orderId/status', {
      'status': status.apiValue,
      if (note.trim().isNotEmpty) 'observacao': note.trim(),
      if (trackingCode.trim().isNotEmpty) 'codigo_rastreio': trackingCode.trim(),
    });
    AppEvents.changed(DataTopic.orders);
    if (data is! Map<String, dynamic>) return getOrder(orderId);
    return fromJson(data);
  }

  /// PATCH /pedidos/:id/pagamento: funcionário confirma, recusa ou estorna.
  Future<Order> updatePaymentStatus(String orderId, PaymentStatus status) async {
    final data = await _api.patch('/pedidos/$orderId/pagamento', {'status': status.apiValue});
    AppEvents.changed(DataTopic.orders);
    if (data is! Map<String, dynamic>) return getOrder(orderId);
    return fromJson(data);
  }

  void clear() {}

  static OrderPayment? _paymentFromJson(dynamic json) {
    if (json is! Map<String, dynamic>) return null;
    final card = json['cartao'] is Map ? json['cartao'] as Map : const {};
    return OrderPayment(
      methodCode: Json.text(json['forma']),
      methodName: Json.text(json['forma_nome']),
      status: PaymentStatusLabel.fromApi(json['status'] as String?),
      installments: Json.toInt(json['parcelas']) ?? 1,
      amount: Json.toDouble(json['valor']) ?? 0,
      cardBrand: Json.text(card['bandeira']),
      cardLast4: Json.text(card['ultimos_digitos']),
      pixCode: Json.text(json['pix_copia_cola']),
      pixExpiresAt: Json.toDate(json['pix_expira_em']),
      paidAt: Json.toDate(json['data_pagamento']),
      nextStatuses: List.unmodifiable(
        (json['proximos_status'] is List ? json['proximos_status'] as List : const []).map(
          (s) => PaymentStatusLabel.fromApi(s as String?),
        ),
      ),
    );
  }

  static Order fromJson(Map<String, dynamic> json) {
    final id = Json.text(json['id_pedido']);
    return Order(
      id: id,
      number: json['numero_pedido'] == null ? null : Json.text(json['numero_pedido']),
      createdAt: Json.toDate(json['data_pedido']) ?? DateTime.now(),
      items: List.unmodifiable(
        Json.list(json['itens']).map(
          (item) => CartItem(
            product: Product(
              id: Json.text(item['id_produto']),
              name: Json.text(item['nome']),
              price: Json.toDouble(item['preco_unico']) ?? 0,
              imageUrl: ApiClient.imageUrl(item['imagem_url'] as String?),
            ),
            quantity: Json.toInt(item['quantidade']) ?? 1,
          ),
        ),
      ),
      address: Address(
        id: '',
        nickname: Json.text(json['apelido']),
        street: Json.text(json['endereco']),
        number: Json.text(json['numero']),
        neighborhood: Json.text(json['bairro']),
        city: Json.text(json['cidade']),
        state: Json.text(json['estado']),
        cep: Json.text(json['cep']),
      ),
      paymentDescription: json['forma_pagamento'] == null ? 'Não informado' : Json.text(json['forma_pagamento']),
      payment: _paymentFromJson(json['pagamento']),
      deliveryType: Json.text(json['tipo_entrega']).isEmpty ? 'normal' : Json.text(json['tipo_entrega']),
      subtotal: Json.toDouble(json['subtotal']) ?? 0,
      freight: Json.toDouble(json['frete']) ?? 0,
      discount: Json.toDouble(json['desconto']) ?? 0,
      serverTotal: Json.toDouble(json['total']),
      couponCode: json['cupom'] == null ? null : Json.text(json['cupom']),
      status: OrderStatusLabel.fromApi(json['status'] as String?),
      history: List.unmodifiable(
        Json.list(json['historico']).map(
          (h) => OrderEvent(
            status: OrderStatusLabel.fromApi(h['status'] as String?),
            date: Json.toDate(h['data_hora']) ?? DateTime.now(),
            note: Json.text(h['observacao']),
            employee: Json.text(h['funcionario']),
          ),
        ),
      ),
      trackingCode: Json.text(json['codigo_rastreio']),
      nextStatuses: List.unmodifiable(
        (json['proximos_status'] is List ? json['proximos_status'] as List : const []).map(
          (s) => OrderStatusLabel.fromApi(s as String?),
        ),
      ),
      customerName: Json.text(json['cliente_nome']),
      customerEmail: Json.text(json['cliente_email']),
      customerPhone: Json.text(json['cliente_telefone']),
    );
  }
}

class OrdersSummary {
  final Map<OrderStatus, int> byStatus;
  final double revenue;
  final double revenueToday;
  final int ordersToday;

  const OrdersSummary({
    required this.byStatus,
    required this.revenue,
    required this.revenueToday,
    required this.ordersToday,
  });

  int get open => (byStatus[OrderStatus.recebido] ?? 0) + (byStatus[OrderStatus.emPreparacao] ?? 0);
}
