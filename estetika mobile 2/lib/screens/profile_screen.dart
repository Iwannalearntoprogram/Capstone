import 'dart:convert';
import 'dart:io';

import 'package:estetika_ui/screens/signin_screen.dart';
import 'package:estetika_ui/widgets/custom_app_bar.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // Form controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _currentPasswordController =
      TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _isEditing = false;
  bool _isChangingPassword = false;
  String? _errorMessage;
  String? _profileImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    if (userString != null) {
      final user = jsonDecode(userString);
      setState(() {
        _nameController.text = user['fullName'] ?? user['username'];
        _emailController.text = user['email'] ?? '';
        _phoneController.text = user['phoneNumber'] ?? '';
        _profileImage = user['profileImage'];
      });
    }
  }

  Future<void> _pickAndUploadImage() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;

    print('Picked image path: ${picked.path}'); // Log the picked image

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) return;

    final imageLink = await _uploadProfileImage(File(picked.path), token);
    if (imageLink != null) {
      setState(() {
        _profileImage = imageLink;
      });
      await _updateProfileImage(imageLink);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to upload image')),
      );
    }
  }

  Future<void> _updateProfileImage(String imageLink) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userString = prefs.getString('user');
    if (token == null || userString == null) return;
    final user = jsonDecode(userString);

    final body = jsonEncode({
      '_id': user['_id'],
      'profileImage': imageLink,
    });

    final response = await http.put(
      Uri.parse('https://capstone-thl5.onrender.com/api/user'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: body,
    );
    if (response.statusCode == 200) {
      user['profileImage'] = imageLink;
      await prefs.setString('user', jsonEncode(user));
      setState(() {
        _profileImage = imageLink;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile picture updated!')),
      );
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _toggleEdit() {
    setState(() {
      _isEditing = !_isEditing;
      _errorMessage = null;
    });
  }

  void _toggleChangePassword() {
    setState(() {
      _isChangingPassword = !_isChangingPassword;
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
      _errorMessage = null;
    });
  }

  void _saveChanges() async {
    if (_nameController.text.isEmpty || _emailController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Name and email cannot be empty';
      });
      return;
    }

    if (!_emailController.text.contains('@')) {
      setState(() {
        _errorMessage = 'Please enter a valid email address';
      });
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userString = prefs.getString('user');
    if (token == null || userString == null) {
      setState(() {
        _errorMessage = 'User not logged in';
      });
      return;
    }
    final user = jsonDecode(userString);

    final body = jsonEncode({
      '_id': user['_id'],
      'fullName': _nameController.text.trim(),
      'email': _emailController.text.trim(),
      'phoneNumber': _phoneController.text.trim(),
    });

    try {
      final response = await http.put(
        Uri.parse('https://capstone-thl5.onrender.com/api/user'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: body,
      );
      if (response.statusCode == 200) {
        // Update local user object
        user['fullName'] = _nameController.text.trim();
        user['email'] = _emailController.text.trim();
        user['phoneNumber'] = _phoneController.text.trim();
        await prefs.setString('user', jsonEncode(user));
        setState(() {
          _isEditing = false;
          _errorMessage = null;
        });
        await _loadUserInfo();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully')),
        );
      } else {
        setState(() {
          _errorMessage = 'Failed to update profile: ${response.body}';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
      });
    }
  }

  void _savePassword() {
    if (_currentPasswordController.text.isEmpty ||
        _newPasswordController.text.isEmpty ||
        _confirmPasswordController.text.isEmpty) {
      setState(() {
        _errorMessage = 'All password fields are required';
      });
      return;
    }

    if (_newPasswordController.text != _confirmPasswordController.text) {
      setState(() {
        _errorMessage = 'New passwords do not match';
      });
      return;
    }

    setState(() {
      _isChangingPassword = false;
      _errorMessage = null;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password updated successfully')),
      );
    });
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();

    // Clear all authentication and user data
    await prefs.remove('token');
    await prefs.remove('user');

    // Clear remember me preferences
    await prefs.remove('rememberMe');
    await prefs.remove('rememberedEmail');
    await prefs.remove('lastLoginTime');

    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const SigninScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        isProfileScreen: true,
        showBackButton: true,
        actions: [],
        title: '',
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),
              // Profile Picture with shadow
              Stack(
                alignment: Alignment.bottomRight,
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.withOpacity(0.2),
                          blurRadius: 6,
                          offset: const Offset(0, 3),
                        ),
                      ],
                      image: _profileImage != null
                          ? DecorationImage(
                              image: NetworkImage(_profileImage!),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: _profileImage == null
                        ? const Icon(
                            Icons.person,
                            size: 80,
                            color: Colors.grey,
                          )
                        : null,
                  ),
                  if (_isEditing)
                    GestureDetector(
                      onTap: _pickAndUploadImage,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: Color(0xFF203B32),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.camera_alt,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 24),

              // Error message
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(
                      color: Colors.red,
                      fontSize: 14,
                    ),
                  ),
                ),

              // Edit button
              if (!_isEditing && !_isChangingPassword)
                ElevatedButton(
                  onPressed: _toggleEdit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF203B32),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 32, vertical: 12),
                    elevation: 2,
                  ),
                  child: const Text('Edit Profile'),
                ),

              const SizedBox(height: 24),

              // Form fields
              if (_isEditing)
                Column(
                  children: [
                    _buildTextField('Name', _nameController),
                    const SizedBox(height: 16),
                    _buildTextField('Email', _emailController),
                    const SizedBox(height: 16),
                    _buildTextField('Phone', _phoneController),
                    const SizedBox(height: 24),

                    // Save and Cancel buttons
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildActionButton(
                          text: 'Save',
                          isPrimary: true,
                          onPressed: _saveChanges,
                        ),
                        const SizedBox(width: 16),
                        _buildActionButton(
                          text: 'Cancel',
                          isPrimary: false,
                          onPressed: _toggleEdit,
                        ),
                      ],
                    ),
                  ],
                )
              else if (!_isChangingPassword)
                Column(
                  children: [
                    _buildInfoItem('Name', _nameController.text),
                    const SizedBox(height: 16),
                    _buildInfoItem('Email', _emailController.text),
                    const SizedBox(height: 16),
                    _buildInfoItem('Phone', _phoneController.text),
                  ],
                ),

              const SizedBox(height: 24),

              // Change Password Section
              if (!_isEditing && !_isChangingPassword)
                TextButton(
                  onPressed: _toggleChangePassword,
                  child: const Text(
                    'Change Password',
                    style: TextStyle(
                      color: Color(0xFF203B32),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),

              if (_isChangingPassword)
                Column(
                  children: [
                    _buildTextField(
                        'Current Password', _currentPasswordController,
                        isPassword: true),
                    const SizedBox(height: 16),
                    _buildTextField('New Password', _newPasswordController,
                        isPassword: true),
                    const SizedBox(height: 16),
                    _buildTextField(
                        'Confirm New Password', _confirmPasswordController,
                        isPassword: true),
                    const SizedBox(height: 24),

                    // Save and Cancel buttons for password change
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildActionButton(
                          text: 'Update Password',
                          isPrimary: true,
                          onPressed: _savePassword,
                        ),
                        const SizedBox(width: 16),
                        _buildActionButton(
                          text: 'Cancel',
                          isPrimary: false,
                          onPressed: _toggleChangePassword,
                        ),
                      ],
                    ),
                  ],
                ),

              const SizedBox(height: 40),

              // Logout button with shadow
              if (!_isEditing && !_isChangingPassword)
                ElevatedButton.icon(
                  onPressed: () {
                    _logout();
                  },
                  icon: const Icon(Icons.logout, size: 20),
                  label: const Text('Logout'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red[400],
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 32, vertical: 12),
                    elevation: 2,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller,
      {bool isPassword = false}) {
    return TextField(
      controller: controller,
      obscureText: isPassword,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF203B32)),
        ),
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required String text,
    required bool isPrimary,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      width: 160,
      child: isPrimary
          ? ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF203B32),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text(text),
            )
          : OutlinedButton(
              onPressed: onPressed,
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF203B32),
                side: const BorderSide(color: Color(0xFF203B32)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text(text),
            ),
    );
  }

  Future<String?> _uploadProfileImage(File imageFile, String token) async {
    try {
      print('Uploading file: ${imageFile.path}');
      print('File exists: ${imageFile.existsSync()}');
      var uri =
          Uri.parse('https://capstone-thl5.onrender.com/api/upload/image');
      var request = http.MultipartRequest('POST', uri)
        ..headers['Authorization'] = 'Bearer $token'
        ..files.add(await http.MultipartFile.fromPath('image', imageFile.path));

      var response = await request.send();

      final responseBody = await response.stream.bytesToString();
      print('Upload response: $responseBody');

      if (response.statusCode == 200) {
        final responseData = json.decode(responseBody);
        return responseData['imageLink'];
      } else {
        print('Failed to upload image with status: ${response.statusCode}');
        print('Error body: $responseBody');
        return null;
      }
    } catch (e) {
      print('Error uploading image: $e');
      return null;
    }
  }
}
