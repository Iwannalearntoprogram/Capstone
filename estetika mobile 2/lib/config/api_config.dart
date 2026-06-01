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

  /// ICE servers used for WebRTC voice/video calls.
  ///
  /// STUN handles the common case where at least one peer has a routable
  /// address. The TURN entries relay media when both peers are behind
  /// symmetric NAT or strict firewalls (very common on mobile carrier /
  /// CGNAT networks) — without them those calls connect on the signaling
  /// layer but never get audio/video through.
  ///
  /// The TURN credentials below are Metered's public OpenRelay test servers.
  /// They are fine for development and demos, but are rate-limited and not
  /// guaranteed — replace them with your own TURN server credentials for
  /// production reliability.
  static const List<Map<String, dynamic>> iceServers = [
    {
      'urls': [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
      ],
    },
    {
      'urls': 'turn:openrelay.metered.ca:80',
      'username': 'openrelayproject',
      'credential': 'openrelayproject',
    },
    {
      'urls': 'turn:openrelay.metered.ca:443',
      'username': 'openrelayproject',
      'credential': 'openrelayproject',
    },
    {
      'urls': 'turn:openrelay.metered.ca:443?transport=tcp',
      'username': 'openrelayproject',
      'credential': 'openrelayproject',
    },
  ];
}
