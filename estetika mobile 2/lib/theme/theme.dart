import 'package:flutter/material.dart';

final ThemeData lightTheme = ThemeData(
  fontFamily: 'Figtree', // Set Figtree as the default font
);

const lightColorScheme = ColorScheme(
  brightness: Brightness.light,
  primary: Color(0xff0a4b39),
  onPrimary: Color(0xFFFFFFFF),
  secondary: Color(0xFF6EAEF7),
  onSecondary: Color(0xFFFFFFFF),
  error: Color(0xFFBA1A1A),
  onError: Color(0xFFFFFFFF),
  shadow: Color(0xFF000000),
  outlineVariant: Color(0xFFC2C8BC),
  surface: Color(0xFFF9FAF3),
  onSurface: Color(0xFF1A1C18),
);

const darkColorScheme = ColorScheme(
  brightness: Brightness.dark,
  primary: Color(0xFF416FDF),
  onPrimary: Color(0xFFFFFFFF),
  secondary: Color(0xFF6EAEF7),
  onSecondary: Color(0xFFFFFFFF),
  error: Color(0xFFBA1A1A),
  onError: Color(0xFFFFFFFF),
  shadow: Color(0xFF000000),
  outlineVariant: Color(0xFF424940),
  surface: Color(0xFF1A1C18),
  onSurface: Color(0xFFE1E3DE),
);

ThemeData lightMode = ThemeData(
  useMaterial3: true,
  fontFamily: 'Figtree', // Set Figtree as the default font
  brightness: Brightness.light,
  colorScheme: lightColorScheme,
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ButtonStyle(
      backgroundColor: WidgetStateProperty.all<Color>(Colors.white),
      foregroundColor: WidgetStateProperty.all<Color>(Colors.black),
      elevation: WidgetStateProperty.all<double>(5.0),
      padding: WidgetStateProperty.all<EdgeInsets>(
        const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      ),
      shape: WidgetStateProperty.all<RoundedRectangleBorder>(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    ),
  ),
);

ThemeData darkMode = ThemeData(
  useMaterial3: true,
  fontFamily: 'Figtree', // Set Figtree as the default font
  brightness: Brightness.dark,
  colorScheme: darkColorScheme,
);
