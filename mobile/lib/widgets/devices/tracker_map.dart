import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:happysnouts/widgets/devices/smart_kit.dart';
import 'package:latlong2/latlong.dart' show LatLng;

class TrackerTrail {
  final List<LatLng> points;
  final Color color;
  final double width;
  final bool dashed;

  const TrackerTrail(this.points, {required this.color, this.width = 6, this.dashed = false});
}

/// Nos testes de widget não há internet: o mapa aparece sem os "quadradinhos"
/// (tiles) do OpenStreetMap, só com as linhas, círculos e marcadores.
bool get _inWidgetTest => WidgetsBinding.instance.runtimeType.toString().contains('TestWidgetsFlutterBinding');

/// Mapa do rastreador da coleira, feito com o OpenStreetMap (pacote
/// `flutter_map`). Não precisa de chave nem de conta: funciona no Android,
/// no iOS, na web e no Windows.
///
/// - [follow]: ponto que a câmera acompanha (enquanto a pessoa não arrasta o mapa).
/// - [recenterToken]: aumente para voltar a seguir o [follow].
/// - [fit]: pontos que a câmera enquadra (ex.: o passeio escolhido nas Rotas).
/// - [overlays]: chips e cartões desenhados por cima do mapa.
/// - [onTouch]: avisa quando o dedo está no mapa (a tela usa para não rolar
///   a página enquanto a pessoa arrasta o mapa).
class TrackerMap extends StatefulWidget {
  final double height;
  final LatLng initialCenter;
  final double initialZoom;
  final LatLng? follow;
  final int recenterToken;
  final ValueChanged<bool>? onFollowChanged;
  final ValueChanged<bool>? onTouch;
  final List<LatLng>? fit;

  /// Muda quando é para enquadrar de novo (ex.: outro passeio escolhido).
  final Object? fitKey;
  final List<TrackerTrail> trails;

  /// Marcadores (a ordem da lista é a ordem de desenho: o último fica por cima).
  final List<Marker> markers;
  final List<CircleMarker> circles;
  final List<Widget> overlays;

  /// Espaço que os [overlays] ocupam embaixo: o ponto seguido fica centralizado
  /// na parte livre do mapa e o crédito do OpenStreetMap fica acima deles.
  final double bottomInset;

  const TrackerMap({
    super.key,
    required this.height,
    required this.initialCenter,
    this.initialZoom = 17,
    this.follow,
    this.recenterToken = 0,
    this.onFollowChanged,
    this.onTouch,
    this.fit,
    this.fitKey,
    this.trails = const [],
    this.markers = const [],
    this.circles = const [],
    this.overlays = const [],
    this.bottomInset = 0,
  });

  @override
  State<TrackerMap> createState() => _TrackerMapState();
}

class _TrackerMapState extends State<TrackerMap> with SingleTickerProviderStateMixin {
  static const _maxFitZoom = 17.0;

  final _controller = MapController();
  late final AnimationController _glide = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
    ..addListener(_onGlide);
  LatLng? _glideFrom;
  LatLng? _glideTo;
  bool _ready = false;
  bool _following = true;

  /// Desloca o ponto seguido para cima, para ele não ficar atrás dos cartões de baixo.
  Offset get _followOffset => Offset(0, -widget.bottomInset / 2);

  @override
  void didUpdateWidget(TrackerMap old) {
    super.didUpdateWidget(old);
    if (widget.recenterToken != old.recenterToken) {
      _setFollowing(true);
      if (widget.follow != null) _glideTowards(widget.follow!);
    } else if (_following && widget.follow != null && widget.follow != old.follow) {
      _glideTowards(widget.follow!);
    }
    if (widget.fitKey != old.fitKey) _fit();
  }

