import 'package:estetika_ui/screens/signup_screen.dart';
import 'package:estetika_ui/screens/welcome_screen.dart';
import 'package:estetika_ui/screens/home_screen.dart';
import 'package:estetika_ui/widgets/custom_scaffold.dart';
import 'package:estetika_ui/widgets/google_sign_in_button.dart';
import 'package:flutter/material.dart';
import 'package:estetika_ui/screens/forgot_password_screen.dart';
// import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

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
    print('Email: ${_emailController.text}');
    print('Password: ${_passwordController.text}');

    try {
      final body = {
        'email': _emailController.text,
        'password': _passwordController.text,
      };
      print('Request body: $body');

      final response = await http.post(
        Uri.parse('https://capstone-moss.onrender.com/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final email = _emailController.text.trim();

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token'] ?? '');
        await prefs.setString('user', jsonEncode(data['user'] ?? {}));

        // Store remember me preference
        await prefs.setBool('rememberMe', _rememberMe);
        if (_rememberMe) {
          await prefs.setString('rememberedEmail', email);
          await prefs.setInt(
              'lastLoginTime', DateTime.now().millisecondsSinceEpoch);
        }

        if (mounted) {
          // Check if we should skip OTP based on remember me
          if (_rememberMe && await _shouldSkipOtp(email)) {
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
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const HomeScreen()),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('OTP verification cancelled or failed')),
              );
            }
          }
        }
      } else {
        throw Exception('Failed to sign in: ${response.body}');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sign In Failed: $e')),
      );
    }
  }

  Future<void> _sendOtp(String email) async {
    final response = await http.post(
      Uri.parse('https://capstone-moss.onrender.com/api/auth/send-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );
    print('Send OTP response status: ${response.statusCode}');
    print('Send OTP response body: ${response.body}');
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
      print('Verify OTP response status: ${response.statusCode}');
      print('Verify OTP response body: ${response.body}');
      if (response.statusCode == 200) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      print('Verify OTP error: $e');
      return false;
    }
  }

  Future<bool> _shouldSkipOtp(String email) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rememberMe = prefs.getBool('rememberMe') ?? false;
      final rememberedEmail = prefs.getString('rememberedEmail') ?? '';
      final lastLoginTime = prefs.getInt('lastLoginTime') ?? 0;

      if (!rememberMe || rememberedEmail != email) {
        return false;
      }

      // Check if the remember me session is still valid (e.g., within 30 days)
      final now = DateTime.now().millisecondsSinceEpoch;
      final daysSinceLastLogin = (now - lastLoginTime) / (1000 * 60 * 60 * 24);

      return daysSinceLastLogin <= 30; // Remember for 30 days
    } catch (e) {
      print('Error checking remember me status: $e');
      return false;
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
      final rememberMe = prefs.getBool('rememberMe') ?? false;
      final lastLoginTime = prefs.getInt('lastLoginTime') ?? 0;

      if (token == null || !rememberMe) {
        return false;
      }

      // Check if remember me session is still valid
      final now = DateTime.now().millisecondsSinceEpoch;
      final daysSinceLastLogin = (now - lastLoginTime) / (1000 * 60 * 60 * 24);

      return daysSinceLastLogin <= 30;
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
