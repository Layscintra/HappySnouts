import 'dart:math';
import 'dart:ui' show lerpDouble;

import 'package:flutter/foundation.dart' show listEquals;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:happysnouts/widgets/devices/smart_kit.dart';

class DeviceHeroCard extends StatelessWidget {
  final Widget leading;
  final String title;
  final String? subtitle;
  final bool online;
  final int? battery;
  final List<Widget> footer;

  const DeviceHeroCard({
    super.key,
    required this.leading,
    required this.title,
    this.subtitle,
    required this.online,
    this.battery,
    this.footer = const [],
  });

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    return SmartCard(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              SizedBox(width: 64, height: 64, child: leading),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: c.title, letterSpacing: -0.3),
                    ),
                    if (subtitle != null && subtitle!.isNotEmpty)
                      Text(
                        subtitle!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 13, color: c.muted, fontWeight: FontWeight.w500),
                      ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 250),
                          child: online
                              ? SmartBadge.online('Online', key: const ValueKey('on'))
                              : const SmartBadge(
                                  key: ValueKey('off'),
                                  label: 'Offline',
                                  color: SmartColors.red,
                                  textColor: Color(0xFFB42318),
                                  dot: true,
                                ),
                        ),
                        if (battery != null)
                          SmartBadge(
                            label: '$battery%',
                            color: battery! > 20 ? SmartColors.blue : SmartColors.red,
                            icon: _batteryIcon(battery!),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (footer.isNotEmpty) ...[Divider(height: 26, color: c.line), ...footer],
        ],
      ),
    );
  }

  static IconData _batteryIcon(int percent) {
    if (percent > 85) return Icons.battery_full_rounded;
    if (percent > 60) return Icons.battery_5_bar_rounded;
    if (percent > 40) return Icons.battery_4_bar_rounded;
    if (percent > 20) return Icons.battery_2_bar_rounded;
    return Icons.battery_alert_rounded;
  }
}

class DeviceLeading extends StatelessWidget {
  final Widget child;
  final bool round;

  const DeviceLeading({super.key, required this.child, this.round = false});

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    if (round) {
      return Container(
        padding: const EdgeInsets.all(2.5),
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(colors: [SmartColors.orange, Color(0xFFFFB866)]),
        ),
        child: Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(color: c.card, shape: BoxShape.circle),
          child: ClipOval(child: child),
        ),
      );
    }
    return Container(
      padding: const EdgeInsets.all(7),
      decoration: BoxDecoration(color: c.soft, borderRadius: BorderRadius.circular(18)),
      child: child,
    );
  }
}

class DeviceInfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;
  final Widget? trailing;

  const DeviceInfoRow({super.key, required this.icon, required this.label, this.value, this.trailing});

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 34),
      child: Row(
        children: [
          Icon(icon, size: 18, color: c.muted),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 13, color: c.muted, fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(width: 8),
          if (trailing != null)
            trailing!
          else
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: Text(
                value ?? '',
                key: ValueKey(value),
                style: TextStyle(fontSize: 13.5, color: c.title, fontWeight: FontWeight.w800),
              ),
            ),
        ],
      ),
    );
  }
}

class DeviceActionButton extends StatelessWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final Color color;
  final bool active;

  const DeviceActionButton({
    super.key,
    required this.child,
    this.onPressed,
    this.color = SmartColors.orange,
    this.active = true,
  });

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    final bg = active ? color : c.line;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
      height: 52,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        boxShadow: active
            ? [BoxShadow(color: color.withValues(alpha: 0.32), blurRadius: 16, offset: const Offset(0, 6))]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onPressed,
          child: Center(
            child: DefaultTextStyle.merge(
              style: TextStyle(color: active ? Colors.white : c.muted, fontWeight: FontWeight.w800, fontSize: 15),
              child: IconTheme.merge(
                data: IconThemeData(color: active ? Colors.white : c.muted, size: 21),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  transitionBuilder: (child, a) => ScaleTransition(
                    scale: Tween(begin: 0.85, end: 1.0).animate(a),
                    child: FadeTransition(opacity: a, child: child),
                  ),
                  child: child,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class DeviceTabs extends StatelessWidget {
  final List<String> options;
  final int selected;
  final ValueChanged<int> onChanged;

  const DeviceTabs({super.key, required this.options, required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) => SmartSegmented(options: options, selected: selected, onChanged: onChanged);
}

class DeviceTabView extends StatelessWidget {
  final int index;
  final Widget child;

  const DeviceTabView({super.key, required this.index, required this.child});

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 320),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      transitionBuilder: (child, animation) => FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position: Tween(begin: const Offset(0, 0.03), end: Offset.zero).animate(animation),
          child: child,
        ),
      ),
      layoutBuilder: (current, previous) => Stack(alignment: Alignment.topCenter, children: [...previous, ?current]),
      child: KeyedSubtree(key: ValueKey(index), child: child),
    );
  }
}

