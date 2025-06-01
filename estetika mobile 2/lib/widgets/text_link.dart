import 'package:flutter/material.dart';

class TextLink extends StatelessWidget {
  final String text;
  final VoidCallback onTap;
  final double fontSize;
  final FontWeight fontWeight;
  final Color color;
  
  const TextLink({
    super.key,
    required this.text,
    required this.onTap,
    this.fontSize = 14.0,
    this.fontWeight = FontWeight.w600,
    this.color = const Color(0xFF203B32),
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Text(
        text,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: fontWeight,
          fontFamily: 'Figtree',
          color: color,
        ),
      ),
    );
  }
}