import 'package:flutter/material.dart';
import 'text_link.dart';

class AccountSwitchLink extends StatelessWidget {
  final String promptText;
  final String linkText;
  final VoidCallback onTap;
  
  const AccountSwitchLink({
    super.key,
    required this.promptText,
    required this.linkText,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          promptText,
          style: const TextStyle(
            color: Colors.black45,
            fontFamily: 'Figtree',
            fontWeight: FontWeight.w400, // Regular
          ),
        ),
        TextLink(
          text: linkText,
          onTap: onTap,
        ),
      ],
    );
  }
}