class ReportMetric {
  final IconData icon;
  final Color color;
  final String label;
  final String value;
  final String caption;

  const ReportMetric({
    required this.icon,
    required this.color,
    required this.label,
    required this.value,
    required this.caption,
  });
}

class ReportEvent {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final String time;

  const ReportEvent({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.time,
  });
}

/// Relatório padrão dos aparelhos: seletor Diário/Semanal, três métricas,
/// gráfico de barras interativo e lista de eventos recentes. Coleira e
/// comedouro usam exatamente este widget.
class DeviceReport extends StatelessWidget {
  final String title;
  final String subtitle;
  final int range;
  final ValueChanged<int> onRangeChanged;
  final List<ReportMetric> metrics;
  final String chartTitle;
  final String chartSubtitle;
  final List<String> labels;
  final List<double> values;
  final String unit;
  final int? highlight;
  final String eventsTitle;
  final String eventsSubtitle;
  final List<ReportEvent> events;
  final String emptyEvents;

  const DeviceReport({
    super.key,
    required this.title,
    required this.subtitle,
    required this.range,
    required this.onRangeChanged,
    required this.metrics,
    required this.chartTitle,
    required this.chartSubtitle,
    required this.labels,
    required this.values,
    required this.unit,
    this.highlight,
    required this.eventsTitle,
    required this.eventsSubtitle,
    required this.events,
    required this.emptyEvents,
  });

  static const ranges = ['Diário', 'Semanal'];

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SmartSectionTitle(title, subtitle: subtitle),
        const SizedBox(height: 12),
        SmartSegmented(dense: true, options: ranges, selected: range, onChanged: onRangeChanged),
        const SizedBox(height: 14),
        ReportMetricsRow(metrics: metrics),
        const SizedBox(height: 14),
        SmartCard(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SmartSectionTitle(chartTitle, subtitle: chartSubtitle),
              const SizedBox(height: 8),
              if (labels.isEmpty)
                SizedBox(
                  height: 120,
                  child: Center(
                    child: Text('Sem dados para mostrar.', style: TextStyle(color: c.muted)),
                  ),
                )
              else
                ReportBarChart(labels: labels, values: values, unit: unit, highlight: highlight),
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.touch_app_outlined, size: 14, color: c.muted),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text('Toque ou passe o mouse numa barra.', style: TextStyle(fontSize: 11.5, color: c.muted)),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ReportEventList(title: eventsTitle, subtitle: eventsSubtitle, events: events, empty: emptyEvents),
      ],
    );
  }
}

class ReportMetricsRow extends StatelessWidget {
  final List<ReportMetric> metrics;

