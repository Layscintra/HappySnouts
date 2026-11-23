import 'package:flutter/material.dart';
import 'package:happysnouts/models/care_event.dart';
import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/screens/pets/calendar_screen.dart';
import 'package:happysnouts/screens/pets/my_pets_screen.dart';
import 'package:happysnouts/screens/pets/pet_form_screen.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/care_event_service.dart';
import 'package:happysnouts/services/pet_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/async_views.dart';

class PetProfileScreen extends StatefulWidget {
  final String petId;
  const PetProfileScreen({super.key, required this.petId});

  @override
  State<PetProfileScreen> createState() => _PetProfileScreenState();
}

class _PetProfileScreenState extends State<PetProfileScreen> with ReloadOnChange {
  @override
  List<DataTopic> get reloadTopics => const [DataTopic.pets, DataTopic.reminders];

  @override
  void reload() => _load();

  late Future<(Pet, List<CareEvent>)> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = () async {
      final pet = await PetService.instance.getPet(widget.petId);
      final events = await CareEventService.instance.getEvents(petId: widget.petId);
      return (pet, events);
    }();
  }

  Future<void> _edit(Pet pet) async {
    final saved = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => PetFormScreen(pet: pet)));
    if (saved == true && mounted) setState(_load);
  }

  Future<void> _delete(Pet pet) async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Excluir ${pet.name}',
      message: 'O perfil e os eventos do calendário deste pet serão excluídos.',
      confirmLabel: 'Excluir',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    try {
      await PetService.instance.delete(pet.id);
      await CareEventService.instance.deleteByPet(pet.id);
      if (!mounted) return;
      AppFeedback.show(context, '${pet.name} foi excluído');
      Navigator.pop(context);
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<(Pet, List<CareEvent>)>(
      future: _future,
      builder: (context, snapshot) {
        final data = snapshot.data;
        final loaded = data != null && !snapshot.hasError;
        return Scaffold(
          appBar: AppBar(
            title: const Text('Perfil do pet'),
            actions: [
              if (loaded) ...[
                IconButton(
                  tooltip: 'Calendário do pet',
                  onPressed: () async {
                    await Navigator.push(context, MaterialPageRoute(builder: (_) => CalendarScreen(petId: data.$1.id)));
                    if (mounted) setState(_load);
                  },
                  icon: const Icon(Icons.calendar_month),
                ),
                IconButton(
                  tooltip: 'Excluir pet',
                  onPressed: () => _delete(data.$1),
                  icon: const Icon(Icons.delete_outline),
                ),
              ],
            ],
          ),
          body: snapshot.connectionState != ConnectionState.done && data == null
              ? const LoadingView()
              : snapshot.hasError
              ? ErrorView(message: errorMessage(snapshot.error!), onRetry: () => setState(_load))
              : _buildContent(data!.$1, data.$2),
        );
      },
    );
  }

  Widget _buildContent(Pet pet, List<CareEvent> events) {
    final palette = context.palette;
    final now = DateTime.now();
    final upcoming = events.where((e) => e.dateTime.isAfter(now)).take(3).toList();
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              PetAvatar(pet: pet, radius: 40),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pet.name,
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: palette.title),
                    ),
                    Text(pet.breed, style: TextStyle(fontSize: 13, color: palette.muted)),
                    if (pet.age.isNotEmpty) Text(pet.age, style: TextStyle(fontSize: 13, color: palette.muted)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _buildInfoCard('Detalhes', [
            ('Raça:', pet.breed.isEmpty ? 'Não informada' : pet.breed),
            ('Idade:', pet.age.isEmpty ? 'Não informada' : pet.age),
            ('Peso:', pet.weightKg == null ? 'Não informado' : Formatters.weight(pet.weightKg!)),
          ]),
          const SizedBox(height: 16),
          Text(
            'Próximos cuidados',
            style: TextStyle(fontWeight: FontWeight.bold, color: palette.title),
          ),
          const SizedBox(height: 8),
          if (upcoming.isEmpty)
            Text('Nenhum evento agendado.', style: TextStyle(color: palette.muted, fontSize: 13))
          else
            ...upcoming.map(
              (e) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: careTypeColor(e.type).withValues(alpha: 0.15),
                  child: Icon(careTypeIcon(e.type), color: careTypeColor(e.type), size: 18),
                ),
                title: Text(
                  e.title,
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.text),
                ),
                subtitle: Text(
                  '${Formatters.date(e.date)} • ${e.time}',
                  style: TextStyle(fontSize: 12, color: palette.muted),
                ),
              ),
            ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(onPressed: () => _edit(pet), child: const Text('Editar perfil')),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String title, List<(String, String)> rows) {
    final palette = context.palette;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: palette.softCard, borderRadius: BorderRadius.circular(14)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(fontWeight: FontWeight.bold, color: palette.title),
          ),
          const SizedBox(height: 10),
          ...rows.map(
            (row) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(row.$1, style: TextStyle(fontSize: 12, color: palette.muted)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      row.$2,
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: palette.text),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
