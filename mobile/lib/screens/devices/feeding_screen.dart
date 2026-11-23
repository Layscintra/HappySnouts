import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:happysnouts/models/feeder.dart';
import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/feeder_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/devices/device_actions.dart';
import 'package:happysnouts/widgets/devices/device_kit.dart';
import 'package:happysnouts/widgets/devices/smart_kit.dart';
import 'package:happysnouts/widgets/navy_header.dart';

class FeedingScreen extends StatefulWidget {
  final Pet? pet;

  const FeedingScreen({super.key, this.pet});

  @override
  State<FeedingScreen> createState() => _FeedingScreenState();
}

enum _DispenseState { idle, working, done }

class _FeedingScreenState extends State<FeedingScreen> with ReloadOnChange {
  // Semana simulada (seg a dom) para o relatório semanal; hoje vem do histórico.
  static const _weekGrams = <double>[630, 540, 630, 630, 540, 630, 630];
  static const _weekMeals = <int>[4, 3, 4, 4, 3, 4, 4];

  @override
  List<DataTopic> get reloadTopics => const [DataTopic.pets];

  @override
  void reload() => _load();

  late Future<Feeder> _future;
  int _tab = 0;
  int _range = 0;
  bool _switchingConnection = false;
  _DispenseState _dispense = _DispenseState.idle;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() => _future = FeederService.instance.getFeeder();

  void _apply(Feeder feeder) => setState(() {
    _future = Future.value(feeder);
  });

  Future<void> _toggleConnection(bool value) async {
    setState(() => _switchingConnection = true);
    final feeder = await FeederService.instance.setConnected(value);
    if (!mounted) return;
    _switchingConnection = false;
    _apply(feeder);
    AppFeedback.show(context, value ? 'Comedouro conectado' : 'Comedouro desconectado');
  }

