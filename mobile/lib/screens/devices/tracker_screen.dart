import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart' show CircleMarker;
import 'package:happysnouts/data/mock_collar_walks.dart';
import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/screens/pets/my_pets_screen.dart';
import 'package:happysnouts/widgets/bottom_nav_bar.dart';
import 'package:happysnouts/widgets/devices/device_actions.dart';
import 'package:happysnouts/widgets/devices/device_kit.dart';
import 'package:happysnouts/widgets/devices/smart_kit.dart';
import 'package:happysnouts/widgets/devices/tracker_map.dart';
import 'package:happysnouts/widgets/navy_header.dart';
import 'package:latlong2/latlong.dart' show LatLng;

/// Rastreador GPS da coleira, com três abas: Tempo Real, Relatórios & Saúde
/// e Rotas. O card do aparelho e o relatório usam os mesmos componentes da
/// tela do comedouro (`device_kit.dart`).
///
/// Os dados do pet (foto, nome, raça, idade) são os reais. O mapa é o
/// OpenStreetMap (grátis, sem chave); o movimento, os passeios e as métricas são simulados
/// em ruas reais de Osasco, já que ainda não há serviço da coleira integrado.
class TrackerScreen extends StatefulWidget {
  final Pet pet;

  final String? collarCode;

  const TrackerScreen({super.key, required this.pet, this.collarCode});

  @override
  State<TrackerScreen> createState() => _TrackerScreenState();
}

class _TrackerScreenState extends State<TrackerScreen> with TickerProviderStateMixin {
  static const _stepEvery = Duration(seconds: 4);
  static const _activeGoalMin = 120;
  static const _caloriesGoal = 400;

  static const _demoCollarCode = '24673914';

  // Semana simulada (seg a dom) para o relatório semanal; hoje é calculado.
  static const _weekActive = <double>[102, 130, 106, 86, 148, 166, 122];
  static const _weekKm = <double>[3.1, 3.8, 3.2, 2.4, 4.2, 4.9, 3.6];
  static const _weekKcal = <int>[310, 380, 320, 250, 420, 470, 360];

  final _route = CollarArea.route;
  final DateTime _openedAt = DateTime.now();
  late final List<SimWalk> _walks = CollarArea.todayWalks(_openedAt);
  late final List<GeofenceEvent> _events = [for (final w in _walks) ...CollarArea.geofenceEvents(w)];

  // Passeio ao vivo: começou há alguns minutos e segue andando
  // (começa na R. Analândia).
  int _index = 7;
  late final List<LatLng> _liveTrail = [for (final p in _route.sublist(0, _index + 1)) p.position];
  DateTime _lastFix = DateTime.now();

  late final AnimationController _move = AnimationController(vsync: this, duration: const Duration(milliseconds: 2600))
    ..value = 1;
  late LatLng _from = _route[_index].position;
  late LatLng _to = _route[_index].position;

  /// Dedo em cima do mapa: a página para de rolar para o arrasto ir para o mapa.
  bool _touchingMap = false;

  int _tab = 0;
  int _range = 0;
  bool _following = true;
  int _recenterToken = 0;
  int? _selectedWalk;

  Timer? _stepTimer;
  Timer? _clock;

  LatLng get _petPosition => CollarArea.lerp(_from, _to, Curves.easeInOut.transform(_move.value));

  // A simulação anda mais rápido que o real; a duração sai da distância num
  // ritmo de passeio (~4,2 km/h = 70 m/min), para os números fazerem sentido.
  SimWalk get _liveWalk {
    final points = [..._liveTrail, _petPosition];
    final minutes = max(1, (CollarArea.pathMeters(points) / 70).round());
    return SimWalk(
      title: 'Passeio agora',
      start: DateTime.now().subtract(Duration(minutes: minutes)),
      minutes: minutes,
      points: points,
      live: true,
    );
  }

  List<SimWalk> get _allWalks => [..._walks, _liveWalk];

