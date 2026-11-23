class AppNotification {
  final int id;
  final String title;
  final String message;

  final String type;

  final int? referenceId;
  final bool read;
  final DateTime createdAt;

  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.referenceId,
    required this.read,
    required this.createdAt,
  });

  AppNotification copyWith({bool? read}) => AppNotification(
    id: id,
    title: title,
    message: message,
    type: type,
    referenceId: referenceId,
    read: read ?? this.read,
    createdAt: createdAt,
  );
}