  Future<void> _dispenseNow() async {
    if (_dispense != _DispenseState.idle) return;
    setState(() => _dispense = _DispenseState.working);
    try {
      final feeder = await FeederService.instance.dispensePortion();
      if (!mounted) return;
      _apply(feeder);
      setState(() => _dispense = _DispenseState.done);
      await Future<void>.delayed(const Duration(milliseconds: 2200));
      if (mounted) setState(() => _dispense = _DispenseState.idle);
    } catch (error) {
      if (!mounted) return;
      setState(() => _dispense = _DispenseState.idle);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  Future<void> _toggleMeal(FeedingSchedule meal, bool enabled) async {
    final feeder = await FeederService.instance.setMealEnabled(meal, enabled);
    if (mounted) _apply(feeder);
  }

  Future<void> _editMeal(Feeder feeder, {FeedingSchedule? existing}) async {
    final result = await showModalBottomSheet<FeedingSchedule>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => SmartTheme(child: _MealForm(existing: existing)),
    );
    if (result == null) return;
    final schedule = [...feeder.schedule];
    if (existing != null) schedule.remove(existing);
    schedule.add(result);
    await _saveSchedule(schedule, existing == null ? 'Refeição adicionada' : 'Refeição atualizada');
  }

  Future<void> _removeMeal(Feeder feeder, FeedingSchedule meal) async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Excluir refeição',
      message: 'Excluir a refeição das ${meal.time}? Para só pausar, use o interruptor.',
      confirmLabel: 'Excluir',
      destructive: true,
    );
    if (!confirmed) return;
    await _saveSchedule([...feeder.schedule]..remove(meal), 'Refeição excluída');
  }

  Future<void> _saveSchedule(List<FeedingSchedule> schedule, String message) async {
    try {
      final feeder = await FeederService.instance.saveSchedule(schedule);
      if (!mounted) return;
      _apply(feeder);
      AppFeedback.show(context, message);
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  String _two(int v) => v.toString().padLeft(2, '0');

  String _when(DateTime t) {
    final now = DateTime.now();
    final sameDay = t.year == now.year && t.month == now.month && t.day == now.day;
    return '${sameDay ? 'Hoje' : 'Ontem'}, ${_two(t.hour)}:${_two(t.minute)}';
  }

  String _grams(num g) => g >= 1000 ? '${(g / 1000).toStringAsFixed(1).replaceAll('.', ',')} kg' : '${g.round()} g';

  String _portionsText(FeedingSchedule meal) =>
      '${meal.portions} ${meal.portions == 1 ? 'porção' : 'porções'} • ${meal.grams}g';

  @override
  Widget build(BuildContext context) {
    return SmartTheme(
      child: Scaffold(
        body: FutureStateBuilder<Feeder>(
          future: _future,
          onRetry: () => setState(_load),
          builder: (context, feeder) {
            return ListView(
              padding: EdgeInsets.only(bottom: MediaQuery.paddingOf(context).bottom + 28),
              children: [
                NavyHeader(
                  title: 'Alimentação',
                  trailing: widget.pet == null ? null : DisconnectDeviceButton(pet: widget.pet!, collar: false),
                  child: _buildDeviceCard(feeder),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  child: DeviceTabs(
                    options: const ['Agendamentos', 'Relatórios & Consumo'],
                    selected: _tab,
                    onChanged: (i) => setState(() => _tab = i),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  child: DeviceTabView(
                    index: _tab,
                    child: _tab == 0 ? _buildScheduleTab(feeder) : _buildReportTab(feeder),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildDeviceCard(Feeder feeder) {
    final c = SmartColors.of(context);
    final level = feeder.reservoirLevel;
    final kg = (feeder.reservoirGrams / 1000).toStringAsFixed(1).replaceAll('.', ',');
    final low = level < 0.2;
    return SmartCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 64,
                height: 64,
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: c.soft, borderRadius: BorderRadius.circular(18)),
                child: Image.asset(
                  'assets/images/comedouro.png',
                  fit: BoxFit.contain,
                  semanticLabel: 'Comedouro automático',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      feeder.name,
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: c.title),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        feeder.isConnected
                            ? SmartBadge.online('Conectado')
                            : const SmartBadge(
                                label: 'Desconectado',
                                color: SmartColors.red,
                                textColor: Color(0xFFB42318),
                                dot: true,
                              ),
                        SmartBadge(
                          label: '${feeder.batteryPercent}%',
                          color: SmartColors.blue,
                          icon: Icons.battery_5_bar_rounded,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _Reservoir(level: level),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Reservatório',
                      style: TextStyle(fontSize: 12.5, color: c.muted, fontWeight: FontWeight.w600),
                    ),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${(level * 100).round()}%',
                          style: TextStyle(
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            color: c.title,
                            letterSpacing: -1,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Text(
                            'cheio',
                            style: TextStyle(fontSize: 13, color: c.muted, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '~$kg kg restantes',
                      style: TextStyle(fontSize: 13, color: c.text, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    if (low)
                      const SmartBadge(
                        label: 'Reabasteça em breve',
                        color: SmartColors.orange,
                        textColor: Color(0xFFB54708),
                        icon: Icons.warning_amber_rounded,
                      )
                    else if (feeder.dailyGrams > 0)
                      Text(
                        'Dura cerca de ${max(1, feeder.reservoirGrams ~/ feeder.dailyGrams)} ${feeder.reservoirGrams ~/ feeder.dailyGrams == 1 ? 'dia' : 'dias'}',
                        style: TextStyle(fontSize: 12, color: c.muted),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildDispenseButton(feeder),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.wifi_tethering_rounded, size: 18, color: c.muted),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Simular conexão do aparelho',
                  style: TextStyle(fontSize: 13, color: c.text, fontWeight: FontWeight.w600),
                ),
              ),
              if (_switchingConnection)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2.2, color: SmartColors.orange),
                )
              else
                Switch(value: feeder.isConnected, onChanged: _toggleConnection),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDispenseButton(Feeder feeder) {
    final enabled = feeder.isConnected && _dispense == _DispenseState.idle;
    final done = _dispense == _DispenseState.done;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      height: 54,
      decoration: BoxDecoration(
        color: done ? SmartColors.green : (feeder.isConnected ? SmartColors.orange : SmartColors.of(context).line),
        borderRadius: BorderRadius.circular(16),
        boxShadow: feeder.isConnected && !done
            ? [BoxShadow(color: SmartColors.orange.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6))]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: enabled ? _dispenseNow : null,
          child: Center(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              transitionBuilder: (child, a) => ScaleTransition(
                scale: a,
                child: FadeTransition(opacity: a, child: child),
              ),
              child: switch (_dispense) {
                _DispenseState.working => const Row(
                  key: ValueKey('w'),
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                    ),
                    SizedBox(width: 10),
                    Flexible(
                      child: Text(
                        'Liberando ração...',
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
                      ),
                    ),
                  ],
                ),
                _DispenseState.done => const Row(
                  key: ValueKey('d'),
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle_rounded, color: Colors.white),
                    SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        'Porção liberada! (${FeederService.gramsPerPortion} g)',
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
                      ),
                    ),
                  ],
                ),
                _DispenseState.idle => Row(
                  key: const ValueKey('i'),
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.restaurant_rounded,
                      color: feeder.isConnected ? Colors.white : SmartColors.of(context).muted,
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        feeder.isConnected ? 'Liberar Porção Agora' : 'Conecte o comedouro para liberar',
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: feeder.isConnected ? Colors.white : SmartColors.of(context).muted,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ],
                ),
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildScheduleTab(Feeder feeder) {
    final c = SmartColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [_buildNextMealCard(c, feeder), const SizedBox(height: 14), _buildScheduleCard(c, feeder)],
    );
  }

  Widget _buildNextMealCard(SmartColors c, Feeder feeder) {
    final next = feeder.nextMeal(DateTime.now());
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [SmartColors.navy, SmartColors.navySoft],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: c.shadow,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Próxima refeição',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  child: FittedBox(
                    key: ValueKey(next?.meal.time),
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      next == null ? 'Nenhuma ativa' : '${next.isToday ? 'Hoje' : 'Amanhã'} às ${next.meal.time}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 22,
                        letterSpacing: -0.4,
                      ),
                    ),
                  ),
                ),
                if (next != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    _portionsText(next.meal),
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 13),
                  ),
                ],
              ],
            ),
          ),
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.schedule_rounded, color: SmartColors.orange, size: 28),
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleCard(SmartColors c, Feeder feeder) {
    final activeCount = feeder.activeSchedule.length;
    return SmartCard(
      padding: const EdgeInsets.fromLTRB(16, 16, 6, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: SmartSectionTitle(
              'Horários',
              subtitle: '$activeCount de ${feeder.schedule.length} ativos • ${feeder.dailyGrams} g/dia',
              trailing: TextButton.icon(
                onPressed: () => _editMeal(feeder),
                style: TextButton.styleFrom(
                  foregroundColor: SmartColors.orange,
                  backgroundColor: SmartColors.orange.withValues(alpha: 0.12),
                  visualDensity: VisualDensity.compact,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  shape: const StadiumBorder(),
                  textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 13),
                ),
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text('Adicionar', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ),
          ),
          const SizedBox(height: 8),
          if (feeder.schedule.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text('Nenhuma refeição programada.', style: TextStyle(color: c.muted)),
            ),
          for (var i = 0; i < feeder.schedule.length; i++) ...[
            if (i > 0)
              Padding(
                padding: const EdgeInsets.only(right: 10),
                child: Divider(height: 1, color: c.line),
              ),
            _mealTile(c, feeder, feeder.schedule[i]),
          ],
        ],
      ),
    );
  }

  Widget _mealTile(SmartColors c, Feeder feeder, FeedingSchedule meal) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => _editMeal(feeder, existing: meal),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            // Pausado: só o horário fica apagado; o interruptor continua nítido.
            Expanded(
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 250),
                opacity: meal.enabled ? 1 : 0.45,
                child: Row(
                  children: [
                    SmartIconChip(icon: _mealIcon(meal), color: meal.enabled ? SmartColors.orange : c.muted, size: 40),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            meal.time,
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 17,
                              color: c.title,
                              letterSpacing: -0.3,
                            ),
                          ),
                          Text(
                            meal.enabled ? _portionsText(meal) : 'Pausado',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 12.5, color: c.muted),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Switch(value: meal.enabled, onChanged: (v) => _toggleMeal(meal, v)),
            PopupMenuButton<String>(
              tooltip: 'Opções',
              icon: Icon(Icons.more_vert_rounded, color: c.muted),
              onSelected: (v) => v == 'editar' ? _editMeal(feeder, existing: meal) : _removeMeal(feeder, meal),
              itemBuilder: (_) => const [
                PopupMenuItem(value: 'editar', child: Text('Editar')),
                PopupMenuItem(value: 'excluir', child: Text('Excluir')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _mealIcon(FeedingSchedule meal) {
    final h = meal.minutesOfDay ~/ 60;
    if (h < 11) return Icons.wb_sunny_rounded;
    if (h < 17) return Icons.light_mode_rounded;
    if (h < 21) return Icons.wb_twilight_rounded;
    return Icons.nightlight_round;
  }

  Widget _buildReportTab(Feeder feeder) {
    final now = DateTime.now();
    final weekday = now.weekday - 1;
    final weekly = _range == 1;
    bool isToday(DateTime t) => t.year == now.year && t.month == now.month && t.day == now.day;
    final todayLogs = feeder.history.where((l) => isToday(l.time)).toList();
    final todayGrams = todayLogs.fold(0, (s, l) => s + l.grams);
    final pastGrams = [for (var d = 0; d < weekday; d++) _weekGrams[d]].fold(0.0, (s, v) => s + v);
    final pastMeals = [for (var d = 0; d < weekday; d++) _weekMeals[d]].fold(0, (s, v) => s + v);
    final dailyAverage = (pastGrams + todayGrams) / (weekday + 1);

    late final List<String> labels;
    late final List<double> values;
    int? highlight;
    late final num total;
    late final int meals;
    if (weekly) {
      labels = const ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      values = [for (var d = 0; d < 7; d++) d < weekday ? _weekGrams[d] : (d == weekday ? todayGrams.toDouble() : 0.0)];
      highlight = weekday;
      total = pastGrams + todayGrams;
      meals = pastMeals + todayLogs.length;
    } else {
      // Gramas liberadas hoje em cada horário programado (+ porções extras).
      final slots = [...feeder.schedule]..sort((a, b) => a.minutesOfDay.compareTo(b.minutesOfDay));
      labels = [for (final s in slots) s.time];
      values = List<double>.filled(slots.length, 0, growable: true);
      var extra = 0.0;
      DateTime? latest;
      for (final log in todayLogs) {
        final minutes = log.time.hour * 60 + log.time.minute;
        final slot = log.status == MealStatus.manual
            ? -1
            : slots.indexWhere((s) => minutes >= s.minutesOfDay && minutes - s.minutesOfDay <= 30);
        if (slot < 0) {
          extra += log.grams;
        } else {
          values[slot] += log.grams;
        }
        if (latest == null || log.time.isAfter(latest)) {
          latest = log.time;
          highlight = slot < 0 ? slots.length : slot;
        }
      }
      if (extra > 0) {
        labels.add('Extra');
        values.add(extra);
      }
      total = todayGrams;
      meals = todayLogs.length;
    }

    return DeviceReport(
      title: weekly ? 'Resumo da semana' : 'Resumo de hoje',
      subtitle: feeder.isConnected ? 'Atualizado agora' : 'Comedouro offline',
      range: _range,
      onRangeChanged: (i) => setState(() => _range = i),
      metrics: [
        ReportMetric(
          icon: Icons.restaurant_rounded,
          color: SmartColors.orange,
          label: 'Total Consumido',
          value: _grams(total),
          caption: weekly ? 'nesta semana' : 'hoje',
        ),
        ReportMetric(
          icon: Icons.insights_rounded,
          color: SmartColors.blue,
          label: 'Média Diária',
          value: _grams(dailyAverage),
          caption: 'meta ${_grams(feeder.dailyGrams)}',
        ),
        ReportMetric(
          icon: Icons.check_circle_rounded,
          color: SmartColors.green,
          label: 'Refeições Entregues',
          value: '$meals',
          caption: weekly ? 'nesta semana' : 'de ${feeder.activeSchedule.length} programadas',
        ),
      ],
      chartTitle: 'Ração liberada',
      chartSubtitle: weekly ? 'Gramas por dia da semana' : 'Gramas por horário',
      labels: labels,
      values: values,
      unit: ' g',
      highlight: highlight,
      eventsTitle: 'Últimas refeições',
      eventsSubtitle: 'Liberadas pelo comedouro',
      events: [
        for (final log in feeder.history.take(6))
          ReportEvent(
            icon: log.status == MealStatus.manual ? Icons.touch_app_rounded : Icons.restaurant_rounded,
            color: switch (log.status) {
              MealStatus.onTime => SmartColors.green,
              MealStatus.late => SmartColors.orange,
              MealStatus.manual => SmartColors.blue,
            },
            title: log.status == MealStatus.manual ? 'Porção extra' : 'Refeição entregue',
            subtitle:
                '${log.grams} g • ${switch (log.status) {
                  MealStatus.onTime => 'no horário',
                  MealStatus.late => 'atrasou ${log.delayMinutes} min',
                  MealStatus.manual => 'liberada pelo app',
                }}',
            time: _when(log.time),
          ),
      ],
      emptyEvents: 'Nenhuma refeição liberada ainda.',
    );
  }
}

