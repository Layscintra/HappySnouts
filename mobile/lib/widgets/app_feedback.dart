import 'package:flutter/material.dart';

class AppFeedback {
  AppFeedback._();

  /// Ligado ao MaterialApp (scaffoldMessengerKey) para os serviços poderem
  /// avisar de um erro mesmo sem ter o BuildContext de uma tela.
  static final messengerKey = GlobalKey<ScaffoldMessengerState>();

  static void showGlobal(String message, {bool error = false}) {
    final messenger = messengerKey.currentState;
    if (messenger == null) return;
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(SnackBar(content: Text(message), backgroundColor: error ? Colors.red.shade700 : null));
  }

  static void show(BuildContext context, String message, {bool error = false}) {
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(SnackBar(content: Text(message), backgroundColor: error ? Colors.red.shade700 : null));
  }

  static Future<bool> confirm(
    BuildContext context, {
    required String title,
    required String message,
    String confirmLabel = 'Confirmar',
    bool destructive = false,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: destructive ? TextButton.styleFrom(foregroundColor: Colors.red) : null,
            child: Text(confirmLabel),
          ),
        ],
      ),
    );
    return result ?? false;
  }
}
