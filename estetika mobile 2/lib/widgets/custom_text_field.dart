import 'package:flutter/material.dart';

class CustomTextField extends StatelessWidget {
  final String label;
  final String hintText;
  final bool obscureText;
  final TextEditingController? controller;
  final FormFieldValidator<String>? validator;
  final Widget? suffixIcon;
  final TextInputType keyboardType;
  final bool autofocus;
  
  const CustomTextField({
    super.key,
    required this.label,
    required this.hintText,
    this.obscureText = false,
    this.controller,
    this.validator,
    this.suffixIcon,
    this.keyboardType = TextInputType.text,
    this.autofocus = false,
  });
  
  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      validator: validator,
      keyboardType: keyboardType,
      autofocus: autofocus,
      decoration: InputDecoration(
        label: Text(
          label,
          style: const TextStyle(
            fontFamily: 'Figtree',
            fontWeight: FontWeight.w500, // Medium
          ),
        ),
        hintText: hintText,
        hintStyle: const TextStyle(
          color: Colors.black26,
          fontFamily: 'Figtree',
          fontWeight: FontWeight.w300, // Light
        ),
        border: OutlineInputBorder(
          borderSide: const BorderSide(
            color: Colors.black12,
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: const BorderSide(
            color: Colors.black12,
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        suffixIcon: suffixIcon,
      ),
    );
  }
}