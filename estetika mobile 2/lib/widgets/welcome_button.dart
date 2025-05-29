// filepath: /Users/kert/estetika mobile/estetika_mobile/lib/widgets/welcome_button.dart
import 'package:flutter/material.dart';

class WelcomeButton extends StatelessWidget {
  const WelcomeButton({
    super.key,
    required this.buttonText,
    required this.onTap,
    required this.color,
    required this.textColor,
    this.textStyle,
    this.borderColor,
    this.borderWidth = 1.0, // Default border width
  });

  final String buttonText;
  final VoidCallback onTap; // Changed from Widget to VoidCallback (function)
  final Color color;
  final Color textColor;
  final TextStyle? textStyle;
  final Color? borderColor;
  final double borderWidth;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap, // Now directly using the callback function
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 15),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(20.0), // Rounded corners
          border: Border.all(
            color: borderColor ?? Colors.transparent,
            width: borderWidth, // Use the borderWidth property
          ),
        ),
        child: Text(
          buttonText,
          textAlign: TextAlign.center,
          style: (textStyle ?? const TextStyle()).copyWith(
            color: textColor,
          ),
        ),
      ),
    );
  }
}