  @override
  void dispose() {
    _glide.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _setFollowing(bool value) {
    if (_following == value) return;
    _following = value;
    widget.onFollowChanged?.call(value);
  }

  /// Leva a câmera até [target] com um movimento suave (o flutter_map só "pula").
  void _glideTowards(LatLng target) {
    if (!_ready) return;
    final camera = _controller.camera;
    // ponto que hoje aparece onde o pet deve ficar (centro deslocado)
    _glideFrom = camera.screenOffsetToLatLng(camera.size.center(Offset.zero) + _followOffset);
    _glideTo = target;
    _glide.forward(from: 0);
  }

  void _onGlide() {
    final from = _glideFrom, to = _glideTo;
    if (from == null || to == null || !_ready) return;
    final t = Curves.easeInOut.transform(_glide.value);
    final p = LatLng(
      from.latitude + (to.latitude - from.latitude) * t,
      from.longitude + (to.longitude - from.longitude) * t,
    );
    _controller.move(p, _controller.camera.zoom, offset: _followOffset);
  }

  void _fit() {
    final pts = widget.fit;
    if (!_ready || pts == null || pts.isEmpty) return;
    _glide.stop();
    // trajeto curto (passeio que acabou de começar) não vira zoom de quarteirão
    _controller.fitCamera(
      CameraFit.coordinates(coordinates: pts, padding: const EdgeInsets.all(48), maxZoom: _maxFitZoom),
    );
  }

  void _onMapReady() {
    _ready = true;
    final follow = widget.follow;
    if (follow != null) _controller.move(follow, _controller.camera.zoom, offset: _followOffset);
    _fit();
  }

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: SizedBox(
        height: widget.height,
        child: Listener(
          onPointerDown: (_) => widget.onTouch?.call(true),
          onPointerUp: (_) => widget.onTouch?.call(false),
          onPointerCancel: (_) => widget.onTouch?.call(false),
          child: Stack(
            children: [
              Positioned.fill(child: _map(c)),
              Positioned(right: 8, bottom: widget.bottomInset + 6, child: const _Attribution()),
              ...widget.overlays,
            ],
          ),
        ),
      ),
    );
  }

  Widget _map(SmartColors c) {
    return FlutterMap(
      mapController: _controller,
      options: MapOptions(
        crs: const _SingleWorldCrs(),
        initialCenter: widget.follow ?? widget.initialCenter,
        initialZoom: widget.initialZoom,
        minZoom: 3,
        maxZoom: 19,
        backgroundColor: c.soft,
        // girar com dois dedos atrapalha mais do que ajuda aqui
        interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
        onMapReady: _onMapReady,
        // arrastar o mapa com o dedo para de seguir o pet (o botão de alvo volta a seguir)
        onPositionChanged: (camera, hasGesture) {
          if (!hasGesture || !_following) return;
          _glide.stop();
          setState(() => _setFollowing(false));
        },
      ),
      children: [
        if (!_inWidgetTest)
          TileLayer(
            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            // o OpenStreetMap pede que cada app se identifique
            userAgentPackageName: 'com.example.happysnouts',
            maxNativeZoom: 19,
          ),
        CircleLayer(circles: widget.circles),
        PolylineLayer(
          polylines: [
            for (final trail in widget.trails)
              Polyline(
                points: trail.points,
                color: trail.color,
                strokeWidth: trail.width,
                pattern: trail.dashed ? StrokePattern.dashed(segments: const [14, 10]) : const StrokePattern.solid(),
              ),
          ],
        ),
        MarkerLayer(markers: widget.markers),
      ],
    );
  }
}

/// A projeção padrão do mapa (a mesma do OpenStreetMap), mas sem repetir o
/// mundo para os lados. O rastreador só mostra um bairro, e a repetição fazia
/// o círculo da Zona Segura travar o desenho na versão web
/// ("Infinite loop going beyond 30 for world width").
class _SingleWorldCrs extends Epsg3857 {
  const _SingleWorldCrs();

  @override
  bool get replicatesWorldLongitude => false;
}

/// Crédito obrigatório do OpenStreetMap (os dados do mapa são deles).
class _Attribution extends StatelessWidget {
  const _Attribution();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(6)),
        child: const Text(
          '© OpenStreetMap',
          style: TextStyle(fontSize: 10, color: Color(0xFF333333), fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class TrackerPins {
  TrackerPins._();

  /// Pino azul-marinho com patinha laranja e o nome do pet em cima.
  /// A ponta do pino fica exatamente no ponto do GPS.
  static Marker pet(LatLng point, String name) => Marker(
    point: point,
    width: 140,
    height: _PetPin.height,
    alignment: Alignment.topCenter,
    child: IgnorePointer(child: _PetPin(name)),
  );

  static Marker home(LatLng point) => Marker(
    point: point,
    width: 34,
    height: 34,
    child: IgnorePointer(
      child: Container(
        decoration: BoxDecoration(
          color: SmartColors.navy,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2.5),
          boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 1))],
        ),
        child: const Icon(Icons.home_rounded, size: 17, color: Colors.white),
      ),
    ),
  );

  static Marker dot(LatLng point, Color color, {double size = 18}) => Marker(
    point: point,
    width: size,
    height: size,
    child: IgnorePointer(
      child: Container(
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: size > 20 ? 4 : 3),
        ),
      ),
    ),
  );
}

class _PetPin extends StatelessWidget {
  static const _pillH = 22.0, _gap = 4.0, _pinW = 46.0, _pinH = 56.0;
  static const height = _pillH + _gap + _pinH;

  final String name;

  const _PetPin(this.name);

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Container(
          height: _pillH,
          constraints: const BoxConstraints(maxWidth: 136),
          padding: const EdgeInsets.symmetric(horizontal: 8),
          alignment: Alignment.center,
          decoration: BoxDecoration(color: SmartColors.navy, borderRadius: BorderRadius.circular(11)),
          child: Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800),
          ),
        ),
        const SizedBox(height: _gap),
        SizedBox(
          width: _pinW,
          height: _pinH,
          child: CustomPaint(
            painter: const _DropPainter(),
            child: Align(
              alignment: const Alignment(0, -0.18), // centro do círculo laranja
              child: Icon(
                Icons.pets_rounded,
                size: 19,
                color: Colors.white,
                shadows: [Shadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 1)],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _DropPainter extends CustomPainter {
  const _DropPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final r = size.width / 2;
    final h = size.height;
    final drop = Path()
      ..moveTo(cx, h)
      ..cubicTo(cx - r * 0.35, h - 10, cx - r, r + r * 0.75, cx - r, r)
      ..arcToPoint(Offset(cx + r, r), radius: Radius.circular(r))
      ..cubicTo(cx + r, r + r * 0.75, cx + r * 0.35, h - 10, cx, h)
      ..close();
    canvas.drawShadow(drop, Colors.black, 3, false);
    canvas.drawPath(drop, Paint()..color = SmartColors.navy);
    canvas.drawCircle(Offset(cx, r), r * 0.68, Paint()..color = SmartColors.orange);
  }

  @override
  bool shouldRepaint(_DropPainter oldDelegate) => false;
}
