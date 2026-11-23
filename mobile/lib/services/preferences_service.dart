import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Preferências salvas no próprio aparelho (shared_preferences).
/// Guarda tema, notificações, o token da sessão (como o localStorage do site)
/// e os dados do pet que o backend ainda não tem colunas para guardar.
class PreferencesService {
  PreferencesService._();
  static final PreferencesService instance = PreferencesService._();

  static const _themeKey = 'theme_mode';
  static const _notificationsKey = 'notifications_enabled';
  static const _offersKey = 'offers_enabled';
  static const _sessionTokenKey = 'session_token';
  static const _petExtrasPrefix = 'pet_extras_';

  SharedPreferences? _prefs;

  Future<void> load() async {
    try {
      _prefs = await SharedPreferences.getInstance();
    } catch (_) {
      // Sem armazenamento local o app continua funcionando, só não lembra
      // das preferências na próxima abertura.
      _prefs = null;
    }
  }

  ThemeMode get themeMode => _prefs?.getString(_themeKey) == 'dark' ? ThemeMode.dark : ThemeMode.light;
  Future<void> setThemeMode(ThemeMode mode) async {
    await _prefs?.setString(_themeKey, mode == ThemeMode.dark ? 'dark' : 'light');
  }

  bool get notificationsEnabled => _prefs?.getBool(_notificationsKey) ?? true;
  Future<void> setNotificationsEnabled(bool value) async => _prefs?.setBool(_notificationsKey, value);

  bool get offersEnabled => _prefs?.getBool(_offersKey) ?? false;
  Future<void> setOffersEnabled(bool value) async => _prefs?.setBool(_offersKey, value);

  String? get sessionToken => _prefs?.getString(_sessionTokenKey);
  Future<void> setSessionToken(String? token) async {
    if (token == null) {
      await _prefs?.remove(_sessionTokenKey);
    } else {
      await _prefs?.setString(_sessionTokenKey, token);
    }
  }

  /// Id da última notificação do backend já mostrada no celular (por cliente).
  int? lastNotificationShown(int userId) => _prefs?.getInt('last_notification_$userId');
  Future<void> setLastNotificationShown(int userId, int id) async => _prefs?.setInt('last_notification_$userId', id);

  String? petExtras(String petId) => _prefs?.getString('$_petExtrasPrefix$petId');
  Future<void> setPetExtras(String petId, String? json) async {
    if (json == null) {
      await _prefs?.remove('$_petExtrasPrefix$petId');
    } else {
      await _prefs?.setString('$_petExtrasPrefix$petId', json);
    }
  }
}
