import 'package:estetika_ui/screens/signup_screen.dart';
import 'package:estetika_ui/screens/welcome_screen.dart';
import 'package:estetika_ui/screens/home_screen.dart';
import 'package:estetika_ui/widgets/custom_scaffold.dart';
import 'package:estetika_ui/widgets/google_sign_in_button.dart';
import 'package:flutter/material.dart';
// import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:estetika_ui/utils/toast.dart';
import 'package:estetika_ui/utils/logger.dart';

class SigninScreen extends StatefulWidget {
  const SigninScreen({super.key});

  @override
  State<SigninScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SigninScreen> {
  final _formSignInKey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  bool _rememberMe = false;
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your password';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!RegExp(r'[a-z]').hasMatch(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(value)) {
      return 'Password must contain at least one special character';
    }
    return null;
  }

  String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your email';
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  Future<void> _handleSignIn() async {
    AppLogger.info('SignIn attempt for: ' + _emailController.text);

    try {
      final body = {
        'email': _emailController.text,
        'password': _passwordController.text,
      };
      AppLogger.info('SignIn request body prepared');

      final response = await http.post(
        Uri.parse('https://capstone-moss.onrender.com/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      AppLogger.info('SignIn response status: ${response.statusCode}');
      if (response.statusCode != 200) {
        AppLogger.error('SignIn failed', error: response.statusCode);
        AppLogger.error('SignIn response body: ${response.body}');
      } else {
        AppLogger.info('SignIn successful');
      }

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final email = _emailController.text.trim();

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token'] ?? '');
        await prefs.setString('user', jsonEncode(data['user'] ?? {}));

        // Store remember me preferences (global for UI prefill)
        await prefs.setBool('rememberMe', _rememberMe);
        if (_rememberMe) {
          await prefs.setString('rememberedEmail', email);
        }

        if (mounted) {
          // Check if we should skip OTP for this account based on per-account 24h validity
          if (await _shouldSkipOtp(email)) {
            // Skip OTP and go directly to home
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const HomeScreen()),
            );
          } else {
            // Proceed with OTP verification
            await _sendOtp(email);
            final verified = await _showOtpDialog(email);
            if (verified == true) {
              // Mark OTP verified time for this account if remember me was chosen
              await _markOtpVerified(email);
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const HomeScreen()),
              );
            } else {
              AppLogger.warn(
                  'OTP verification cancelled or failed for ' + email);
              await showToast('OTP verification cancelled or failed');
            }
          }
        }
      } else {
        throw Exception('Failed to sign in: ${response.body}');
      }
    } catch (e, st) {
      AppLogger.error('SignIn exception', error: e, stackTrace: st);
      await showToast('Sign In Failed: $e');
    }
  }

  Future<void> _sendOtp(String email) async {
    final response = await http.post(
      Uri.parse('https://capstone-moss.onrender.com/api/auth/send-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );
    AppLogger.info('Send OTP status: ${response.statusCode}');
    if (response.statusCode != 200) {
      AppLogger.error('Send OTP failed', error: response.statusCode);
      AppLogger.error('Send OTP body: ${response.body}');
    }
    if (response.statusCode != 200) {
      throw Exception('Failed to send OTP');
    }
  }

  Future<bool?> _showOtpDialog(String email) async {
    final TextEditingController _otpController = TextEditingController();
    bool isVerifying = false;
    String? errorText;

    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) => AlertDialog(
            title: const Text('Enter OTP'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'OTP Code',
                    errorText: errorText,
                  ),
                ),
                if (isVerifying)
                  const Padding(
                    padding: EdgeInsets.only(top: 8.0),
                    child: CircularProgressIndicator(),
                  ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: isVerifying
                    ? null
                    : () async {
                        setState(() => isVerifying = true);
                        final verified =
                            await _verifyOtp(email, _otpController.text.trim());
                        setState(() => isVerifying = false);
                        if (verified) {
                          Navigator.of(context).pop(true);
                        } else {
                          setState(() => errorText = 'Invalid OTP');
                        }
                      },
                child: const Text('Verify'),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<bool> _verifyOtp(String email, String otp) async {
    try {
      final response = await http.post(
        Uri.parse('https://capstone-moss.onrender.com/api/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'otp': otp}),
      );
      AppLogger.info('Verify OTP status: ${response.statusCode}');
      if (response.statusCode != 200) {
        AppLogger.error('Verify OTP failed', error: response.statusCode);
        AppLogger.error('Verify OTP body: ${response.body}');
      }
      if (response.statusCode == 200) {
        return true;
      } else {
        return false;
      }
    } catch (e, st) {
      AppLogger.error('Verify OTP exception', error: e, stackTrace: st);
      return false;
    }
  }

  Future<bool> _shouldSkipOtp(String email) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // Per-account remember flag set when OTP was verified with remember me
      final accountRemember =
          prefs.getBool('rememberMe_' + email.toLowerCase()) ?? false;
      final otpVerifiedAt =
          prefs.getInt('otpVerifiedAt_' + email.toLowerCase()) ?? 0;

      if (!accountRemember || otpVerifiedAt == 0) return false;

      final now = DateTime.now().millisecondsSinceEpoch;
      final elapsedMs = now - otpVerifiedAt;
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      return elapsedMs < twentyFourHoursMs;
    } catch (e) {
      AppLogger.error('Error checking remember me status', error: e);
      return false;
    }
  }

  Future<void> _markOtpVerified(String email) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // Mark per-account OTP verification time
      await prefs.setInt('otpVerifiedAt_' + email.toLowerCase(),
          DateTime.now().millisecondsSinceEpoch);
      // If user opted for remember me, persist per-account remember flag
      if (_rememberMe) {
        await prefs.setBool('rememberMe_' + email.toLowerCase(), true);
        // Also store for UI prefill convenience
        await prefs.setString('rememberedEmail', email);
        await prefs.setBool('rememberMe', true);
      }
    } catch (e) {
      print('Error marking OTP verified: $e');
    }
  }

  @override
  void initState() {
    super.initState();
    _loadRememberMePreference();
  }

  Future<void> _loadRememberMePreference() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rememberMe = prefs.getBool('rememberMe') ?? false;
      final rememberedEmail = prefs.getString('rememberedEmail') ?? '';

      setState(() {
        _rememberMe = rememberMe;
        if (rememberMe && rememberedEmail.isNotEmpty) {
          _emailController.text = rememberedEmail;
        }
      });
    } catch (e) {
      print('Error loading remember me preference: $e');
    }
  }

  // Future<void> _clearRememberMe() async {
  //   final prefs = await SharedPreferences.getInstance();
  //   await prefs.remove('rememberMe');
  //   await prefs.remove('rememberedEmail');
  //   await prefs.remove('lastLoginTime');
  // }

  Future<bool> checkAutoLogin() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) {
        return false;
      }

      // Determine current user's email from stored profile if possible
      String? email;
      try {
        final userJson = prefs.getString('user');
        if (userJson != null && userJson.isNotEmpty) {
          final user = jsonDecode(userJson);
          email = (user['email'] ?? '').toString();
        }
      } catch (_) {}

      if (email == null || email.isEmpty) return false;

      // Auto-login only if per-account OTP is still valid within 24 hours
      final accountRemember =
          prefs.getBool('rememberMe_' + email.toLowerCase()) ?? false;
      final otpVerifiedAt =
          prefs.getInt('otpVerifiedAt_' + email.toLowerCase()) ?? 0;
      if (!accountRemember || otpVerifiedAt == 0) return false;

      final now = DateTime.now().millisecondsSinceEpoch;
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      return (now - otpVerifiedAt) < twentyFourHoursMs;
    } catch (e) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      showBackIcon: true, // <-- Ensure this is true for Sign In
      child: WillPopScope(
        onWillPop: () async {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const WelcomeScreen()),
          );
          return false;
        },
        child: Column(
          children: [
            const Expanded(flex: 1, child: SizedBox(height: 10)),
            Expanded(
              flex: 20,
              child: Container(
                padding: const EdgeInsets.fromLTRB(25, 40, 25, 20),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(40.0),
                    topRight: Radius.circular(40.0),
                  ),
                ),
                child: SingleChildScrollView(
                  child: Form(
                    key: _formSignInKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          'Welcome Back',
                          style: TextStyle(
                            fontSize: 30.0,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'Figtree',
                            color: const Color(0xFF203B32),
                          ),
                        ),
                        const SizedBox(height: 40.0),
                        TextFormField(
                          controller: _emailController,
                          validator: validateEmail,
                          decoration: InputDecoration(
                            label: const Text(
                              'Email',
                              style: TextStyle(
                                fontFamily: 'Figtree',
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            hintText: 'Enter Email',
                            hintStyle: const TextStyle(
                              color: Colors.black26,
                              fontFamily: 'Figtree',
                              fontWeight: FontWeight.w300,
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
                          ),
                        ),
                        const SizedBox(height: 25.0),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          validator: validatePassword,
                          decoration: InputDecoration(
                            label: const Text(
                              'Password',
                              style: TextStyle(
                                fontFamily: 'Figtree',
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            hintText: 'Enter Password',
                            hintStyle: const TextStyle(
                              color: Colors.black26,
                              fontFamily: 'Figtree',
                              fontWeight: FontWeight.w300,
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
                        ),
                        const SizedBox(height: 16.0),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Checkbox(
                                  value: _rememberMe,
                                  activeColor: const Color(0xFF203B32),
                                  onChanged: (value) {
                                    setState(() {
                                      _rememberMe = value ?? false;
                                    });
                                  },
                                ),
                                const Text(
                                  'Remember me',
                                  style: TextStyle(
                                    fontFamily: 'Figtree',
                                    fontWeight: FontWeight.w400,
                                    color: Colors.black54,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 32),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              if (_formSignInKey.currentState!.validate()) {
                                _handleSignIn();
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF203B32),
                              foregroundColor: Colors.white,
                            ),
                            child: const Text(
                              'Sign In',
                              style: TextStyle(
                                fontFamily: 'Figtree',
                                fontWeight: FontWeight.w500,
                                fontSize: 18, // Medium
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 25.0),
                        const Row(
                          children: [
                            Expanded(child: Divider()),
                            Padding(
                              padding: EdgeInsets.symmetric(horizontal: 16),
                              child: Text(
                                'OR',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontFamily: 'Figtree',
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ),
                            Expanded(child: Divider()),
                          ],
                        ),
                        const SizedBox(height: 25.0),
                        const GoogleSignInButton(
                          buttonText: 'Sign in with Google',
                          isSignUp: false,
                        ),
                        const SizedBox(height: 25.0),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              "Don't have an account? ",
                              style: TextStyle(
                                color: Colors.black45,
                                fontFamily: 'Figtree',
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                Navigator.pushReplacement(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const SignUpScreen(),
                                  ),
                                );
                              },
                              child: Text(
                                'Sign up',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'Figtree',
                                  color: const Color(0xFF203B32),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
