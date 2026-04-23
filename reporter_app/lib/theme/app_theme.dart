import 'package:flutter/material.dart';

class AppTheme {
  static final lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: const ColorScheme.light(
      primary: Color(0xFF1F2937),
      secondary: Color(0xFF3B82F6),
      tertiary: Color(0xFFEF4444),
      surface: Color(0xFFFFFFFF),
      error: Color(0xFFEF4444),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF1F2937),
      foregroundColor: Color(0xFFFFFFFF),
      elevation: 1,
      centerTitle: true,
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: Color(0xFF3B82F6),
      foregroundColor: Color(0xFFFFFFFF),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF3B82F6),
        foregroundColor: const Color(0xFFFFFFFF),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFF3F4F6),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    ),
  );

  static final darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFFF3F4F6),
      secondary: Color(0xFF60A5FA),
      tertiary: Color(0xFFF87171),
      surface: Color(0xFF111827),
      error: Color(0xFFF87171),
    ),
  );
}

// Emergency type colors
const Map<String, Color> emergencyTypeColors = {
  'FIRE': Color(0xFFF97316),
  'MEDICAL_EMERGENCY': Color(0xFFEF4444),
  'ACCIDENT': Color(0xFFF59E0B),
  'CRIME-RELATED': Color(0xFF8B5CF6),
  'OTHER': Color(0xFF6B7280),
};
