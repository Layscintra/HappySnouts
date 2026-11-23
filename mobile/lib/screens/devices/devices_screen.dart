import 'package:flutter/material.dart';
import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/screens/devices/collar_pairing_screen.dart';
import 'package:happysnouts/screens/devices/feeding_screen.dart';
import 'package:happysnouts/screens/devices/tracker_screen.dart';
import 'package:happysnouts/screens/pets/pet_form_screen.dart';
import 'package:happysnouts/screens/shop/products_screen.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/pet_service.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/bottom_nav_bar.dart';
import 'package:happysnouts/widgets/devices/device_actions.dart';
import 'package:happysnouts/widgets/devices/smart_kit.dart';
import 'package:happysnouts/widgets/gradient_header.dart';
import 'package:happysnouts/widgets/tile_card.dart';

class _Device {
  final Pet pet;
  final bool isCollar;
  final String code;

  const _Device(this.pet, {required this.isCollar, required this.code});

  String get name => isCollar ? 'Coleira rastreadora' : 'Alimentador automático';
  IconData get icon => isCollar ? Icons.sensors : Icons.dining;
}

class DevicesScreen extends StatefulWidget {
  const DevicesScreen({super.key});

  @override
  State<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends State<DevicesScreen> with ReloadOnChange {
  @override
  List<DataTopic> get reloadTopics => const [DataTopic.pets];

  @override
  void reload() => _load();

  late Future<List<Pet>> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() => _future = PetService.instance.getPets();

  List<_Device> _devicesOf(List<Pet> pets) => [
    for (final pet in pets) ...[
      if (pet.collarId != null) _Device(pet, isCollar: true, code: pet.collarId!),
      if (pet.feederId != null) _Device(pet, isCollar: false, code: pet.feederId!),
    ],
  ];

  Future<void> _connect(List<Pet> pets) async {
    if (pets.isEmpty) {
      final created = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const PetFormScreen()));
      if (created == true && mounted) setState(_load);
      return;
    }
    // Tela de pareamento: na coleira, ela já abre o rastreador ao terminar;
    // a lista recarrega sozinha (o pareamento avisa DataTopic.pets).
    await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => CollarPairingScreen(pets: pets)));
  }

  void _open(_Device device) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => device.isCollar ? TrackerScreen(pet: device.pet) : FeedingScreen(pet: device.pet),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const AppBottomNavBar(currentIndex: 1),
      body: Column(
        children: [
          const GradientHeader(title: 'Dispositivos', showBack: false),
          Expanded(
            child: FutureStateBuilder<List<Pet>>(
              future: _future,
              onRetry: () => setState(_load),
              builder: (context, pets) {
                final devices = _devicesOf(pets);
                if (devices.isEmpty) return _buildEmpty(pets);
                final palette = context.palette;
                return ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    Text(
                      'Selecione um dispositivo',
                      style: TextStyle(color: palette.link, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 10),
                    ...devices.map(
                      (device) => TileCard(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppColors.navy,
                            child: Icon(device.icon, color: Colors.white),
                          ),
                          title: Text(
                            device.name,
                            style: TextStyle(fontWeight: FontWeight.bold, color: palette.title),
                          ),
                          subtitle: Text(
                            '${prettyName(device.pet.name)} • código ${device.code}',
                            style: TextStyle(fontSize: 12, color: palette.muted),
                          ),
                          trailing: PopupMenuButton<String>(
                            tooltip: 'Opções do aparelho',
                            icon: Icon(Icons.more_vert_rounded, color: palette.title),
                            onSelected: (value) => value == 'abrir'
                                ? _open(device)
                                : confirmDisconnectDevice(context, device.pet, collar: device.isCollar),
                            itemBuilder: (_) => [
                              const PopupMenuItem(
                                value: 'abrir',
                                child: Row(
                                  children: [
                                    Icon(Icons.open_in_new_rounded, size: 20),
                                    SizedBox(width: 10),
                                    Text('Abrir'),
                                  ],
                                ),
                              ),
                              const PopupMenuItem(
                                value: 'desconectar',
                                child: Row(
                                  children: [
                                    Icon(Icons.link_off_rounded, color: SmartColors.red, size: 20),
                                    SizedBox(width: 10),
                                    Text(
                                      'Desconectar',
                                      style: TextStyle(color: SmartColors.red, fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          onTap: () => _open(device),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: () => _connect(pets),
                      icon: const Icon(Icons.add_link),
                      label: const Text('Conectar outro dispositivo'),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty(List<Pet> pets) {
    final palette = context.palette;
    Widget step(int number, String text) => Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 12,
            backgroundColor: AppColors.orange,
            child: Text(
              '$number',
              style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text, style: TextStyle(color: palette.text, height: 1.4)),
          ),
        ],
      ),
    );
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Icon(Icons.devices_other, size: 72, color: palette.muted),
        const SizedBox(height: 12),
        Text(
          'Nenhum dispositivo conectado',
          textAlign: TextAlign.center,
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: palette.title),
        ),
        const SizedBox(height: 8),
        Text(
          'Conecte a coleira rastreadora ou o alimentador automático ao seu pet para acompanhar tudo por aqui.',
          textAlign: TextAlign.center,
          style: TextStyle(color: palette.muted),
        ),
        const SizedBox(height: 24),
        if (pets.isEmpty) step(1, 'Cadastre o seu pet.') else step(1, 'Ligue o aparelho e deixe-o perto do celular.'),
        step(2, 'Toque em "Conectar dispositivo" e escolha se é uma coleira ou um alimentador.'),
        step(3, 'Digite o código que está na etiqueta do aparelho e escolha o pet.'),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () => _connect(pets),
          icon: Icon(pets.isEmpty ? Icons.pets : Icons.add_link),
          label: Text(pets.isEmpty ? 'Cadastrar pet' : 'Conectar dispositivo'),
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen())),
          icon: const Icon(Icons.storefront_outlined),
          label: const Text('Ainda não tenho: ver na loja'),
        ),
      ],
    );
  }
}