class _Reservoir extends StatelessWidget {
  final double level;

  const _Reservoir({required this.level});

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    final color = level < 0.2 ? SmartColors.red : SmartColors.orange;
    return Container(
      width: 62,
      height: 96,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: c.soft, borderRadius: BorderRadius.circular(18)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Stack(
          alignment: Alignment.bottomCenter,
          children: [
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: level),
              duration: const Duration(milliseconds: 900),
              curve: Curves.easeOutCubic,
              builder: (context, v, _) => FractionallySizedBox(
                heightFactor: v,
                widthFactor: 1,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [color.withValues(alpha: 0.75), color],
                    ),
                  ),
                ),
              ),
            ),
            for (final mark in const [0.25, 0.5, 0.75])
              Positioned(
                bottom: 88 * mark,
                right: 4,
                child: Container(width: 10, height: 2, color: Colors.white.withValues(alpha: 0.7)),
              ),
          ],
        ),
      ),
    );
  }
}

class _MealForm extends StatefulWidget {
  final FeedingSchedule? existing;

  const _MealForm({this.existing});

  @override
  State<_MealForm> createState() => _MealFormState();
}

class _MealFormState extends State<_MealForm> {
  late TimeOfDay _time = widget.existing == null
      ? const TimeOfDay(hour: 8, minute: 0)
      : TimeOfDay(hour: widget.existing!.minutesOfDay ~/ 60, minute: widget.existing!.minutesOfDay % 60);
  late int _portions = widget.existing?.portions ?? 1;

