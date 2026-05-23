import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

class ApiConfig {
  static const String _productionOrigin = 'https://moss-manila.onrender.com';
  static const String _localOrigin = 'http://localhost:3000';
  static const String _androidEmulatorOrigin = 'http://10.0.2.2:3000';

  static String get origin {
    if (!kDebugMode) {
      return _productionOrigin;
    }

    if (kIsWeb) {
      return _localOrigin;
    }

    if (Platform.isAndroid) {
      return _androidEmulatorOrigin;
    }

    return _localOrigin;
  }

  static String get apiBaseUrl => '$origin/api';

  static String get authBaseUrl => '$origin/api/auth';
}
