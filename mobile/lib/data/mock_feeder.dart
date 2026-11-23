import 'package:happysnouts/models/feeder.dart';

const mockFeeder = Feeder(
  name: 'Comedouro Automático',
  isConnected: true,
  batteryPercent: 67,
  schedule: [
    FeedingSchedule(time: '08:00', portions: 2, grams: 180),
    FeedingSchedule(time: '12:00', portions: 2, grams: 180),
    FeedingSchedule(time: '18:00', portions: 2, grams: 180),
    FeedingSchedule(time: '23:00', portions: 1, grams: 90),
  ],
);
