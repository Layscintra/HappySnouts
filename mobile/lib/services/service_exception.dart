import 'package:happysnouts/config/app_config.dart';

/// Erro "amigável" devolvido pelos serviços. A mensagem já vem pronta para
/// ser exibida ao usuário, então as telas não precisam traduzir exceções.
class ServiceException implements Exception {
  final String message;

  const ServiceException(this.message);

  @override
  String toString() => message;
}

String errorMessage(Object error) {
  if (error is ServiceException) return error.message;
  return 'Algo deu errado. Verifique sua conexão e tente novamente.';
}

Future<void> localDelay() async {
  if (AppConfig.localLatency > Duration.zero) {
    await Future<void>.delayed(AppConfig.localLatency);
  }
}
