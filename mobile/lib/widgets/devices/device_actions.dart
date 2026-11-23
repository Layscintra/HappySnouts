import 'package:flutter/material.dart';
import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/services/pet_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/devices/smart_kit.dart';

/// Pergunta e desconecta a coleira ([collar]) ou o alimentador do pet.
/// Devolve true se desconectou (a lista de dispositivos recarrega sozinha).
Future<bool> confirmDisconnectDevice(BuildContext context, Pet pet, {required bool collar}) async {
  final device = collar ? 'a coleira GPS' : 'o alimentador automático';
  final code = collar ? pet.collarId : pet.feederId;
  final confirmed = await AppFeedback.confirm(
    context,
    title: collar ? 'Desconectar coleira' : 'Desconectar alimentador',
    message:
        'Desconectar $device${code == null ? '' : ' (código $code)'} de ${prettyName(pet.name)}? '
        'Você pode conectar de novo depois com o mesmo código.',
    confirmLabel: 'Desconectar',
    destructive: true,
  );
  if (!confirmed || !context.mounted) return false;
  try {
    await PetService.instance.disconnectDevice(pet, collar: collar);
    if (context.mounted) AppFeedback.show(context, collar ? 'Coleira desconectada' : 'Alimentador desconectado');
    return true;
  } catch (error) {
    if (context.mounted) AppFeedback.show(context, errorMessage(error), error: true);
    return false;
  }
}

class DisconnectDeviceButton extends StatelessWidget {
  final Pet pet;
  final bool collar;

  const DisconnectDeviceButton({super.key, required this.pet, required this.collar});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      tooltip: 'Opções do aparelho',
      icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
      onSelected: (_) async {
        final done = await confirmDisconnectDevice(context, pet, collar: collar);
        if (done && context.mounted) Navigator.maybePop(context);
      },
      itemBuilder: (_) => [
        PopupMenuItem(
          value: 'desconectar',
          child: Row(
            children: [
              const Icon(Icons.link_off_rounded, color: SmartColors.red, size: 20),
              const SizedBox(width: 10),
              Text(
                collar ? 'Desconectar coleira' : 'Desconectar alimentador',
                style: const TextStyle(color: SmartColors.red, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
