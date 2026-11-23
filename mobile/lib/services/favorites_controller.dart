import 'package:flutter/foundation.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/widgets/app_feedback.dart';

/// IDs dos produtos favoritados, compartilhados entre as telas (rotas /favoritos).
/// O coração muda na hora e a alteração é enviada ao backend em seguida.
class FavoritesController {
  FavoritesController._();

  static final ValueNotifier<Set<String>> productIds = ValueNotifier(const {});

  static final _api = ApiClient.instance;

  static bool isFavorite(String productId) => productIds.value.contains(productId);

  static Future<void> load() async {
    final data = await _api.get('/favoritos');
    productIds.value = Set.unmodifiable(Json.list(data).map((f) => Json.text(f['id_produto'])));
  }

  static bool toggle(String productId) {
    final updated = {...productIds.value};
    final added = updated.add(productId);
    if (!added) updated.remove(productId);
    productIds.value = Set.unmodifiable(updated);
    _send(productId, added);
    return added;
  }

  static Future<void> _send(String productId, bool favorite) async {
    try {
      if (favorite) {
        await _api.post('/favoritos', {'id_produto': int.parse(productId)});
      } else {
        await _api.delete('/favoritos/$productId');
      }
    } on ApiException catch (error) {
      // 400 "já está nos favoritos" / 404 "não encontrado" = já estava no estado pedido.
      if (error.statusCode != 400 && error.statusCode != 404) await _revert(error);
    } catch (error) {
      await _revert(error);
    }
  }

  static Future<void> _revert(Object error) async {
    AppFeedback.showGlobal(errorMessage(error), error: true);
    try {
      await load();
    } catch (_) {}
  }

  static void clear() => productIds.value = const {};
}
