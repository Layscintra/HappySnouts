import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:happysnouts/config/app_config.dart';
import 'package:happysnouts/models/app_notification.dart';
import 'package:happysnouts/models/care_event.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/care_event_service.dart';
import 'package:happysnouts/services/preferences_service.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

/// Notificações do app em dois níveis:
///
/// 1. Avisos do backend (pedido mudou de status, resposta do Fale conosco...):
///    o app confere a rota /notificacoes enquanto está aberto e mostra cada
///    aviso novo como notificação do celular.
/// 2. Lembretes dos pets (vacina, consulta, remédio...): agendados no próprio
///    celular, então tocam na hora certa mesmo com o app fechado.
///
/// O e-mail é enviado pelo backend junto com o aviso.
class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final _api = ApiClient.instance;
  final _plugin = FlutterLocalNotificationsPlugin();

  final ValueNotifier<List<AppNotification>> items = ValueNotifier(const []);
  final ValueNotifier<int> unreadCount = ValueNotifier(0);

  /// Desligado nos testes (não deixa timers rodando).
  bool autoPoll = true;

  /// Chamado ao tocar numa notificação do celular (o main() faz a navegação).
  void Function(String payload)? onTap;

  bool _pluginReady = false;
  Timer? _timer;
  AppLifecycleListener? _lifecycle;
  bool _fetching = false;

  static const _channelOrders = AndroidNotificationDetails(
    'pedidos',
    'Pedidos e atendimento',
    channelDescription: 'Mudanças de status dos pedidos e respostas da equipe',
    importance: Importance.high,
    priority: Priority.high,
    color: Color(0xFFF7941C),
  );

  static const _channelReminders = AndroidNotificationDetails(
    'lembretes',
    'Lembretes dos pets',
    channelDescription: 'Vacinas, consultas, remédios e banhos agendados',
    importance: Importance.high,
    priority: Priority.high,
    color: Color(0xFF0B2B68),
  );

  /// IDs das notificações agendadas dos lembretes (para não colidir com os avisos).
  static const _reminderIdBase = 500000;

  bool get _supportsSystemNotifications => !kIsWeb;

  /// Prepara o plugin. Chamado no main(); falhas não impedem o app de abrir.
  Future<void> init() async {
    if (!_supportsSystemNotifications || _pluginReady) return;
    try {
      tz_data.initializeTimeZones();
      const darwin = DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      );
      await _plugin.initialize(
        settings: const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
          iOS: darwin,
          macOS: darwin,
          linux: LinuxInitializationSettings(defaultActionName: 'Abrir'),
          windows: WindowsInitializationSettings(
            appName: AppConfig.appName,
            appUserModelId: 'HappySnouts.App',
            guid: '7c3b6f2e-5a1d-4e8b-9f0c-2d6a1b3e4f5a',
          ),
        ),
        onDidReceiveNotificationResponse: (response) {
          final payload = response.payload;
          if (payload != null && payload.isNotEmpty) onTap?.call(payload);
        },
      );
      _pluginReady = true;
    } catch (error) {
      debugPrint('Notificações do sistema indisponíveis: $error');
    }
  }

  /// Pede permissão para notificar (Android 13+ e iOS). Chamado depois do login.
  Future<void> requestPermission() async {
    if (!_pluginReady) return;
    try {
      await _plugin
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
      await _plugin.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()?.requestPermissions(
        alert: true,
        badge: true,
        sound: true,
      );
    } catch (_) {}
  }

  void start() {
    stop();
    AppEvents.of(DataTopic.reminders).addListener(_onRemindersChanged);
    if (!autoPoll) return;
    requestPermission();
    refresh();
    syncReminders();
    _timer = Timer.periodic(AppConfig.notificationsPollInterval, (_) => refresh());
    _lifecycle = AppLifecycleListener(onResume: refresh);
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _lifecycle?.dispose();
    _lifecycle = null;
    AppEvents.of(DataTopic.reminders).removeListener(_onRemindersChanged);
    items.value = const [];
    unreadCount.value = 0;
    if (_pluginReady) {
      _plugin.cancelAll().catchError((_) {});
    }
  }

  void _onRemindersChanged() {
    if (autoPoll) syncReminders();
  }

  Future<void> refresh() async {
    if (_fetching || _api.token == null || _api.tokenData?['tipo'] != 'cliente') return;
    _fetching = true;
    try {
      final data = await _api.get('/notificacoes');
      if (data is! Map) return;
      final list = Json.list(data['notificacoes']).map(_fromJson).toList();
      final previous = items.value;
      items.value = List.unmodifiable(list);
      unreadCount.value = Json.toInt(data['nao_lidas']) ?? list.where((n) => !n.read).length;
      await _announceNew(list);

      // Algo mudou desde a última conferência: atualiza as telas abertas.
      final previousIds = previous.map((n) => n.id).toSet();
      final arrived = list.where((n) => !previousIds.contains(n.id)).toList();
      if (previous.isNotEmpty && arrived.isNotEmpty) {
        if (arrived.any((n) => n.type == 'pedido')) AppEvents.changed(DataTopic.orders);
        if (arrived.any((n) => n.type == 'contato')) AppEvents.changed(DataTopic.messages);
      }
      AppEvents.changed(DataTopic.notifications);
    } catch (_) {
      // Sem conexão agora: tenta de novo na próxima rodada.
    } finally {
      _fetching = false;
    }
  }

  Future<void> _announceNew(List<AppNotification> list) async {
    final userId = _api.userId;
    if (userId == null || list.isEmpty) return;
    final prefs = PreferencesService.instance;
    final lastShown = prefs.lastNotificationShown(userId);
    final newest = list.map((n) => n.id).reduce((a, b) => a > b ? a : b);
    await prefs.setLastNotificationShown(userId, newest);
    // Primeira vez neste aparelho: não dispara o histórico todo de uma vez.
    if (lastShown == null) return;
    if (!prefs.notificationsEnabled || !_pluginReady) return;

    final fresh = list.where((n) => n.id > lastShown && !n.read).toList().reversed.take(5);
    for (final n in fresh) {
      try {
        await _plugin.show(
          id: n.id,
          title: n.title,
          body: n.message,
          notificationDetails: const NotificationDetails(
            android: _channelOrders,
            iOS: DarwinNotificationDetails(),
            macOS: DarwinNotificationDetails(),
          ),
          payload: '${n.type}:${n.referenceId ?? ''}',
        );
      } catch (_) {}
    }
  }

  Future<void> markRead(AppNotification notification) async {
    if (notification.read) return;
    items.value = List.unmodifiable(items.value.map((n) => n.id == notification.id ? n.copyWith(read: true) : n));
    unreadCount.value = (unreadCount.value - 1).clamp(0, 1 << 30);
    try {
      await _api.patch('/notificacoes/${notification.id}/lida');
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    items.value = List.unmodifiable(items.value.map((n) => n.copyWith(read: true)));
    unreadCount.value = 0;
    try {
      await _api.patch('/notificacoes/lidas');
    } catch (_) {}
  }

  Future<void> remove(AppNotification notification) async {
    items.value = List.unmodifiable(items.value.where((n) => n.id != notification.id));
    if (!notification.read) unreadCount.value = (unreadCount.value - 1).clamp(0, 1 << 30);
    try {
      await _api.delete('/notificacoes/${notification.id}');
    } catch (_) {}
  }

  /// Reagenda no celular os lembretes futuros dos pets (1 hora antes de cada um).
  Future<void> syncReminders() async {
    if (!_pluginReady || _api.token == null) return;
    try {
      final events = await CareEventService.instance.getUpcoming(days: 60);
      final pending = await _plugin.pendingNotificationRequests();
      for (final p in pending.where((p) => p.id >= _reminderIdBase)) {
        await _plugin.cancel(id: p.id);
      }
      if (!PreferencesService.instance.notificationsEnabled) return;
      for (final event in events) {
        await _scheduleReminder(event);
      }
    } catch (error) {
      debugPrint('Não foi possível agendar os lembretes: $error');
    }
  }

  Future<void> _scheduleReminder(CareEvent event) async {
    final id = int.tryParse(event.id);
    if (id == null) return;
    final now = DateTime.now();
    var when = event.dateTime.subtract(const Duration(hours: 1));
    if (when.isBefore(now)) when = event.dateTime;
    if (when.isBefore(now.add(const Duration(seconds: 5)))) return;
    await _plugin.zonedSchedule(
      id: _reminderIdBase + id,
      title: '${event.type.label} de ${event.petName}',
      body: '${event.title} hoje às ${event.time}. Não esqueça! 🐾',
      scheduledDate: tz.TZDateTime.from(when.toUtc(), tz.UTC),
      notificationDetails: const NotificationDetails(
        android: _channelReminders,
        iOS: DarwinNotificationDetails(),
        macOS: DarwinNotificationDetails(),
      ),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      payload: 'lembrete:${event.id}',
    );
  }

  static AppNotification _fromJson(Map<String, dynamic> json) => AppNotification(
    id: Json.toInt(json['id_notificacao']) ?? 0,
    title: Json.text(json['titulo']),
    message: Json.text(json['mensagem']),
    type: Json.text(json['tipo']),
    referenceId: Json.toInt(json['referencia_id']),
    read: Json.toBool(json['lida']),
    createdAt: Json.toDate(json['data_criacao']) ?? DateTime.now(),
  );
}
