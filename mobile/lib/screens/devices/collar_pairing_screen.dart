import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/screens/devices/tracker_screen.dart';
import 'package:happysnouts/screens/pets/my_pets_screen.dart';
import 'package:happysnouts/services/pet_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/devices/smart_kit.dart';
import 'package:happysnouts/widgets/navy_header.dart';

/// Tela 1 do rastreador: pareamento da coleira GPS (ou do alimentador).
///
/// O código é salvo de verdade no pet (PUT /pets/:id). Enquanto isso, a tela
/// mostra as etapas "Buscando sinal de satélite..." e "Sincronizando
/// coleira..." e, no fim, abre o rastreamento em tempo real.
class CollarPairingScreen extends StatefulWidget {
  final List<Pet> pets;

  const CollarPairingScreen({super.key, required this.pets});

  @override
  State<CollarPairingScreen> createState() => _CollarPairingScreenState();
}

class _CollarPairingScreenState extends State<CollarPairingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _code = TextEditingController();
  late String _petId = widget.pets.first.id;
  bool _collar = true;
  bool _connecting = false;

  Pet get _pet => widget.pets.firstWhere((p) => p.id == _petId);

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  // Código de demonstração: 8 dígitos, sem zero na frente.
  void _generateTestCode() {
    final random = Random();
    final code = '${random.nextInt(9) + 1}${List.generate(7, (_) => random.nextInt(10)).join()}';
    setState(() => _code.text = code);
    _formKey.currentState?.validate();
  }

  Future<void> _connect() async {
    FocusScope.of(context).unfocus();
    if (_connecting || !_formKey.currentState!.validate()) return;
    setState(() => _connecting = true);
    final pet = _pet;
    final code = int.parse(_code.text);
    try {
      // A animação dura pelo menos ~2,4 s, mesmo que o backend responda antes.
      await Future.wait([
        PetService.instance.connectDevice(pet, collar: _collar, deviceCode: code),
        Future<void>.delayed(const Duration(milliseconds: 2400)),
      ]);
      if (!mounted) return;
      if (_collar) {
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            transitionDuration: const Duration(milliseconds: 450),
            pageBuilder: (_, _, _) => TrackerScreen(pet: pet, collarCode: '$code'),
            transitionsBuilder: (_, animation, _, child) => FadeTransition(opacity: animation, child: child),
          ),
        );
      } else {
        AppFeedback.show(context, 'Alimentador conectado!');
        Navigator.pop(context, true);
      }
    } catch (error) {
      if (!mounted) return;
      setState(() => _connecting = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return SmartTheme(
      child: PopScope(
        canPop: !_connecting,
        child: Scaffold(
          body: Stack(
            fit: StackFit.expand,
            children: [
              SingleChildScrollView(
                padding: EdgeInsets.only(bottom: MediaQuery.paddingOf(context).bottom + 24),
                child: Column(
                  children: [
                    NavyHeader(
                      title: 'Conectar dispositivo',
                      child: _card(
                        child: Column(
                          children: [
                            const _RadarIcon(size: 92),
                            const SizedBox(height: 12),
                            Text(
                              _collar ? 'Parear coleira GPS' : 'Parear alimentador',
                              style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: palette.title),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Ligue o aparelho, deixe-o perto do celular e digite o código (número de série) da etiqueta.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 13.5, height: 1.4, color: palette.muted),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      child: _card(
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Wrap(
                                spacing: 8,
                                children: [
                                  ChoiceChip(
                                    avatar: const Icon(Icons.sensors, size: 16),
                                    label: const Text('Coleira GPS'),
                                    selected: _collar,
                                    onSelected: _connecting ? null : (_) => setState(() => _collar = true),
                                  ),
                                  ChoiceChip(
                                    avatar: const Icon(Icons.dining, size: 16),
                                    label: const Text('Alimentador'),
                                    selected: !_collar,
                                    onSelected: _connecting ? null : (_) => setState(() => _collar = false),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              if (widget.pets.length > 1) ...[
                                DropdownButtonFormField<String>(
                                  initialValue: _petId,
                                  decoration: const InputDecoration(
                                    labelText: 'Pet',
                                    prefixIcon: Icon(Icons.pets_rounded),
                                  ),
                                  items: widget.pets
                                      .map((p) => DropdownMenuItem(value: p.id, child: Text(prettyName(p.name))))
                                      .toList(),
                                  onChanged: _connecting ? null : (id) => setState(() => _petId = id ?? _petId),
                                ),
                                const SizedBox(height: 14),
                              ] else ...[
                                Row(
                                  children: [
                                    PetAvatar(pet: _pet, radius: 18),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        'Para ${prettyName(_pet.name)}',
                                        style: TextStyle(fontWeight: FontWeight.w800, color: palette.text),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 14),
                              ],
                              TextFormField(
                                controller: _code,
                                enabled: !_connecting,
                                keyboardType: TextInputType.number,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                  LengthLimitingTextInputFormatter(9),
                                ],
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _connect(),
                                decoration: const InputDecoration(
                                  labelText: 'Código / número de série',
                                  hintText: 'Ex.: 48213097',
                                  prefixIcon: Icon(Icons.qr_code_2_rounded),
                                ),
                                validator: (value) {
                                  final text = value?.trim() ?? '';
                                  if (text.isEmpty) return 'Digite o código da etiqueta';
                                  if (text.length < 4) return 'O código tem pelo menos 4 números';
                                  return null;
                                },
                              ),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton.icon(
                                  onPressed: _connecting ? null : _generateTestCode,
                                  icon: const Icon(Icons.auto_awesome_rounded, size: 18),
                                  label: const Text('Gerar código de teste'),
                                  style: TextButton.styleFrom(foregroundColor: palette.accent),
                                ),
                              ),
                              const SizedBox(height: 6),
                              SizedBox(
                                height: 52,
                                child: ElevatedButton.icon(
                                  onPressed: _connecting ? null : _connect,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: SmartColors.navy,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  ),
                                  icon: const Icon(Icons.link_rounded),
                                  label: const Text(
                                    'Conectar Dispositivo',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (_connecting) _PairingOverlay(collar: _collar, petName: prettyName(_pet.name)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _card({required Widget child}) {
    final palette = context.palette;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: palette.card,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(color: SmartColors.navy.withValues(alpha: 0.16), blurRadius: 18, offset: const Offset(0, 6)),
        ],
      ),
      child: child,
    );
  }
}

class _RadarIcon extends StatefulWidget {
  final double size;

  const _RadarIcon({required this.size});

  @override
  State<_RadarIcon> createState() => _RadarIconState();
}

class _RadarIconState extends State<_RadarIcon> with SingleTickerProviderStateMixin {
  late final _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800))..repeat();

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size;
    return SizedBox(
      width: size,
      height: size,
      child: AnimatedBuilder(
        animation: _pulse,
        builder: (context, _) => Stack(
          alignment: Alignment.center,
          children: [
            for (final delay in const [0.0, 0.5])
              Builder(
                builder: (_) {
                  final t = (_pulse.value + delay) % 1;
                  return Container(
                    width: size * (0.45 + 0.55 * t),
                    height: size * (0.45 + 0.55 * t),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: SmartColors.orange.withValues(alpha: 0.28 * (1 - t)),
                    ),
                  );
                },
              ),
            Container(
              width: size * 0.5,
              height: size * 0.5,
              decoration: BoxDecoration(shape: BoxShape.circle, color: SmartColors.orange),
              child: Icon(Icons.sensors_rounded, color: Colors.white, size: size * 0.28),
            ),
          ],
        ),
      ),
    );
  }
}

class _PairingOverlay extends StatefulWidget {
  final bool collar;
  final String petName;

  const _PairingOverlay({required this.collar, required this.petName});

  @override
  State<_PairingOverlay> createState() => _PairingOverlayState();
}

class _PairingOverlayState extends State<_PairingOverlay> {
  int _step = 0;
  Timer? _timer;

  List<String> get _steps => widget.collar
      ? ['Buscando sinal de satélite...', 'Sincronizando coleira...', 'Localizando ${widget.petName}...']
      : ['Procurando o alimentador...', 'Sincronizando aparelho...', 'Quase lá...'];

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 800), (_) {
      if (_step < _steps.length - 1) setState(() => _step++);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF061A2E), SmartColors.navy, SmartColors.navySoft],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const _RadarIcon(size: 170),
                  const SizedBox(height: 28),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    child: Text(
                      _steps[_step],
                      key: ValueKey(_step),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w800),
                    ),
                  ),
                  const SizedBox(height: 22),
                  for (var i = 0; i < _steps.length; i++)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 5),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 22,
                            height: 22,
                            child: i < _step
                                ? const Icon(Icons.check_circle_rounded, color: SmartColors.orange, size: 22)
                                : i == _step
                                ? const Padding(
                                    padding: EdgeInsets.all(3),
                                    child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                                  )
                                : Icon(Icons.circle_outlined, color: Colors.white.withValues(alpha: 0.35), size: 22),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            _steps[i],
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: i <= _step ? 0.95 : 0.45),
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
