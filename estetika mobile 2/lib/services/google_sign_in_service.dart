import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class GoogleSignInService {
  static const String _baseUrl =
      'http://10.0.2.2:3000/api/auth'; // Android emulator localhost

  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
    ],
  );

  static Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      print('🚀 Starting Google Sign In process...');

      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        print('❌ User cancelled Google Sign In');
        return {'success': false, 'message': 'Sign in cancelled by user'};
      }

      print('✅ Google user obtained: ${googleUser.email}');

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      if (googleAuth.accessToken == null) {
        print('❌ Failed to get access token');
        throw Exception('Failed to get access token');
      }

      print('✅ Got access token, sending to backend...');

      final response = await http.post(
        Uri.parse('$_baseUrl/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'access_token': googleAuth.accessToken,
        }),
      );

      print('📡 Backend response status: ${response.statusCode}');
      print('📡 Backend response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token'] ?? '');
        await prefs.setString('user', jsonEncode(data['user'] ?? {}));

        print('✅ Successfully authenticated with backend');

        return {
          'success': true,
          'user': data['user'],
          'token': data['token'],
          'message': data['message'] ?? 'Successfully signed in with Google'
        };
      } else {
        final errorData = jsonDecode(response.body);
        print('❌ Backend authentication failed: ${errorData['message']}');
        return {
          'success': false,
          'message': errorData['message'] ?? 'Google sign in failed'
        };
      }
    } catch (e) {
      print('💥 Google Sign In error: $e');
      return {
        'success': false,
        'message': 'Google sign in error: ${e.toString()}'
      };
    }
  }

  static Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      await prefs.remove('user');
    } catch (e) {
      print('Error signing out: $e');
    }
  }

  static Future<bool> isSignedIn() async {
    return await _googleSignIn.isSignedIn();
  }

  static Future<GoogleSignInAccount?> getCurrentUser() async {
    return _googleSignIn.currentUser;
  }
}
