import 'package:flutter/material.dart';

class PasswordField extends StatefulWidget {
  final String label;
  final String hintText;
  final TextEditingController? controller;
  final FormFieldValidator<String>? validator;
  final bool isConfirmField;
  
  const PasswordField({
    super.key,
    required this.label,
    required this.hintText,
    this.controller,
    this.validator,
    this.isConfirmField = false,
  });
  
  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _obscurePassword = true;
  
  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: _obscurePassword,
      validator: widget.validator,
      decoration: InputDecoration(
        label: Text(
          widget.label,
          style: const TextStyle(
            fontFamily: 'Figtree',
            fontWeight: FontWeight.w500, // Medium
          ),
        ),
        hintText: widget.hintText,
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
        suffixIcon: IconButton(
          icon: Icon(
            _obscurePassword
                ? Icons.visibility_off
                : Icons.visibility,
            color: Colors.grey,
          ),
          onPressed: () {
            setState(() {
              _obscurePassword = !_obscurePassword;
            });
          },
        ),
      ),
    );
  }
}