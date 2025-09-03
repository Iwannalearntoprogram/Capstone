import 'dart:developer' as dev;
import 'package:flutter/foundation.dart' show debugPrint;

class AppLogger {
  static void info(String message, {String name = 'APP'}) {
    // dev.log for IDEs/observatory
    dev.log(message, name: name, level: 800); // INFO
    // Also print to console so it shows in Debug Console/terminal
    debugPrint('[INFO][$name] $message');
  }

  static void warn(String message, {String name = 'APP'}) {
    dev.log(message, name: name, level: 900); // WARNING
    debugPrint('[WARN][$name] $message');
  }

  static void error(String message,
      {Object? error, StackTrace? stackTrace, String name = 'APP'}) {
    dev.log(message,
        name: name,
        level: 1000,
        error: error,
        stackTrace: stackTrace); // SEVERE
    final errStr = error != null ? ' | error: $error' : '';
    final stStr = stackTrace != null ? '\n$stackTrace' : '';
    debugPrint('[ERROR][$name] $message$errStr$stStr');
  }
}
