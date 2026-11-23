import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:happysnouts/config/app_config.dart';
import 'package:happysnouts/screens/auth/login_screen.dart';
import 'package:happysnouts/screens/auth/splash_screen.dart';
import 'package:happysnouts/screens/employee/employee_panel_screen.dart';
import 'package:happysnouts/screens/home/home_screen.dart';
import 'package:happysnouts/screens/profile/notifications_screen.dart';
import 'package:happysnouts/services/notification_service.dart';
import 'package:happysnouts/services/preferences_service.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/theme/theme_controller.dart';
import 'package:happysnouts/widgets/app_feedback.dart';

final _navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Barra de status transparente: o topo de cada tela aparece por trás dela.
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarContrastEnforced: false,
    ),
  );
  // Tema e sessão precisam estar carregados antes da primeira tela.
  await PreferencesService.instance.load();
  ThemeController.load();
  await NotificationService.instance.init();
  NotificationService.instance.onTap = (payload) {
    final navigator = _navigatorKey.currentState;
    if (navigator == null || !SessionController.isLoggedIn) return;
    openNotificationPayload(navigator, payload);
  };
  await SessionController.restore();
  // Token vence em 8h; ao expirar volta para o login.
  SessionController.onExpired = () {
    _navigatorKey.currentState?.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
    AppFeedback.showGlobal('Sua sessão expirou. Entre novamente.');
  };
  runApp(const HappySnoutsApp());
}

class HappySnoutsApp extends StatelessWidget {
  const HappySnoutsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: ThemeController.themeMode,
      builder: (context, mode, _) {
        return MaterialApp(
          title: AppConfig.appName,
          debugShowCheckedModeBanner: false,
          navigatorKey: _navigatorKey,
          scaffoldMessengerKey: AppFeedback.messengerKey,
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: mode,
          locale: const Locale('pt', 'BR'),
          supportedLocales: const [Locale('pt', 'BR')],
          localizationsDelegates: GlobalMaterialLocalizations.delegates,
          home: SessionController.isLoggedIn
              ? const HomeScreen()
              : SessionController.isEmployee
              ? const EmployeePanelScreen()
              : const SplashScreen(),
        );
      },
    );
  }
}
