import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/models/care_event.dart';
import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/care_event_service.dart';
import 'package:happysnouts/services/pet_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/utils/validators.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/outlined_text_field.dart';
import 'package:happysnouts/widgets/tile_card.dart';

Color careTypeColor(CareType type) {
  switch (type) {
    case CareType.vacina:
      return AppColors.green;
    case CareType.consulta:
      return AppColors.orangeStrong;
    case CareType.banhoETosa:
      return AppColors.loginButton;
    case CareType.remedio:
      return Colors.redAccent;
    case CareType.outro:
      return Colors.grey;
  }
}

IconData careTypeIcon(CareType type) {
  switch (type) {
    case CareType.vacina:
      return Icons.vaccines;
    case CareType.consulta:
      return Icons.medical_services_outlined;
    case CareType.banhoETosa:
      return Icons.bathtub_outlined;
    case CareType.remedio:
      return Icons.medication_outlined;
    case CareType.outro:
      return Icons.event_note;
  }
}

class CalendarScreen extends StatefulWidget {
  final String? petId;

  const CalendarScreen({super.key, this.petId});
  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> with ReloadOnChange {
  @override
  List<DataTopic> get reloadTopics => const [DataTopic.reminders, DataTopic.pets];

  @override
  void reload() => _load();

  static const _monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  static const _weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  late DateTime _displayedMonth;
  DateTime? _selectedDay;
  late Future<(List<CareEvent>, List<Pet>)> _future;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _displayedMonth = DateTime(now.year, now.month, 1);
    _load();
  }

  void _load() {
    _future = () async {
      final results = await Future.wait([
        CareEventService.instance.getEvents(petId: widget.petId),
        PetService.instance.getPets(),
      ]);
      return (results[0] as List<CareEvent>, results[1] as List<Pet>);
    }();
  }

