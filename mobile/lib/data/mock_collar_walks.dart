import 'dart:math';

import 'package:latlong2/latlong.dart' show LatLng;

class SimWalk {
  final String title;
  final DateTime start;
  final int minutes;
  final List<LatLng> points;
  final bool live;

  const SimWalk({
    required this.title,
    required this.start,
    required this.minutes,
    required this.points,
    this.live = false,
  });

  double get meters => CollarArea.pathMeters(points);
  DateTime get end => start.add(Duration(minutes: minutes));

  double get speedKmh => minutes == 0 ? 0 : (meters / 1000) / (minutes / 60);
}

class GeofenceEvent {
  final DateTime time;
  final bool left;

  const GeofenceEvent(this.time, {required this.left});
}

class LivePoint {
  final LatLng position;
  final String street;

  const LivePoint(this.position, this.street);
}

/// Região de demonstração do rastreador: ruas reais de Osasco (Rochdale).
/// Os trajetos foram calculados uma vez com a Routes API do Google (a pé,
/// seguindo as ruas) e são os mesmos do site
/// (`frontend/src/components/dispositivos/trajetosColeira.js`).
/// Quando a coleira física mandar o GPS para o backend, estes pontos saem e
/// entram as posições reais.
class CollarArea {
  CollarArea._();

  /// Casa do tutor (R. Andradina, 227) = centro da Zona Segura.
  static const LatLng home = LatLng(-23.516403, -46.778254);
  static const String district = 'Rochdale • Osasco, SP';

  /// Raio da Zona Segura, em metros.
  static const double geofenceRadius = 110;

  static double metersBetween(LatLng a, LatLng b) {
    const earth = 6371000.0;
    double rad(double g) => g * pi / 180;
    final dLat = rad(b.latitude - a.latitude);
    final dLng = rad(b.longitude - a.longitude);
    final h = pow(sin(dLat / 2), 2) + cos(rad(a.latitude)) * cos(rad(b.latitude)) * pow(sin(dLng / 2), 2);
    return 2 * earth * asin(sqrt(h));
  }

  static bool insideSafeZone(LatLng p) => metersBetween(p, home) <= geofenceRadius;

  static double pathMeters(List<LatLng> points) {
    var m = 0.0;
    for (var k = 1; k < points.length; k++) {
      m += metersBetween(points[k - 1], points[k]);
    }
    return m;
  }

  static LatLng lerp(LatLng a, LatLng b, double t) =>
      LatLng(a.latitude + (b.latitude - a.latitude) * t, a.longitude + (b.longitude - a.longitude) * t);

  static const _andradina = 'R. Andradina';
  static const _amparo = 'R. Amparo';
  static const _analandia = 'R. Analândia';
  static const _campina = 'R. Campina Grande';

  /// Passeio ao vivo, um ponto a cada ~20 m: volta no quarteirão
  /// Andradina -> Amparo -> Analândia -> Campina Grande -> Andradina.
  static const List<LivePoint> route = [
    LivePoint(LatLng(-23.51645, -46.77819), _andradina),
    LivePoint(LatLng(-23.516588, -46.778316), _andradina),
    LivePoint(LatLng(-23.516726, -46.778441), _andradina),
    LivePoint(LatLng(-23.516735, -46.778585), _amparo),
    LivePoint(LatLng(-23.516631, -46.778745), _amparo),
    LivePoint(LatLng(-23.516532, -46.778908), _amparo),
    LivePoint(LatLng(-23.516449, -46.779082), _amparo),
    LivePoint(LatLng(-23.516334, -46.779136), _analandia),
    LivePoint(LatLng(-23.516181, -46.779032), _analandia),
    LivePoint(LatLng(-23.516029, -46.778929), _analandia),
    LivePoint(LatLng(-23.515884, -46.778813), _analandia),
    LivePoint(LatLng(-23.515742, -46.778693), _analandia),
    LivePoint(LatLng(-23.515605, -46.778567), _analandia),
    LivePoint(LatLng(-23.515467, -46.778441), _analandia),
    LivePoint(LatLng(-23.515338, -46.778305), _analandia),
    LivePoint(LatLng(-23.515219, -46.778158), _analandia),
    LivePoint(LatLng(-23.515193, -46.778031), _campina),
    LivePoint(LatLng(-23.515355, -46.777945), _campina),
    LivePoint(LatLng(-23.515515, -46.777857), _campina),
    LivePoint(LatLng(-23.515675, -46.777768), _campina),
    LivePoint(LatLng(-23.515835, -46.777679), _campina),
    LivePoint(LatLng(-23.515978, -46.777759), _andradina),
    LivePoint(LatLng(-23.516116, -46.777885), _andradina),
    LivePoint(LatLng(-23.516253, -46.77801), _andradina),
    LivePoint(LatLng(-23.516391, -46.778136), _andradina),
  ];

