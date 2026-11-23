import 'package:flutter/widgets.dart';

/// Tipos de dado que as telas mostram. Quando um deles muda (salvou, excluiu,
/// mudou status...), toda tela aberta que mostra aquele dado recarrega sozinha.
enum DataTopic {
  pets,
  reminders,
  addresses,
  cards,
  orders,
  products,
  categories,
  blog,
  notifications,
  messages,
  profile,
  favorites,
}

/// "Avisos" de mudança entre telas, no mesmo padrão dos outros controllers
/// (ValueNotifier). Assim, cadastrar um pet já faz ele aparecer em Meus Pets,
/// Dispositivos, Calendário etc., sem precisar sair e entrar de novo.
class AppEvents {
  AppEvents._();

  static final Map<DataTopic, ValueNotifier<int>> _notifiers = {
    for (final topic in DataTopic.values) topic: ValueNotifier<int>(0),
  };

  static Listenable of(DataTopic topic) => _notifiers[topic]!;

  static void changed(DataTopic topic) => _notifiers[topic]!.value++;

  static void changedAll(Iterable<DataTopic> topics) => topics.forEach(changed);
}

/// Mixin para telas com FutureStateBuilder: chama [reload] (dentro de um
/// setState) sempre que um dos [topics] mudar em qualquer lugar do app.
mixin ReloadOnChange<T extends StatefulWidget> on State<T> {
  List<DataTopic> get reloadTopics;

  void reload();

  late final Listenable _listenable = Listenable.merge(reloadTopics.map(AppEvents.of).toList());

  void _onChanged() {
    if (mounted) setState(reload);
  }

  @override
  void initState() {
    super.initState();
    _listenable.addListener(_onChanged);
  }

  @override
  void dispose() {
    _listenable.removeListener(_onChanged);
    super.dispose();
  }
}