  void _changeMonth(int delta) {
    setState(() {
      _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month + delta, 1);
      _selectedDay = null;
    });
  }

  Future<void> _openForm(List<Pet> pets, {CareEvent? existing}) async {
    if (pets.isEmpty) {
      AppFeedback.show(context, 'Cadastre um pet antes de agendar cuidados.', error: true);
      return;
    }
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _CareEventForm(
        pets: widget.petId == null ? pets : pets.where((p) => p.id == widget.petId).toList(),
        existing: existing,
        initialDate: _selectedDay ?? (existing?.date ?? DateTime.now()),
      ),
    );
    if (saved == true && mounted) {
      setState(_load);
      AppFeedback.show(context, 'Evento salvo');
    }
  }

  Future<void> _delete(CareEvent event) async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Excluir evento',
      message: 'Excluir "${event.title}" de ${Formatters.date(event.date)}?',
      confirmLabel: 'Excluir',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    try {
      await CareEventService.instance.delete(event.id);
      if (!mounted) return;
      setState(_load);
      AppFeedback.show(context, 'Evento excluído');
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<(List<CareEvent>, List<Pet>)>(
      future: _future,
      builder: (context, snapshot) {
        final done = snapshot.connectionState == ConnectionState.done || snapshot.hasData;
        return Scaffold(
          appBar: AppBar(title: const Text('Calendário')),
          floatingActionButton: done && snapshot.hasData
              ? FloatingActionButton.extended(
                  backgroundColor: AppColors.navy,
                  foregroundColor: Colors.white,
                  onPressed: () => _openForm(snapshot.data!.$2),
                  icon: const Icon(Icons.add),
                  label: const Text('Agendar'),
                )
              : null,
          body: !done
              ? const LoadingView()
              : snapshot.hasError
              ? ErrorView(message: errorMessage(snapshot.error!), onRetry: () => setState(_load))
              : _buildContent(snapshot.data!.$1, snapshot.data!.$2),
        );
      },
    );
  }

  Widget _buildContent(List<CareEvent> events, List<Pet> pets) {
    final palette = context.palette;
    final monthEvents = events
        .where((e) => e.date.year == _displayedMonth.year && e.date.month == _displayedMonth.month)
        .toList();
    final daysInMonth = DateUtils.getDaysInMonth(_displayedMonth.year, _displayedMonth.month);
    final firstWeekday = DateTime(_displayedMonth.year, _displayedMonth.month, 1).weekday % 7;
    final today = DateUtils.dateOnly(DateTime.now());
    final listed = _selectedDay == null
        ? monthEvents
        : monthEvents.where((e) => DateUtils.isSameDay(e.date, _selectedDay)).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              tooltip: 'Mês anterior',
              onPressed: () => _changeMonth(-1),
              icon: const Icon(Icons.chevron_left),
            ),
            Expanded(
              child: Text(
                '${_monthNames[_displayedMonth.month - 1]} ${_displayedMonth.year}',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: palette.title),
              ),
            ),
            IconButton(tooltip: 'Próximo mês', onPressed: () => _changeMonth(1), icon: const Icon(Icons.chevron_right)),
          ],
        ),
        Row(
          children: _weekdays
              .map(
                (d) => Expanded(
                  child: Center(
                    child: Text(
                      d,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: palette.muted),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 4),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: daysInMonth + firstWeekday,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7),
          itemBuilder: (context, index) {
            if (index < firstWeekday) return const SizedBox();
            final day = DateTime(_displayedMonth.year, _displayedMonth.month, index - firstWeekday + 1);
            final dayEvents = monthEvents.where((e) => DateUtils.isSameDay(e.date, day)).toList();
            final event = dayEvents.isEmpty ? null : dayEvents.first;
            final isSelected = _selectedDay != null && DateUtils.isSameDay(day, _selectedDay);
            final isToday = DateUtils.isSameDay(day, today);
            return InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () => setState(() => _selectedDay = isSelected ? null : day),
              child: Container(
                margin: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: event != null ? careTypeColor(event.type).withValues(alpha: 0.18) : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  border: isSelected
                      ? Border.all(color: palette.title, width: 2)
                      : isToday
                      ? Border.all(color: AppColors.orangeStrong)
                      : null,
                ),
                child: Center(
                  child: Text(
                    '${day.day}',
                    style: TextStyle(
                      fontWeight: event != null || isToday ? FontWeight.bold : FontWeight.normal,
                      color: event != null ? careTypeColor(event.type) : palette.title,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 8,
          children: CareType.values.map((type) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(radius: 5, backgroundColor: careTypeColor(type)),
                const SizedBox(width: 4),
                Text(type.label, style: TextStyle(fontSize: 11, color: palette.text)),
              ],
            );
          }).toList(),
        ),
        const SizedBox(height: 20),
        Text(
          _selectedDay == null ? 'Eventos do mês' : 'Eventos de ${Formatters.date(_selectedDay!)}',
          style: TextStyle(fontWeight: FontWeight.bold, color: palette.title),
        ),
        const SizedBox(height: 10),
        if (listed.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(
              _selectedDay == null
                  ? 'Nenhum evento neste mês.'
                  : 'Nenhum evento neste dia. Toque em "Agendar" para criar.',
              style: TextStyle(color: palette.muted),
            ),
          ),
        ...listed.map((event) => _buildEventTile(event, pets)),
      ],
    );
  }

  Widget _buildEventTile(CareEvent event, List<Pet> pets) {
    final palette = context.palette;
    final past = event.dateTime.isBefore(DateTime.now());
    return TileCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: () => _openForm(pets, existing: event),
        leading: CircleAvatar(
          backgroundColor: careTypeColor(event.type).withValues(alpha: 0.15),
          child: Icon(careTypeIcon(event.type), color: careTypeColor(event.type), size: 18),
        ),
        title: Text(
          event.title,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: palette.text,
            decoration: past ? TextDecoration.lineThrough : null,
          ),
        ),
        subtitle: Text(
          '${event.petName} • ${Formatters.date(event.date)} • ${event.time}',
          style: TextStyle(fontSize: 11, color: palette.muted),
        ),
        trailing: IconButton(
          tooltip: 'Excluir evento',
          onPressed: () => _delete(event),
          icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
        ),
      ),
    );
  }
}