  String get _timeText => '${_time.hour.toString().padLeft(2, '0')}:${_time.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            widget.existing == null ? 'Nova refeição' : 'Editar refeição',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: c.title),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () async {
              final picked = await showTimePicker(context: context, initialTime: _time);
              if (picked != null) setState(() => _time = picked);
            },
            icon: const Icon(Icons.schedule_rounded),
            label: Text('Horário: $_timeText'),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Porções',
                  style: TextStyle(fontWeight: FontWeight.w700, color: c.text),
                ),
              ),
              IconButton(
                tooltip: 'Menos porções',
                onPressed: _portions > 1 ? () => setState(() => _portions--) : null,
                icon: const Icon(Icons.remove_circle_outline_rounded),
              ),
              Text(
                '$_portions',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: c.title),
              ),
              IconButton(
                tooltip: 'Mais porções',
                onPressed: _portions < 6 ? () => setState(() => _portions++) : null,
                icon: const Icon(Icons.add_circle_outline_rounded),
              ),
            ],
          ),
          Text(
            '${_portions * FeederService.gramsPerPortion} g por refeição',
            style: TextStyle(color: c.muted, fontSize: 12.5),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 52,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: SmartColors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: () => Navigator.pop(
                context,
                FeedingSchedule(
                  time: _timeText,
                  portions: _portions,
                  grams: _portions * FeederService.gramsPerPortion,
                  enabled: widget.existing?.enabled ?? true,
                ),
              ),
              child: const Text('Salvar', style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    );
  }
}
