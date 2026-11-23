import 'package:flutter/material.dart';
import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/screens/pets/pet_form_screen.dart';
import 'package:happysnouts/screens/pets/pet_profile_screen.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/pet_service.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/photo_avatar.dart';

class MyPetsScreen extends StatefulWidget {
  const MyPetsScreen({super.key});

  @override
  State<MyPetsScreen> createState() => _MyPetsScreenState();
}

class _MyPetsScreenState extends State<MyPetsScreen> with ReloadOnChange {
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

  Future<void> _open(Widget screen) async {
    await Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
    if (mounted) setState(_load);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Meus Pets')),
      body: FutureStateBuilder<List<Pet>>(
        future: _future,
        onRetry: () => setState(_load),
        builder: (context, pets) {
          if (pets.isEmpty) {
            return EmptyView(
              icon: Icons.pets,
              title: 'Nenhum pet cadastrado',
              message: 'Cadastre seu pet para acompanhar vacinas, consultas e alimentação.',
              actionLabel: 'Cadastrar pet',
              onAction: () => _open(const PetFormScreen()),
            );
          }
          return LayoutBuilder(
            builder: (context, constraints) {
              final columns = (constraints.maxWidth / 180).floor().clamp(2, 5);
              return GridView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: pets.length + 1,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: columns,
                  mainAxisSpacing: 14,
                  crossAxisSpacing: 14,
                  childAspectRatio: 0.85,
                ),
                itemBuilder: (context, index) {
                  if (index < pets.length) return _buildPetCard(pets[index]);
                  return _buildAddCard();
                },
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildPetCard(Pet pet) {
    final palette = context.palette;
    return Material(
      color: palette.card,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _open(PetProfileScreen(petId: pet.id)),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: palette.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              PetAvatar(pet: pet, radius: 36),
              const SizedBox(height: 10),
              Text(
                pet.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontWeight: FontWeight.bold, color: palette.title),
              ),
              Text(
                pet.breed,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 11, color: palette.muted),
              ),
              if (pet.age.isNotEmpty)
                Text(
                  pet.age,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11, color: palette.muted),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAddCard() {
    final palette = context.palette;
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => _open(const PetFormScreen()),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: palette.title.withValues(alpha: 0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_circle_outline, color: palette.title, size: 32),
            const SizedBox(height: 8),
            Text(
              'Adicionar Perfil',
              style: TextStyle(color: palette.title, fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}

class PetAvatar extends StatelessWidget {
  final Pet pet;
  final double radius;

  const PetAvatar({super.key, required this.pet, this.radius = 24});

  @override
  Widget build(BuildContext context) {
    final isCat = pet.species.toLowerCase() == 'gato';
    return PhotoAvatar(imageUrl: pet.imageUrl, radius: radius, fallbackIcon: isCat ? Icons.cruelty_free : Icons.pets);
  }
}