  @override
  void initState() {
    super.initState();
    _stepTimer = Timer.periodic(_stepEvery, (_) => _advance());
    _clock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  void _onMapTouch(bool touching) {
    if (_touchingMap != touching) setState(() => _touchingMap = touching);
  }

  @override
  void dispose() {
    _stepTimer?.cancel();
    _clock?.cancel();
    _move.dispose();
    super.dispose();
  }

  void _advance() {
    if (!mounted) return;
    final next = (_index + 1) % _route.length;
    final wasInside = CollarArea.insideSafeZone(_to);
    setState(() {
      _from = _petPosition;
      _to = _route[next].position;
      _index = next;
    });
    _move.forward(from: 0).whenComplete(() {
      if (!mounted) return;
      setState(() {
        _lastFix = DateTime.now();
        if (_index == 0) {
          // De volta em casa: começa um passeio novo.
          _liveTrail
            ..clear()
            ..add(_to);
        } else {
          _liveTrail.add(_to);
        }
        final inside = CollarArea.insideSafeZone(_to);
        if (inside != wasInside) _events.add(GeofenceEvent(_lastFix, left: !inside));
      });
    });
  }

  int get _activeMinutes => _allWalks.fold(0, (s, w) => s + w.minutes) + _playMinutes;
  int get _playMinutes => [(8, 5), (14, 7), (20, 8)].where((e) => e.$1 <= _openedAt.hour).fold(0, (s, e) => s + e.$2);
  double get _distanceKm => _allWalks.fold(0.0, (s, w) => s + w.meters) / 1000;
  int get _calories => (_activeMinutes * 2.1 + _distanceKm * 30).round();

  String _hm(int minutes) {
    final h = minutes ~/ 60, m = minutes % 60;
    if (h == 0) return '${m}min';
    return m == 0 ? '${h}h' : '${h}h ${m.toString().padLeft(2, '0')}m';
  }

  String _km(double km) => '${km.toStringAsFixed(1).replaceAll('.', ',')} km';
  String _two(int v) => v.toString().padLeft(2, '0');
  String _clockOf(DateTime t) => '${_two(t.hour)}:${_two(t.minute)}';

  String get _sinceLastFix {
    final seconds = DateTime.now().difference(_lastFix).inSeconds;
    if (seconds < 5) return 'agora mesmo';
    if (seconds < 60) return 'há $seconds s';
    final minutes = seconds ~/ 60;
    return minutes == 1 ? 'há 1 minuto' : 'há $minutes minutos';
  }

  int get _battery => widget.pet.batteryPercent > 0 ? widget.pet.batteryPercent : 75;

  String get _collarCode => widget.collarCode ?? widget.pet.collarId ?? _demoCollarCode;

  @override
  Widget build(BuildContext context) {
    return SmartTheme(
      child: Builder(
        builder: (context) {
          return Scaffold(
            bottomNavigationBar: const AppBottomNavBar(currentIndex: 1),
            body: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 28),
              physics: _touchingMap ? const NeverScrollableScrollPhysics() : null,
              child: Column(
                children: [
                  NavyHeader(
                    title: 'Rastreador GPS',
                    trailing: DisconnectDeviceButton(pet: widget.pet, collar: true),
                    child: _buildPetCard(context),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: DeviceTabs(
                      options: const ['Tempo Real', 'Relatórios & Saúde', 'Rotas'],
                      selected: _tab,
                      onChanged: (i) => setState(() => _tab = i),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: DeviceTabView(
                      index: _tab,
                      child: switch (_tab) {
                        0 => _buildLiveTab(context),
                        1 => _buildReportTab(context),
                        _ => _buildHistoryTab(context),
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPetCard(BuildContext context) {
    final pet = widget.pet;
    final details = [if (pet.breed.isNotEmpty) prettyName(pet.breed), if (pet.age.isNotEmpty) pet.age].join(' • ');
    return DeviceHeroCard(
      leading: DeviceLeading(round: true, child: PetAvatar(pet: pet, radius: 28)),
      title: prettyName(pet.name),
      subtitle: details,
      online: true,
      battery: _battery,
      footer: [
        DeviceInfoRow(icon: Icons.qr_code_2_rounded, label: 'Coleira nº', value: _collarCode),
        DeviceInfoRow(icon: Icons.sync_rounded, label: 'Última atualização', value: _sinceLastFix),
        const DeviceInfoRow(icon: Icons.gps_fixed_rounded, label: 'Precisão do GPS', value: '±3 m'),
      ],
    );
  }

  Widget _buildLiveTab(BuildContext context) {
    final c = SmartColors.of(context);
    return AnimatedBuilder(
      animation: _move,
      builder: (context, _) {
        final pet = _petPosition;
        final inside = CollarArea.insideSafeZone(pet);
        final street = _route[_index].street;
        const district = CollarArea.district;
        final live = _liveWalk;
        return Column(
          children: [
            TrackerMap(
              height: 380,
              initialCenter: _route[_index].position,
              follow: _to,
              recenterToken: _recenterToken,
              onFollowChanged: (f) => setState(() => _following = f),
              onTouch: _onMapTouch,
              bottomInset: 78,
              trails: [
                TrackerTrail(live.points, color: Colors.white.withValues(alpha: 0.9), width: 9),
                TrackerTrail(live.points, color: SmartColors.navy.withValues(alpha: 0.75), width: 5),
              ],
              circles: [
                _safeZone,
                // "pulso" laranja em volta do pet (raio de 16 m)
                CircleMarker(
                  point: pet,
                  radius: 16,
                  useRadiusInMeter: true,
                  color: SmartColors.orange.withValues(alpha: 0.25),
                ),
              ],
              markers: [TrackerPins.home(CollarArea.home), TrackerPins.pet(pet, prettyName(widget.pet.name))],
              overlays: [
                Positioned(
                  left: 12,
                  top: 12,
                  child: _MapChip(
                    icon: inside ? Icons.shield_rounded : Icons.warning_amber_rounded,
                    label: inside ? 'Zona Segura' : 'Fora da Zona Segura',
                    color: inside ? SmartColors.green : SmartColors.orange,
                  ),
                ),
                Positioned(left: 12, right: 12, bottom: 12, child: _buildAddressCard(c, street, district)),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _miniStat(
                    c,
                    Icons.speed_rounded,
                    '${live.speedKmh.toStringAsFixed(1).replaceAll('.', ',')} km/h',
                    'Velocidade',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(child: _miniStat(c, Icons.route_rounded, _km(live.meters / 1000), 'Neste passeio')),
                const SizedBox(width: 10),
                Expanded(child: _miniStat(c, Icons.timer_outlined, _hm(live.minutes), 'Duração')),
              ],
            ),
            const SizedBox(height: 16),
            DeviceActionButton(
              onPressed: () => setState(() {
                _selectedWalk = _allWalks.length - 1;
                _tab = 2;
              }),
              child: const Row(
                key: ValueKey('rotas'),
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.alt_route_rounded),
                  SizedBox(width: 8),
                  Flexible(child: Text('Ver rotas de hoje', overflow: TextOverflow.ellipsis)),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _miniStat(SmartColors c, IconData icon, String value, String label) => SmartCard(
    padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: SmartColors.orange),
        const SizedBox(height: 8),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            value,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: c.title),
          ),
        ),
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(fontSize: 11.5, color: c.muted),
        ),
      ],
    ),
  );

  CircleMarker get _safeZone => CircleMarker(
    point: CollarArea.home,
    radius: CollarArea.geofenceRadius,
    useRadiusInMeter: true,
    color: SmartColors.green.withValues(alpha: 0.1),
    borderColor: SmartColors.green.withValues(alpha: 0.9),
    borderStrokeWidth: 2,
  );

  Widget _buildAddressCard(SmartColors c, String street, String district) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 10, 10),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(color: SmartColors.navy.withValues(alpha: 0.16), blurRadius: 18, offset: const Offset(0, 6)),
        ],
      ),
      child: Row(
        children: [
          const SmartIconChip(icon: Icons.location_on_rounded, color: SmartColors.orange, size: 40),
          const SizedBox(width: 10),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              layoutBuilder: (current, previous) =>
                  Stack(alignment: Alignment.centerLeft, children: [...previous, ?current]),
              child: Column(
                key: ValueKey(street),
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    street,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: c.title),
                  ),
                  Text(
                    district,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12, color: c.muted),
                  ),
                ],
              ),
            ),
          ),
          Tooltip(
            message: 'Centralizar em ${prettyName(widget.pet.name)}',
            child: Material(
              color: SmartColors.navy,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: () => setState(() => _recenterToken++),
                child: SizedBox(
                  width: 42,
                  height: 42,
                  child: Icon(
                    _following ? Icons.my_location_rounded : Icons.location_searching_rounded,
                    color: Colors.white,
                    size: 21,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportTab(BuildContext context) {
    final today = _openedAt.weekday - 1;
    final weekly = _range == 1;
    late final List<String> labels;
    late final List<double> values;
    late final int highlight;
    late final int active, kcal;
    late final double km;
    if (weekly) {
      labels = const ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      values = [
        for (var d = 0; d < 7; d++) d < today ? _weekActive[d] : (d == today ? _activeMinutes.toDouble() : 0.0),
      ];
      highlight = today;
      active = values.fold(0.0, (s, v) => s + v).round();
      km = [for (var d = 0; d < today; d++) _weekKm[d]].fold(0.0, (s, v) => s + v) + _distanceKm;
      kcal = [for (var d = 0; d < today; d++) _weekKcal[d]].fold(0, (s, v) => s + v) + _calories;
    } else {
      const hours = [6, 8, 10, 12, 14, 16, 18, 20, 22];
      final buckets = List<double>.filled(hours.length, 0);
      int bucketOf(int hour) => ((hour - 6) ~/ 2).clamp(0, hours.length - 1);
      for (final w in _allWalks) {
        buckets[bucketOf(w.start.hour)] += w.minutes;
      }
      for (final (hour, minutes) in const [(8, 5), (14, 7), (20, 8)]) {
        if (hour <= _openedAt.hour) buckets[bucketOf(hour)] += minutes;
      }
      labels = [for (final h in hours) '${h}h'];
      values = buckets;
      highlight = bucketOf(DateTime.now().hour);
      active = _activeMinutes;
      km = _distanceKm;
      kcal = _calories;
    }
    final days = weekly ? today + 1 : 1;
    return DeviceReport(
      title: weekly ? 'Resumo da semana' : 'Resumo de hoje',
      subtitle: 'Atualizado ${_sinceLastFix == 'agora mesmo' ? 'agora' : _sinceLastFix}',
      range: _range,
      onRangeChanged: (i) => setState(() => _range = i),
      metrics: [
        ReportMetric(
          icon: Icons.directions_run_rounded,
          color: SmartColors.orange,
          label: 'Tempo Ativo',
          value: _hm(active),
          caption: weekly ? 'média ${_hm(active ~/ days)}/dia' : 'meta ${_hm(_activeGoalMin)}',
        ),
        ReportMetric(
          icon: Icons.route_rounded,
          color: SmartColors.blue,
          label: 'Distância',
          value: _km(km),
          caption: weekly ? 'média ${_km(km / days)}/dia' : '${_allWalks.length} passeios',
        ),
        ReportMetric(
          icon: Icons.local_fire_department_rounded,
          color: SmartColors.red,
          label: 'Calorias',
          value: '$kcal kcal',
          caption: weekly ? 'média ${(kcal / days).round()}/dia' : 'meta $_caloriesGoal kcal',
        ),
      ],
      chartTitle: 'Minutos ativos',
      chartSubtitle: weekly ? 'Por dia da semana' : 'Por horário do dia',
      labels: labels,
      values: values,
      unit: ' min',
      highlight: highlight,
      eventsTitle: 'Eventos recentes',
      eventsSubtitle: 'Passeios e Zona Segura',
      events: _recentEvents(),
      emptyEvents: 'Nenhum evento hoje.',
    );
  }

  List<ReportEvent> _recentEvents() {
    final radius = CollarArea.geofenceRadius.round();
    final items = <(DateTime, ReportEvent)>[
      for (final w in _allWalks)
        (
          w.start,
          ReportEvent(
            icon: Icons.directions_walk_rounded,
            color: SmartColors.orange,
            title: w.live ? 'Passeio em andamento' : w.title,
            subtitle: '${_hm(w.minutes)} • ${_km(w.meters / 1000)}',
            time: 'Hoje, ${_clockOf(w.start)}',
          ),
        ),
      for (final e in _events)
        (
          e.time,
          ReportEvent(
            icon: e.left ? Icons.logout_rounded : Icons.shield_rounded,
            color: e.left ? SmartColors.red : SmartColors.green,
            title: e.left ? 'Saiu da Zona Segura' : 'Entrou na Zona Segura',
            subtitle: 'Raio de $radius m em volta de casa',
            time: 'Hoje, ${_clockOf(e.time)}',
          ),
        ),
    ]..sort((a, b) => b.$1.compareTo(a.$1));
    return [for (final item in items.take(6)) item.$2];
  }

  Widget _buildHistoryTab(BuildContext context) {
    final c = SmartColors.of(context);
    final walks = _allWalks;
    final selected = (_selectedWalk ?? walks.length - 1).clamp(0, walks.length - 1);
    final chosen = walks[selected];
    final totalKm = walks.fold(0.0, (s, w) => s + w.meters) / 1000;
    final totalMin = walks.fold(0, (s, w) => s + w.minutes);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TrackerMap(
          height: 300,
          initialCenter: CollarArea.home,
          initialZoom: 16,
          fit: chosen.points,
          fitKey: selected,
          onTouch: _onMapTouch,
          trails: [
            for (var k = 0; k < walks.length; k++)
              if (k != selected)
                TrackerTrail(walks[k].points, color: SmartColors.navy.withValues(alpha: 0.35), width: 4, dashed: true),
            TrackerTrail(chosen.points, color: Colors.white.withValues(alpha: 0.9), width: 10),
            TrackerTrail(chosen.points, color: SmartColors.orange, width: 6),
          ],
          circles: [_safeZone],
          markers: [
            TrackerPins.home(CollarArea.home),
            TrackerPins.dot(chosen.points.first, SmartColors.green),
            TrackerPins.dot(chosen.points.last, SmartColors.orange, size: 22),
          ],
          overlays: [
            Positioned(
              left: 12,
              top: 12,
              child: _MapChip(
                icon: Icons.route_rounded,
                label: '${chosen.title} • ${_km(chosen.meters / 1000)}',
                color: SmartColors.orange,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _miniStat(c, Icons.pets_rounded, '${walks.length}', 'Passeios hoje')),
            const SizedBox(width: 10),
            Expanded(child: _miniStat(c, Icons.route_rounded, _km(totalKm), 'Distância total')),
            const SizedBox(width: 10),
            Expanded(child: _miniStat(c, Icons.timer_outlined, _hm(totalMin), 'Tempo total')),
          ],
        ),
        const SizedBox(height: 18),
        const SmartSectionTitle('Linha do tempo', subtitle: 'Toque num passeio para ver o trajeto no mapa'),
        const SizedBox(height: 10),
        for (var k = walks.length - 1; k >= 0; k--) _walkTile(c, walks[k], k, k == selected, isLast: k == 0),
      ],
    );
  }

  Widget _walkTile(SmartColors c, SimWalk walk, int index, bool selected, {required bool isLast}) {
    final end = walk.live ? 'agora' : _clockOf(walk.end);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 52,
            child: Column(
              children: [
                const SizedBox(height: 16),
                Text(
                  _clockOf(walk.start),
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    color: selected ? SmartColors.orange : c.title,
                  ),
                ),
                const SizedBox(height: 6),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  width: selected ? 14 : 10,
                  height: selected ? 14 : 10,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: selected ? SmartColors.orange : c.card,
                    border: Border.all(color: selected ? SmartColors.orange : c.muted, width: 2.5),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(width: 2, margin: const EdgeInsets.only(top: 4), color: c.line),
                  ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: selected ? SmartColors.orange.withValues(alpha: 0.6) : Colors.transparent,
                    width: 1.5,
                  ),
                ),
                child: SmartCard(
                  onTap: () => setState(() => _selectedWalk = index),
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              walk.title,
                              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5, color: c.title),
                            ),
                          ),
                          if (walk.live)
                            const SmartBadge(label: 'Ao vivo', color: SmartColors.red, dot: true)
                          else
                            Text(
                              '${_clockOf(walk.start)} – $end',
                              style: TextStyle(fontSize: 12, color: c.muted, fontWeight: FontWeight.w600),
                            ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          _walkFact(c, Icons.timer_outlined, _hm(walk.minutes)),
                          _walkFact(c, Icons.route_rounded, _km(walk.meters / 1000)),
                          _walkFact(
                            c,
                            Icons.speed_rounded,
                            '${walk.speedKmh.toStringAsFixed(1).replaceAll('.', ',')} km/h',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _walkFact(SmartColors c, IconData icon, String text) => Expanded(
    child: Row(
      children: [
        Icon(icon, size: 15, color: c.muted),
        const SizedBox(width: 4),
        Flexible(
          child: Text(
            text,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: c.text),
          ),
        ),
      ],
    ),
  );
}

class _MapChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _MapChip({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: c.card.withValues(alpha: 0.94),
        borderRadius: BorderRadius.circular(30),
        boxShadow: c.shadow,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: c.title),
          ),
        ],
      ),
    );
  }
}
