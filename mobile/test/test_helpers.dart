import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:happysnouts/config/app_config.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/notification_service.dart';
import 'package:happysnouts/services/preferences_service.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'fake_backend.dart';

/// Prepara o ambiente de teste: preferências vazias, sem sessão e um
/// backend falso novo (com a conta de [FakeBackend.email]).
Future<FakeBackend> setUpTestEnvironment() async {
  TestWidgetsFlutterBinding.ensureInitialized();
  AppConfig.localLatency = Duration.zero;
  // Sem timers de notificação rodando durante os testes.
  NotificationService.instance.autoPoll = false;
  SharedPreferences.setMockInitialValues({});
  await PreferencesService.instance.load();
  final backend = FakeBackend();
  ApiClient.instance.httpClient = backend.client;
  await SessionController.logout();
  return backend;
}

Future<void> loginTestUser() async {
  await SessionController.login(FakeBackend.email, FakeBackend.password);
}

Future<void> pumpScreen(
  WidgetTester tester,
  Widget screen, {
  bool dark = false,
  Size size = const Size(400, 800),
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    MaterialApp(
      scaffoldMessengerKey: AppFeedback.messengerKey,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: dark ? ThemeMode.dark : ThemeMode.light,
      home: screen,
    ),
  );
  await tester.pumpAndSettle();
}