  const ReportMetricsRow({super.key, required this.metrics});

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (var i = 0; i < metrics.length; i++) ...[
            if (i > 0) const SizedBox(width: 10),
            Expanded(
              child: SmartCard(
                padding: const EdgeInsets.fromLTRB(12, 12, 10, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SmartIconChip(icon: metrics[i].icon, color: metrics[i].color, size: 32),
                    const SizedBox(height: 10),
                    Text(
                      metrics[i].label,
                      maxLines: 2,
                      style: TextStyle(fontSize: 11.5, height: 1.2, color: c.muted, fontWeight: FontWeight.w600),
                    ),
                    const Spacer(),
                    const SizedBox(height: 2),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        child: Text(
                          metrics[i].value,
                          key: ValueKey(metrics[i].value),
                          style: TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: c.title,
                            letterSpacing: -0.4,
                          ),
                        ),
                      ),
                    ),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(metrics[i].caption, maxLines: 1, style: TextStyle(fontSize: 11, color: c.muted)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class ReportEventList extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<ReportEvent> events;
  final String empty;

  const ReportEventList({
    super.key,
    required this.title,
    required this.subtitle,
    required this.events,
    required this.empty,
  });

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    return SmartCard(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SmartSectionTitle(title, subtitle: subtitle),
          const SizedBox(height: 6),
          if (events.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Text(empty, style: TextStyle(color: c.muted)),
            ),
          for (var i = 0; i < events.length; i++) ...[
            if (i > 0) Divider(height: 1, color: c.line),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Row(
                children: [
                  SmartIconChip(icon: events[i].icon, color: events[i].color, size: 38),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          events[i].title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: c.title),
                        ),
                        Text(
                          events[i].subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 12, color: c.muted),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    events[i].time,
                    style: TextStyle(fontSize: 12, color: c.muted, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Gráfico de barras de uma série. A barra em destaque ([highlight], ex.:
/// hora atual ou hoje) e a barra tocada/sob o mouse ficam laranja; ao tocar
/// ou passar o mouse aparece um balão com o valor. Mudanças de valores são
/// animadas (as barras crescem ou encolhem até o novo valor).
class ReportBarChart extends StatefulWidget {
  final List<String> labels;
  final List<double> values;
  final String unit;
  final int? highlight;
  final double height;

  const ReportBarChart({
    super.key,
    required this.labels,
    required this.values,
    this.unit = '',
    this.highlight,
    this.height = 180,
  });

  @override
  State<ReportBarChart> createState() => _ReportBarChartState();
}

class _ReportBarChartState extends State<ReportBarChart> with SingleTickerProviderStateMixin {
  late final _anim = AnimationController(vsync: this, duration: const Duration(milliseconds: 650))..forward();
  late List<double> _from = List.filled(widget.values.length, 0);
  int? _selected;

  @override
  void didUpdateWidget(ReportBarChart old) {
    super.didUpdateWidget(old);
    if (!listEquals(old.labels, widget.labels)) {
      _from = List.filled(widget.values.length, 0);
      _selected = null;
      _anim.forward(from: 0);
    } else if (!listEquals(old.values, widget.values)) {
      _from = _current(old.values);
      _anim.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  List<double> _current(List<double> target) {
    final t = Curves.easeOutCubic.transform(_anim.value);
    return [for (var i = 0; i < target.length; i++) lerpDouble(i < _from.length ? _from[i] : 0, target[i], t)!];
  }

  int _indexAt(Offset local, double width) =>
      (local.dx / (width / widget.labels.length)).floor().clamp(0, widget.labels.length - 1);

  String _fmt(double v) => v == v.roundToDouble() ? v.toInt().toString() : v.toStringAsFixed(1).replaceAll('.', ',');

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    final total = widget.values.fold(0.0, (s, v) => s + v);
    return Semantics(
      label:
          'Gráfico de barras: ${[for (var i = 0; i < widget.labels.length; i++) '${widget.labels[i]} ${_fmt(widget.values[i])}${widget.unit}'].join(', ')}',
      child: SizedBox(
        height: widget.height,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final width = constraints.maxWidth;
            return MouseRegion(
              onHover: (e) {
                final i = _indexAt(e.localPosition, width);
                if (i != _selected) setState(() => _selected = i);
              },
              onExit: (_) => setState(() => _selected = null),
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTapDown: (d) {
                  final i = _indexAt(d.localPosition, width);
                  setState(() => _selected = _selected == i ? null : i);
                },
                child: AnimatedBuilder(
                  animation: _anim,
                  builder: (context, _) => CustomPaint(
                    size: Size(width, widget.height),
                    painter: _ReportBarsPainter(
                      labels: widget.labels,
                      values: _current(widget.values),
                      maxValue: widget.values.fold(0.0, max),
                      selected: _selected,
                      highlight: widget.highlight,
                      tooltip: _selected == null ? null : '${_fmt(widget.values[_selected!])}${widget.unit}',
                      tooltipNote: _selected == null || total == 0
                          ? null
                          : '${(widget.values[_selected!] / total * 100).round()}% do total',
                      colors: c,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ReportBarsPainter extends CustomPainter {
  final List<String> labels;
  final List<double> values;
  final double maxValue;
  final int? selected;
  final int? highlight;
  final String? tooltip;
  final String? tooltipNote;
  final SmartColors colors;

  _ReportBarsPainter({
    required this.labels,
    required this.values,
    required this.maxValue,
    required this.selected,
    required this.highlight,
    required this.tooltip,
    required this.tooltipNote,
    required this.colors,
  });

  static const _labelHeight = 22.0;
  static const _topPad = 46.0;

  @override
  void paint(Canvas canvas, Size size) {
    final n = labels.length;
    final chartH = size.height - _labelHeight - _topPad;
    final maxY = max(1.0, maxValue) * 1.08;
    double y(double v) => _topPad + chartH - chartH * (v / maxY).clamp(0, 1);

    final grid = Paint()
      ..color = colors.line
      ..strokeWidth = 1;
    for (var g = 0; g <= 3; g++) {
      final gy = _topPad + chartH * g / 3;
      canvas.drawLine(Offset(0, gy), Offset(size.width, gy), grid);
    }

    final slot = size.width / n;
    final barW = min(26.0, slot * 0.56);
    final active = selected ?? highlight;
    for (var i = 0; i < n; i++) {
      final left = slot * i + (slot - barW) / 2;
      final isActive = i == active;
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTRB(left, _topPad, left + barW, y(0)), const Radius.circular(8)),
        Paint()..color = colors.soft,
      );
      final v = values[i];
      if (v > 0) {
        final top = min(y(v), y(0) - 4);
        canvas.drawRRect(
          RRect.fromRectAndRadius(Rect.fromLTRB(left, top, left + barW, y(0)), const Radius.circular(8)),
          Paint()
            ..color = isActive ? SmartColors.orange : colors.chartBar.withValues(alpha: selected != null ? 0.55 : 1),
        );
      }
      _text(
        canvas,
        labels[i],
        Offset(slot * i + slot / 2, size.height - _labelHeight / 2),
        TextStyle(
          fontSize: n > 7 ? 10 : 11,
          color: isActive ? colors.title : colors.muted,
          fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
        ),
      );
    }

    if (selected != null && tooltip != null) {
      final i = selected!;
      final bg = colors.isDark ? Colors.white : SmartColors.navy;
      final fg = colors.isDark ? SmartColors.navy : Colors.white;
      final painters = [
        _layout('${labels[i]} • $tooltip', TextStyle(fontSize: 11.5, color: fg, fontWeight: FontWeight.w800)),
        if (tooltipNote != null)
          _layout(
            tooltipNote!,
            TextStyle(fontSize: 10.5, color: fg.withValues(alpha: 0.75), fontWeight: FontWeight.w500),
          ),
      ];
      final w = painters.map((p) => p.width).reduce(max) + 20;
      final h = painters.fold(0.0, (s, p) => s + p.height) + 12;
      final cx = (slot * i + slot / 2).clamp(w / 2, max(w / 2, size.width - w / 2));
      final barTop = y(values[i]);
      final top = max(0.0, barTop - h - 10);
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(cx - w / 2, top, w, h), const Radius.circular(10)),
        Paint()..color = bg,
      );
      final ax = slot * i + slot / 2;
      canvas.drawPath(
        Path()
          ..moveTo(ax - 5, top + h)
          ..lineTo(ax + 5, top + h)
          ..lineTo(ax, top + h + 5)
          ..close(),
        Paint()..color = bg,
      );
      var ty = top + 6;
      for (final p in painters) {
        p.paint(canvas, Offset(cx - w / 2 + 10, ty));
        ty += p.height;
      }
    }
  }

  TextPainter _layout(String text, TextStyle style) => TextPainter(
    text: TextSpan(
      text: text,
      style: GoogleFonts.plusJakartaSans(textStyle: style),
    ),
    textDirection: TextDirection.ltr,
  )..layout();

  void _text(Canvas canvas, String text, Offset center, TextStyle style) {
    final tp = _layout(text, style);
    tp.paint(canvas, center - Offset(tp.width / 2, tp.height / 2));
  }

  @override
  bool shouldRepaint(_ReportBarsPainter old) => true;
}