  /// Andradina -> Alto Alegre -> Agudos -> Altinópolis -> Viela Alto Alegre -> volta.
  static const List<LatLng> _morning = [
    LatLng(-23.51645, -46.77819),
    LatLng(-23.51546, -46.77726),
    LatLng(-23.51528, -46.77706),
    LatLng(-23.51508, -46.77684),
    LatLng(-23.51479, -46.77645),
    LatLng(-23.5155, -46.77609),
    LatLng(-23.51565, -46.77633),
    LatLng(-23.51577, -46.77645),
    LatLng(-23.51597, -46.77659),
    LatLng(-23.51619, -46.77668),
    LatLng(-23.51596, -46.77745),
    LatLng(-23.51615, -46.77748),
    LatLng(-23.51587, -46.77766),
    LatLng(-23.51645, -46.77819),
  ];

  /// Andradina -> Amparo -> Porto Feliz e volta.
  static const List<LatLng> _quick = [
    LatLng(-23.51645, -46.77819),
    LatLng(-23.51679, -46.7785),
    LatLng(-23.51654, -46.77889),
    LatLng(-23.5161, -46.77855),
    LatLng(-23.5159, -46.77837),
    LatLng(-23.51633, -46.77873),
    LatLng(-23.51654, -46.77889),
    LatLng(-23.51679, -46.7785),
    LatLng(-23.51645, -46.77819),
  ];

  /// Volta no quarteirão + Alto Alegre / Agudos / Altinópolis.
  static const List<LatLng> _afternoon = [
    LatLng(-23.51645, -46.77819),
    LatLng(-23.51679, -46.7785),
    LatLng(-23.51655, -46.77887),
    LatLng(-23.51647, -46.77904),
    LatLng(-23.5164, -46.77918),
    LatLng(-23.516, -46.77891),
    LatLng(-23.51576, -46.77871),
    LatLng(-23.51539, -46.77837),
    LatLng(-23.51514, -46.77806),
    LatLng(-23.51542, -46.77791),
    LatLng(-23.51587, -46.77766),
    LatLng(-23.51546, -46.77726),
    LatLng(-23.51528, -46.77706),
    LatLng(-23.51508, -46.77684),
    LatLng(-23.51479, -46.77645),
    LatLng(-23.5155, -46.77609),
    LatLng(-23.51565, -46.77633),
    LatLng(-23.51577, -46.77645),
    LatLng(-23.51597, -46.77659),
    LatLng(-23.51619, -46.77668),
    LatLng(-23.51596, -46.77745),
    LatLng(-23.51615, -46.77748),
    LatLng(-23.51587, -46.77766),
    LatLng(-23.51645, -46.77819),
  ];

  static List<SimWalk> todayWalks(DateTime now) {
    DateTime at(int h, int m) => DateTime(now.year, now.month, now.day, h, m);
    final walks = [
      SimWalk(title: 'Caminhada matinal', start: at(7, 10), minutes: 15, points: _morning),
      SimWalk(title: 'Volta rápida', start: at(12, 30), minutes: 8, points: _quick),
      SimWalk(title: 'Caminhada da tarde', start: at(16, 10), minutes: 22, points: _afternoon),
    ];
    // Só os que já começaram (abrindo o app de manhã, aparece menos coisa).
    return walks.where((w) => w.start.isBefore(now)).toList();
  }

  /// Saídas e retornos da Zona Segura ao longo de um passeio (tempo
  /// proporcional à distância percorrida).
  static List<GeofenceEvent> geofenceEvents(SimWalk walk) {
    final events = <GeofenceEvent>[];
    final total = pathMeters(walk.points);
    if (total == 0) return events;
    var walked = 0.0;
    var inside = insideSafeZone(walk.points.first);
    for (var k = 1; k < walk.points.length; k++) {
      final a = walk.points[k - 1], b = walk.points[k];
      final segment = metersBetween(a, b);
      const steps = 24;
      for (var s = 1; s <= steps; s++) {
        final nowInside = insideSafeZone(lerp(a, b, s / steps));
        if (nowInside != inside) {
          inside = nowInside;
          final dist = walked + segment * s / steps;
          final when = walk.start.add(Duration(seconds: (walk.minutes * 60 * dist / total).round()));
          events.add(GeofenceEvent(when, left: !nowInside));
        }
      }
      walked += segment;
    }
    return events;
  }
}
