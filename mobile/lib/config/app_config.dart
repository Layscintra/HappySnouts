class AppConfig {
  AppConfig._();

  static const String appName = 'Happy Snouts';
  static const String appVersion = '1.0.0';

  /// Endereço do backend (pasta backend, `npm run dev`, porta 5000).
  ///
  /// - Emulador Android: o "localhost" do computador é 10.0.2.2.
  /// - Windows, web e simulador iOS: 127.0.0.1 (no Windows, "localhost" pode
  ///   travar tentando IPv6 antes do IPv4).
  /// - Celular físico: use o IP do computador na rede, passando na hora de rodar:
  ///   `flutter run --dart-define=API_URL=http://192.168.0.10:5000`
  static String get apiUrl {
    const fromEnv = String.fromEnvironment('API_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    return 'https://gracious-lightseagreen-gnat-00.hostingersite.com';
  }

  /// De quanto em quanto tempo o app confere se há notificações novas
  /// (pedido mudou de status, resposta do Fale conosco...).
  static const Duration notificationsPollInterval = Duration(seconds: 30);

  static const Duration requestTimeout = Duration(seconds: 15);

  /// Atraso artificial aplicado pelos serviços locais (lib/services/).
  /// Fica zerado no app; pode ser aumentado para visualizar os estados de
  /// carregamento das telas durante o desenvolvimento.
  static Duration localLatency = Duration.zero;
}
