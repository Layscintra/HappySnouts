import 'package:flutter/foundation.dart';
import 'package:happysnouts/models/picked_photo.dart';
import 'package:happysnouts/models/user.dart';
import 'package:happysnouts/services/address_service.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/auth_service.dart';
import 'package:happysnouts/services/cart_controller.dart';
import 'package:happysnouts/services/favorites_controller.dart';
import 'package:happysnouts/services/notification_service.dart';
import 'package:happysnouts/services/order_service.dart';
import 'package:happysnouts/services/preferences_service.dart';

/// Quem entrou: o mesmo login serve para cliente e funcionário.
enum SessionKind { client, employee }

/// Usuário logado, acessível por qualquer tela (mesmo padrão do ThemeController).
///
/// A sessão é o token JWT do backend (vale 8h), salvo no aparelho como o
/// site faz com o localStorage.
class SessionController {
  SessionController._();

  static final ValueNotifier<AppUser?> currentUser = ValueNotifier(null);

  static bool get isLoggedIn => currentUser.value != null;

  static final ValueNotifier<String?> employeeName = ValueNotifier(null);

  static bool get isEmployee => employeeName.value != null;

  /// Chamado quando o token vence no meio do uso; o main() leva para o login.
  static VoidCallback? onExpired;

  /// Chamado no main(): reabre a sessão salva no aparelho, se o token ainda valer.
  static Future<void> restore() async {
    ApiClient.instance.onUnauthorized = _expire;
    final token = PreferencesService.instance.sessionToken;
    if (token == null) return;
    if (ApiClient.isExpired(token)) {
      await PreferencesService.instance.setSessionToken(null);
      return;
    }
    ApiClient.instance.token = token;
    if (ApiClient.instance.tokenData?['tipo'] == 'funcionario') {
      employeeName.value = Json.text(ApiClient.instance.tokenData!['nome']);
      return;
    }
    try {
      await _loadAccount();
      NotificationService.instance.start();
    } catch (error) {
      // Token recusado (401): o _expire já limpou a sessão.
      if (ApiClient.instance.token == null) return;
      // Conta removida do banco: começa do zero.
      if (error is ApiException && error.statusCode == 404) {
        await _clear();
        return;
      }
      // Sem conexão agora: entra com os dados do token e as telas mostram
      // "Tentar novamente" até o backend responder.
      final data = ApiClient.instance.tokenData!;
      final fullName = Json.text(data['nome']);
      currentUser.value = AppUser(
        id: Json.text(data['id']),
        name: AppUser.shortNameFrom(fullName),
        fullName: fullName,
        email: Json.text(data['email']),
        phone: '',
      );
    }
  }

  /// Entra com e-mail e senha. O backend diz se é cliente ou funcionário,
  /// e a tela abre a Home ou o painel da loja conforme o resultado.
  static Future<SessionKind> login(String email, String password) async {
    final token = await AuthService.instance.login(email, password);
    return _start(token);
  }

  static Future<void> register(RegistrationData data) async {
    await AuthService.instance.register(data);
    await login(data.email, data.password);
    if (data.address != null) {
      try {
        await AddressService.instance.save(data.address!.copyWith(isCurrent: true));
      } catch (_) {
        // A conta já foi criada; o endereço pode ser cadastrado depois em Endereços.
      }
    }
    if (data.photo != null) {
      try {
        await updatePhoto(data.photo!);
      } catch (_) {
        // A foto pode ser trocada depois em Meus Dados.
      }
    }
  }

  static Future<void> updatePhoto(PickedPhoto photo) async {
    final current = currentUser.value;
    if (current == null) return;
    currentUser.value = await AuthService.instance.updatePhoto(current, photo);
  }

  static Future<void> updateProfile(AppUser updated) async {
    final current = currentUser.value;
    if (current == null) return;
    currentUser.value = await AuthService.instance.updateProfile(current, updated);
  }

  static Future<void> refresh() async {
    if (ApiClient.instance.token == null) return;
    currentUser.value = await AuthService.instance.getProfile(ApiClient.instance.userId!);
  }

  static Future<void> logout() => _clear();

  static Future<SessionKind> _start(String token) async {
    await _clear();
    ApiClient.instance.token = token;
    await PreferencesService.instance.setSessionToken(token);
    if (ApiClient.instance.tokenData?['tipo'] == 'funcionario') {
      final name = Json.text(ApiClient.instance.tokenData?['nome']);
      employeeName.value = name.isEmpty ? 'Funcionário' : name;
      return SessionKind.employee;
    }
    await _loadAccount();
    NotificationService.instance.start();
    return SessionKind.client;
  }

  static Future<void> _loadAccount() async {
    currentUser.value = await AuthService.instance.getProfile(ApiClient.instance.userId!);
    // Carrinho e favoritos vêm do banco; se falharem, as telas tentam de novo.
    await Future.wait([CartController.load().catchError((_) {}), FavoritesController.load().catchError((_) {})]);
  }

  static Future<void> _clear() async {
    ApiClient.instance.token = null;
    currentUser.value = null;
    employeeName.value = null;
    CartController.clear();
    FavoritesController.clear();
    OrderService.instance.clear();
    NotificationService.instance.stop();
    await PreferencesService.instance.setSessionToken(null);
  }

  static void _expire() {
    final wasLoggedIn = isLoggedIn || isEmployee;
    _clear();
    if (wasLoggedIn) onExpired?.call();
  }
}
