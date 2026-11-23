import 'package:flutter/foundation.dart';
import 'package:happysnouts/models/cart_item.dart';
import 'package:happysnouts/models/product.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/widgets/app_feedback.dart';

/// Carrinho compartilhado por todas as telas, guardado no banco (rotas /carrinho).
///
/// Segue o mesmo padrão do ThemeController: um ValueNotifier que avisa quem
/// estiver "ouvindo" (ValueListenableBuilder) sempre que o carrinho muda.
/// As alterações aparecem na hora e são enviadas ao backend em seguida, uma
/// de cada vez; no fim o carrinho é recarregado do servidor. Se algo falhar,
/// a mensagem aparece na tela e o carrinho volta ao que está no banco.
class CartController {
  CartController._();

  static final ValueNotifier<List<CartItem>> items = ValueNotifier(const []);

  static const int maxQuantityPerItem = 99;

  /// Valores de frete do backend (FRETE em carrinho.controller.js).
  static const Map<String, double> deliveryFees = {'normal': 10, 'rapida': 20};

  static final _api = ApiClient.instance;
  static Future<void>? _queue;
  static int _pending = 0;

  static int get itemCount => items.value.fold(0, (sum, item) => sum + item.quantity);
  static double get subtotal => items.value.fold(0.0, (sum, item) => sum + item.subtotal);

  static Future<void> load() async {
    final data = await _api.get('/carrinho');
    items.value = List.unmodifiable(Json.list(data is Map ? data['itens'] : null).map(_itemFromJson));
  }

  static Future<void> add(Product product, {int quantity = 1}) {
    final list = [...items.value];
    final index = list.indexWhere((item) => item.product.id == product.id);
    final current = index >= 0 ? list[index].quantity : 0;
    final added = (current + quantity).clamp(1, maxQuantityPerItem) - current;
    if (added <= 0) return Future.value();
    if (index >= 0) {
      list[index] = list[index].copyWith(quantity: current + added);
    } else {
      list.add(CartItem(product: product, quantity: added));
    }
    items.value = List.unmodifiable(list);
    return _sync(() => _api.post('/carrinho/itens', {'id_produto': int.parse(product.id), 'quantidade': added}));
  }

  /// Quantidade 0 ou menor remove o item do carrinho.
  static Future<void> setQuantity(String productId, int quantity) {
    if (quantity <= 0) return remove(productId);
    final value = quantity.clamp(1, maxQuantityPerItem);
    items.value = List.unmodifiable(
      items.value.map((item) {
        if (item.product.id != productId) return item;
        return item.copyWith(quantity: value);
      }),
    );
    return _sync(() => _api.put('/carrinho/itens/$productId', {'quantidade': value}));
  }

  static Future<void> remove(String productId) {
    items.value = List.unmodifiable(items.value.where((item) => item.product.id != productId));
    return _sync(() => _api.delete('/carrinho/itens/$productId'));
  }

  /// Limpa só a cópia local (ao sair da conta ou depois que o backend
  /// finalizou a compra, que já esvazia o carrinho no banco).
  static void clear() {
    items.value = const [];
    _queue = null;
    _pending = 0;
  }

  /// Termina quando todas as alterações já chegaram ao backend.
  /// A finalização da compra espera por isso para não fechar um carrinho incompleto.
  static Future<void> get synced => _queue ?? Future<void>.value();

  static Future<void> _sync(Future<dynamic> Function() request) {
    _pending++;
    final step = (_queue ?? Future<void>.value()).then((_) async {
      try {
        await request();
      } catch (error) {
        AppFeedback.showGlobal(errorMessage(error), error: true);
      } finally {
        if (--_pending == 0) await load().catchError((_) {});
      }
    });
    _queue = step;
    return step;
  }

  static CartItem _itemFromJson(Map<String, dynamic> json) {
    final price = Json.toDouble(json['preco_unico']) ?? 0;
    return CartItem(
      product: Product(
        id: Json.text(json['id_produto']),
        name: Json.text(json['nome']),
        price: price,
        imageUrl: ApiClient.imageUrl(json['imagem_url'] as String?),
        isActive: json['ativo'] == null || Json.toBool(json['ativo']),
      ),
      quantity: Json.toInt(json['quantidade']) ?? 1,
    );
  }
}