class _CareEventForm extends StatefulWidget {
  final List<Pet> pets;
  final CareEvent? existing;
  final DateTime initialDate;

  const _CareEventForm({required this.pets, required this.initialDate, this.existing});

  @override
  State<_CareEventForm> createState() => _CareEventFormState();
}

class _CareEventFormState extends State<_CareEventForm> {
  final _formKey = GlobalKey<FormState>();
  late CareType _type = widget.existing?.type ?? CareType.consulta;
  late String _petId = widget.pets.any((p) => p.id == widget.existing?.petId)
      ? widget.existing!.petId
      : widget.pets.first.id;
  late final _title = TextEditingController(text: widget.existing?.title ?? '');
  late DateTime _date = widget.existing?.date ?? DateUtils.dateOnly(widget.initialDate);
  late TimeOfDay _time = _parseTime(widget.existing?.time) ?? const TimeOfDay(hour: 9, minute: 0);
  bool _saving = false;

  static TimeOfDay? _parseTime(String? text) {
    if (text == null) return null;
    final parts = text.split(':');
    if (parts.length != 2) return null;
    return TimeOfDay(hour: int.tryParse(parts[0]) ?? 9, minute: int.tryParse(parts[1]) ?? 0);
  }

  String get _timeText => '${_time.hour.toString().padLeft(2, '0')}:${_time.minute.toString().padLeft(2, '0')}';

  @override
  void dispose() {
    _title.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime(DateTime.now().year + 5),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(context: context, initialTime: _time);
    if (picked != null) setState(() => _time = picked);
  }

  Future<void> _save() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final pet = widget.pets.firstWhere((p) => p.id == _petId);
    try {
      await CareEventService.instance.save(
        CareEvent(
          id: widget.existing?.id ?? '',
          date: _date,
          type: _type,
          title: _title.text.trim(),
          petId: pet.id,
          petName: pet.name,
          time: _timeText,
        ),
      );
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.existing == null ? 'Agendar cuidado' : 'Editar cuidado',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: palette.title),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: CareType.values.map((type) {
                  return ChoiceChip(
                    avatar: Icon(careTypeIcon(type), size: 16, color: careTypeColor(type)),
                    label: Text(type.label),
                    selected: _type == type,
                    selectedColor: careTypeColor(type).withValues(alpha: 0.25),
                    onSelected: (_) => setState(() {
                      if (_title.text.isEmpty || CareType.values.any((t) => t.label == _title.text)) {
                        _title.text = type.label;
                      }
                      _type = type;
                    }),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              // No editar não dá para trocar o pet (o backend guarda o lembrete no pet),
              // igual ao site. Antes o app apagava e recriava, perdendo observação e recorrência.
              DropdownButtonFormField<String>(
                initialValue: _petId,
                decoration: InputDecoration(labelText: 'Pet', helperText: widget.existing == null ? null : 'O pet não muda ao editar'),
                items: widget.pets.map((p) => DropdownMenuItem(value: p.id, child: Text(p.name))).toList(),
                onChanged: widget.existing == null ? (id) => setState(() => _petId = id ?? _petId) : null,
              ),
              const SizedBox(height: 12),
              OutlinedTextField(
                controller: _title,
                label: 'Título',
                hint: 'Ex.: Vacina V10',
                validator: Validators.required,
                textCapitalization: TextCapitalization.sentences,
                inputFormatters: [LengthLimitingTextInputFormatter(CareEventService.titleMaxLength)],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _pickDate,
                      icon: const Icon(Icons.calendar_today, size: 18),
                      label: Text(Formatters.date(_date)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _pickTime,
                      icon: const Icon(Icons.schedule, size: 18),
                      label: Text(_timeText),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Salvar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
