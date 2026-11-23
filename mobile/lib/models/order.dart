import 'package:happysnouts/models/address.dart';
import 'package:happysnouts/models/cart_item.dart';

enum OrderStatus { recebido, emPreparacao, enviado, entregue, cancelado }

extension OrderStatusLabel on OrderStatus {
  String get label {
    switch (this) {
      case OrderStatus.recebido:
        return 'Recebido';
      case OrderStatus.emPreparacao:
        return 'Em preparação';
      case OrderStatus.enviado:
        return 'A caminho';
      case OrderStatus.entregue:
        return 'Entregue';
      case OrderStatus.cancelado:
        return 'Cancelado';
    }
  }

  String get description {
    switch (this) {
      case OrderStatus.recebido:
        return 'A loja recebeu seu pedido';
      case OrderStatus.emPreparacao:
        return 'Separando e embalando os produtos';
      case OrderStatus.enviado:
        return 'Saiu para entrega';
      case OrderStatus.entregue:
        return 'Pedido entregue';
      case OrderStatus.cancelado:
        return 'Pedido cancelado';
    }
  }

  String get apiValue {
    switch (this) {
      case OrderStatus.recebido:
        return 'recebido';
      case OrderStatus.emPreparacao:
        return 'em_preparacao';
      case OrderStatus.enviado:
        return 'enviado';
      case OrderStatus.entregue:
        return 'entregue';
      case OrderStatus.cancelado:
        return 'cancelado';
    }
  }

  /// Ainda não saiu para entrega (o cliente pode cancelar).
  bool get isOpen => this == OrderStatus.recebido || this == OrderStatus.emPreparacao;

  static OrderStatus fromApi(String? value) =>
      OrderStatus.values.firstWhere((s) => s.apiValue == value, orElse: () => OrderStatus.recebido);

  static const List<OrderStatus> flow = [
    OrderStatus.recebido,
    OrderStatus.emPreparacao,
    OrderStatus.enviado,
    OrderStatus.entregue,
  ];
}

enum OrderFilter { emAndamento, aCaminho, entregues, cancelados }

extension OrderFilterLabel on OrderFilter {
  String get label {
    switch (this) {
      case OrderFilter.emAndamento:
        return 'Em andamento';
      case OrderFilter.aCaminho:
        return 'A caminho';
      case OrderFilter.entregues:
        return 'Entregues';
      case OrderFilter.cancelados:
        return 'Cancelados';
    }
  }

  bool matches(OrderStatus status) {
    switch (this) {
      case OrderFilter.emAndamento:
        return status.isOpen;
      case OrderFilter.aCaminho:
        return status == OrderStatus.enviado;
      case OrderFilter.entregues:
        return status == OrderStatus.entregue;
      case OrderFilter.cancelados:
        return status == OrderStatus.cancelado;
    }
  }
}

enum PaymentStatus { pendente, aprovado, recusado, cancelado, estornado }

extension PaymentStatusLabel on PaymentStatus {
  String get label {
    switch (this) {
      case PaymentStatus.pendente:
        return 'Aguardando pagamento';
      case PaymentStatus.aprovado:
        return 'Pagamento aprovado';
      case PaymentStatus.recusado:
        return 'Pagamento recusado';
      case PaymentStatus.cancelado:
        return 'Pagamento cancelado';
      case PaymentStatus.estornado:
        return 'Pagamento estornado';
    }
  }

  String get actionLabel {
    switch (this) {
      case PaymentStatus.pendente:
        return 'Voltar para pendente';
      case PaymentStatus.aprovado:
        return 'Confirmar pagamento';
      case PaymentStatus.recusado:
        return 'Recusar pagamento';
      case PaymentStatus.cancelado:
        return 'Cancelar pagamento';
      case PaymentStatus.estornado:
        return 'Estornar pagamento';
    }
  }

  String get apiValue => name;

  static PaymentStatus fromApi(String? value) =>
      PaymentStatus.values.firstWhere((s) => s.name == value, orElse: () => PaymentStatus.pendente);
}

class OrderPayment {
  final String methodCode;
  final String methodName;
  final PaymentStatus status;
  final int installments;
  final double amount;
  final String cardBrand;
  final String cardLast4;

  final String pixCode;
  final DateTime? pixExpiresAt;
  final DateTime? paidAt;

  final List<PaymentStatus> nextStatuses;

  const OrderPayment({
    required this.methodCode,
    required this.methodName,
    required this.status,
    this.installments = 1,
    this.amount = 0,
    this.cardBrand = '',
    this.cardLast4 = '',
    this.pixCode = '',
    this.pixExpiresAt,
    this.paidAt,
    this.nextStatuses = const [],
  });

  bool get isPix => methodCode == 'pix';
  bool get hasCard => cardLast4.isNotEmpty;

  String get description => [
    methodName,
    if (hasCard) '$cardBrand •••• $cardLast4',
    if (installments > 1) '${installments}x sem juros',
  ].join(' • ');

  bool get pixOpen =>
      isPix &&
      status == PaymentStatus.pendente &&
      pixCode.isNotEmpty &&
      (pixExpiresAt == null || pixExpiresAt!.isAfter(DateTime.now()));
}

class OrderEvent {
  final OrderStatus status;
  final DateTime date;
  final String note;
  final String employee;

  const OrderEvent({required this.status, required this.date, this.note = '', this.employee = ''});
}

class Order {
  final String id;

  final String number;
  final DateTime createdAt;
  final List<CartItem> items;
  final Address address;
  final String paymentDescription;

  /// Registro do pagamento (null em pedidos antigos, feitos sem forma de pagamento).
  final OrderPayment? payment;

  final String deliveryType;
  final double subtotal;
  final double freight;
  final double discount;
  final double? serverTotal;
  final String? couponCode;
  final OrderStatus status;
  final List<OrderEvent> history;
  final String trackingCode;

  final List<OrderStatus> nextStatuses;

  final String customerName;
  final String customerEmail;
  final String customerPhone;

  const Order({
    required this.id,
    String? number,
    required this.createdAt,
    required this.items,
    required this.address,
    required this.paymentDescription,
    this.payment,
    this.deliveryType = 'normal',
    required this.subtotal,
    required this.freight,
    this.discount = 0,
    this.serverTotal,
    this.couponCode,
    this.status = OrderStatus.recebido,
    this.history = const [],
    this.trackingCode = '',
    this.nextStatuses = const [],
    this.customerName = '',
    this.customerEmail = '',
    this.customerPhone = '',
  }) : number = number ?? '#$id';

  double get total => serverTotal ?? (subtotal + freight - discount);
  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  DateTime? dateOf(OrderStatus step) {
    for (final event in history.reversed) {
      if (event.status == step) return event.date;
    }
    return null;
  }
}
