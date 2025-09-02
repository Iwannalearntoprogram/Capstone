import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';

Future<void> showToast(String message, {bool success = false}) async {
  final bg = success ? const Color(0xFF203B32) : Colors.redAccent;
  await Fluttertoast.showToast(
    msg: message,
    toastLength: Toast.LENGTH_SHORT,
    gravity: ToastGravity.BOTTOM,
    backgroundColor: bg,
    textColor: Colors.white,
    fontSize: 16.0,
  );
}
