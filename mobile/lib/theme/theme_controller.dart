import 'package:flutter/material.dart';
import 'package:happysnouts/services/preferences_service.dart';

class ThemeController {
  ThemeController._();

  static final ValueNotifier<ThemeMode> themeMode = ValueNotifier(ThemeMode.light);

  static void load() {
    themeMode.value = PreferencesService.instance.themeMode;
  }

  static void toggle() {
    themeMode.value = themeMode.value == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    PreferencesService.instance.setThemeMode(themeMode.value);
  }
}
