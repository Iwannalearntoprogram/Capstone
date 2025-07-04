import 'package:flutter/material.dart';
import 'package:estetika_ui/widgets/custom_app_bar.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class SendProjectScreen extends StatefulWidget {
  const SendProjectScreen({super.key});

  @override
  State<SendProjectScreen> createState() => _SendProjectScreenState();
}

class _SendProjectScreenState extends State<SendProjectScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _projectNameController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _budgetController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _clientNameController = TextEditingController();
  final TextEditingController _contactNumberController =
      TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _projectSizeController = TextEditingController();
  final TextEditingController _inspirationLinkController =
      TextEditingController();

  // Track form progress
  double _formProgress = 0.0;
  final int _totalFormFields = 9;

  String? _roomType;
  final List<String> _roomTypes = [
    'Living Room',
    'Bedroom',
    'Kitchen',
    'Bathroom',
    'Home Office',
    'Dining Room',
    'Whole House',
    'Commercial Space',
    'Other'
  ];

  final List<File> _inspirationImages = [];
  final List<String> _inspirationLinks = [];
  final ImagePicker _picker = ImagePicker();

  bool _isSubmitting = false;

  DateTime? _startDate;
  DateTime? _endDate;

  // Add recommendation variables
  Map<String, dynamic>? _recommendation;
  bool _isRecommendationLoading = false;
  bool _hasViewedRecommendation = false;

  @override
  void initState() {
    super.initState();
    _setupTextControllerListeners();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    if (userString != null) {
      final user = jsonDecode(userString);
      setState(() {
        _clientNameController.text = user['fullName'] ?? '';
        _emailController.text = user['email'] ?? '';
        _contactNumberController.text =
            user['phoneNumber']?.replaceFirst('+63', '') ?? '';
      });
      print('Loaded user: $user');
    }
  }

  void _setupTextControllerListeners() {
    void updateProgress() {
      int filledFields = 0;

      if (_clientNameController.text.isNotEmpty) filledFields++;
      if (_emailController.text.isNotEmpty) filledFields++;
      if (_contactNumberController.text.isNotEmpty) filledFields++;
      if (_projectNameController.text.isNotEmpty) filledFields++;
      if (_roomType != null) filledFields++;
      if (_projectSizeController.text.isNotEmpty) filledFields++;
      if (_locationController.text.isNotEmpty) filledFields++;
      if (_budgetController.text.isNotEmpty) filledFields++;
      if (_descriptionController.text.isNotEmpty) filledFields++;

      setState(() {
        _formProgress = filledFields / _totalFormFields;
      });
    }

    _clientNameController.addListener(updateProgress);
    _emailController.addListener(updateProgress);
    _contactNumberController.addListener(updateProgress);
    _projectNameController.addListener(updateProgress);
    _projectSizeController.addListener(updateProgress);
    _locationController.addListener(updateProgress);
    _budgetController.addListener(updateProgress);
    _descriptionController.addListener(updateProgress);
  }

  @override
  void dispose() {
    _projectNameController.dispose();
    _locationController.dispose();
    _budgetController.dispose();
    _descriptionController.dispose();
    _clientNameController.dispose();
    _contactNumberController.dispose();
    _emailController.dispose();
    _projectSizeController.dispose();
    _inspirationLinkController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final List<XFile> images = await _picker.pickMultiImage();
      if (images.isNotEmpty) {
        setState(() {
          for (var image in images) {
            _inspirationImages.add(File(image.path));
          }
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error picking images. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _addInspirationLink() {
    if (_inspirationLinkController.text.isNotEmpty) {
      String link = _inspirationLinkController.text;
      // Add http:// if missing
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://$link';
      }

      setState(() {
        _inspirationLinks.add(link);
        _inspirationLinkController.clear();
      });
    }
  }

  void _removeInspirationImage(int index) {
    setState(() {
      _inspirationImages.removeAt(index);
    });
  }

  void _removeInspirationLink(int index) {
    setState(() {
      _inspirationLinks.removeAt(index);
    });
  }

  Future<void> _fetchRecommendation() async {
    setState(() {
      _isRecommendationLoading = true;
    });
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final requestBody = {
        "roomType": _roomType,
        "designPreferences": _descriptionController.text,
        "budget": double.tryParse(_budgetController.text) ?? 0,
      };
      print("Recommendation request body: $requestBody");
      final uri = Uri.parse(
              'https://capstone-thl5.onrender.com/api/project/recommendation/match')
          .replace(queryParameters: {
        'roomType': _roomType ?? '',
        'designPreferences': _descriptionController.text,
        'budget': _budgetController.text,
      });

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      print("request body: ${jsonEncode(requestBody)}");
      print("Status Code: ${response.statusCode}");
      print("recom:" + response.body);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _recommendation = data['recommendation'];
          _isRecommendationLoading = false;
          _hasViewedRecommendation = true;
        });
      } else {
        setState(() {
          _recommendation = null;
          _isRecommendationLoading = false;
          _hasViewedRecommendation = true;
        });
      }
    } catch (e) {
      setState(() {
        _recommendation = null;
        _isRecommendationLoading = false;
        _hasViewedRecommendation = true;
      });
    }
  }

  Widget _buildRecommendationSection() {
    final bool canViewRecommendation = _areAllRequiredFieldsFilled();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Design Recommendation'),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: _isRecommendationLoading
              ? const Center(
                  child: CircularProgressIndicator(color: Color(0xFF203B32)))
              : _hasViewedRecommendation && _recommendation != null
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_recommendation!['imageLink'] != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              getDirectImageLink(_recommendation!['imageLink']),
                              height: 180,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Icon(Icons.broken_image,
                                      size: 48, color: Colors.grey),
                            ),
                          ),
                        const SizedBox(height: 12),
                        Text(
                          _recommendation!['title'] ?? 'No Title',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF203B32),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _recommendation!['specification'] ?? '',
                          style: const TextStyle(fontSize: 15),
                        ),
                        const SizedBox(height: 8),
                        if (_recommendation!['budgetRange'] != null)
                          Text(
                            'Budget Range: ₱${_recommendation!['budgetRange']['min']} - ₱${_recommendation!['budgetRange']['max']}',
                            style: const TextStyle(
                                fontSize: 14, color: Colors.grey),
                          ),
                        if (_recommendation!['type'] != null)
                          Text(
                            'Type: ${_recommendation!['type']}',
                            style: const TextStyle(
                                fontSize: 14, color: Colors.grey),
                          ),
                        if (_recommendation!['tags'] != null)
                          Wrap(
                            spacing: 6,
                            children: (_recommendation!['tags'] as List)
                                .map((tag) => Chip(
                                      label: Text(tag),
                                      backgroundColor: const Color(0xFFE8F5E9),
                                      labelStyle: const TextStyle(
                                          color: Color(0xFF203B32),
                                          fontSize: 12),
                                    ))
                                .toList(),
                          ),
                      ],
                    )
                  : _hasViewedRecommendation && _recommendation == null
                      ? const Text('No design recommendation available.',
                          style: TextStyle(color: Colors.grey))
                      : Column(
                          children: [
                            ElevatedButton.icon(
                              onPressed: canViewRecommendation
                                  ? _fetchRecommendation
                                  : null,
                              icon: const Icon(Icons.lightbulb_outline),
                              label: const Text('View Recommendation'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: canViewRecommendation
                                    ? const Color(0xFF203B32)
                                    : Colors.grey[400],
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                            if (!canViewRecommendation) ...[
                              const SizedBox(height: 8),
                              Text(
                                'Please fill all required fields to view recommendation',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                  fontStyle: FontStyle.italic,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ],
                        ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        showBackButton: true,
        actions: [],
        title: '',
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding:
                const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Progress indicator
                  LinearProgressIndicator(
                    value: _formProgress,
                    backgroundColor: Colors.grey[200],
                    color: const Color(0xFF203B32),
                    minHeight: 6,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  const SizedBox(height: 16),

                  // Header section
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'Moss Design House Project Proposal',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF203B32),
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Cubao, Quezon City, Philippines',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Client Information Section
                  _buildSectionHeader('Client Information'),
                  const SizedBox(height: 16),

                  // Client Name
                  TextFormField(
                    controller: _clientNameController,
                    decoration: InputDecoration(
                      labelText: 'Full Name',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter client name';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Email Address
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: 'Email Address',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter email address';
                      }
                      final bool emailValid = RegExp(
                        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
                      ).hasMatch(value);
                      if (!emailValid) {
                        return 'Please enter a valid email address';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Contact Number
                  TextFormField(
                    controller: _contactNumberController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: 'Contact Number',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      prefixText: '+63 ',
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter contact number';
                      }
                      if (value.length < 10) {
                        return 'Please enter valid number';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),

                  // Project Information Section
                  _buildSectionHeader('Project Details'),
                  const SizedBox(height: 16),

                  // Project Name
                  TextFormField(
                    controller: _projectNameController,
                    decoration: InputDecoration(
                      labelText: 'Project Name',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter project name';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Room Type Dropdown
                  DropdownButtonFormField<String>(
                    value: _roomType,
                    decoration: InputDecoration(
                      labelText: 'Room/Area Type',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    items: _roomTypes.map((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(value),
                      );
                    }).toList(),
                    onChanged: (newValue) {
                      setState(() {
                        _roomType = newValue;
                      });
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please select room type';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Project Size
                  TextFormField(
                    controller: _projectSizeController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Project Size (sqm)',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      suffixText: 'sqm',
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter project size';
                      }
                      if (double.tryParse(value) == null) {
                        return 'Please enter valid size';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Location
                  TextFormField(
                    controller: _locationController,
                    decoration: InputDecoration(
                      labelText: 'Project Location',
                      hintText: 'E.g. Cubao, Quezon City',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter location';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Budget
                  TextFormField(
                    controller: _budgetController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Estimated Budget',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      prefixText: '₱ ',
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter budget';
                      }
                      if (double.tryParse(value) == null) {
                        return 'Please enter valid amount';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 8),

                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _startDate ?? DateTime.now(),
                        firstDate: DateTime.now(),
                        lastDate: DateTime(2100),
                      );
                      if (picked != null) {
                        setState(() {
                          _startDate = picked;
                        });
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 16, horizontal: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _startDate != null
                                ? "${_startDate!.year}-${_startDate!.month.toString().padLeft(2, '0')}-${_startDate!.day.toString().padLeft(2, '0')}"
                                : 'Select start date',
                            style:
                                TextStyle(fontSize: 16, color: Colors.black87),
                          ),
                          const Icon(Icons.calendar_today,
                              size: 20, color: Color(0xFF203B32)),
                        ],
                      ),
                    ),
                  ),

                  // End Date Picker
                  const SizedBox(height: 8),

                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _endDate ?? (_startDate ?? DateTime.now()),
                        firstDate: _startDate ?? DateTime.now(),
                        lastDate: DateTime(2100),
                      );
                      if (picked != null) {
                        setState(() {
                          _endDate = picked;
                        });
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 16, horizontal: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _endDate != null
                                ? "${_endDate!.year}-${_endDate!.month.toString().padLeft(2, '0')}-${_endDate!.day.toString().padLeft(2, '0')}"
                                : 'Select end date',
                            style:
                                TextStyle(fontSize: 16, color: Colors.black87),
                          ),
                          const Icon(Icons.calendar_today,
                              size: 20, color: Color(0xFF203B32)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Description
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 5,
                    decoration: InputDecoration(
                      labelText: 'Design Preferences & Requirements',
                      alignLabelWithHint: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      hintText:
                          'Describe your preferred style, colors, must-have elements, etc.',
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Design Inspiration Section
                  _buildSectionHeader('Design Inspiration'),
                  const SizedBox(height: 16),

                  // Upload Images
                  SizedBox(
                    height: 56,
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _pickImage,
                      icon: const Icon(Icons.add_photo_alternate,
                          color: Color(0xFF203B32)),
                      label: const Text(
                        'Select Images',
                        style: TextStyle(
                          color: Color(0xFF203B32),
                          fontSize: 16.0,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        side: const BorderSide(color: Color(0xFF203B32)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Display uploaded images
                  if (_inspirationImages.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Uploaded Images:',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          '${_inspirationImages.length} images',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 120,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _inspirationImages.length,
                        itemBuilder: (context, index) {
                          return Stack(
                            children: [
                              Container(
                                margin: const EdgeInsets.only(right: 8),
                                width: 120,
                                height: 120,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  image: DecorationImage(
                                    image: FileImage(_inspirationImages[index]),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 5,
                                right: 13,
                                child: GestureDetector(
                                  onTap: () => _removeInspirationImage(index),
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.close,
                                      size: 16,
                                      color: Colors.red,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Add Inspiration Links
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _inspirationLinkController,
                          decoration: InputDecoration(
                            labelText: 'Inspiration Link',
                            hintText: 'Enter URL of inspiration design',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _addInspirationLink,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF203B32),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text('+'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Display inspiration links
                  if (_inspirationLinks.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Added Links:',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          '${_inspirationLinks.length} links',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _inspirationLinks.length,
                      itemBuilder: (context, index) {
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: ListTile(
                            leading: const Icon(Icons.link,
                                color: Color(0xFF203B32)),
                            title: Text(
                              _inspirationLinks[index],
                              style: const TextStyle(fontSize: 14),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.close, color: Colors.red),
                              onPressed: () => _removeInspirationLink(index),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                  ],

                  const SizedBox(height: 32),

                  // Add recommendation section here, BEFORE the submit button
                  _buildRecommendationSection(),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 60.0,
                    child: ElevatedButton(
                      onPressed: _isSubmitting
                          ? null
                          : () {
                              if (_formKey.currentState!.validate()) {
                                _submitProjectProposal();
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF203B32),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        elevation: 3,
                        disabledBackgroundColor: Colors.grey[400],
                      ),
                      child: _isSubmitting
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                              'Submit to Moss Design House',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),

          // Overlay loader (only shown during form submission)
          if (_isSubmitting)
            Container(
              color: Colors.black.withOpacity(0.3),
              child: const Center(
                child: CircularProgressIndicator(color: Color(0xFF203B32)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 20,
            decoration: BoxDecoration(
              color: const Color(0xFF203B32),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF203B32),
            ),
          ),
        ],
      ),
    );
  }

  bool _areAllRequiredFieldsFilled() {
    return _clientNameController.text.isNotEmpty &&
        _emailController.text.isNotEmpty &&
        _contactNumberController.text.isNotEmpty &&
        _projectNameController.text.isNotEmpty &&
        _roomType != null &&
        _projectSizeController.text.isNotEmpty &&
        _locationController.text.isNotEmpty &&
        _budgetController.text.isNotEmpty &&
        _descriptionController.text.isNotEmpty &&
        _startDate != null &&
        _endDate != null;
  }

  Future<void> _submitProjectProposal() async {
    setState(() {
      _isSubmitting = true;
    });

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userString = prefs.getString('user');
    if (token == null || userString == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('User not logged in'), backgroundColor: Colors.red),
      );
      setState(() {
        _isSubmitting = false;
      });
      return;
    }
    final user = jsonDecode(userString);

    final Map<String, dynamic> body = {
      "title": _projectNameController.text,
      "description": _descriptionController.text,
      "budget": double.tryParse(_budgetController.text) ?? 0,
      "startDate": _startDate != null ? _startDate!.toIso8601String() : null,
      "endDate": _endDate != null ? _endDate!.toIso8601String() : null,
      "projectCreator": user['_id'] ?? user['id'],
      "roomType": _roomType,
      "projectSize": double.tryParse(_projectSizeController.text) ?? 0,
      "projectLocation": _locationController.text,
      "designInspiration":
          _inspirationLinks.isNotEmpty ? _inspirationLinks.first : null,
      "designRecommendation":
          _recommendation != null ? _recommendation!['_id'] : null,
    };

    body.removeWhere((key, value) => value == null);

    try {
      final response = await http.post(
        Uri.parse('https://capstone-thl5.onrender.com/api/project'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      );
      print('body: ${body}');
      print(
          'Project proposal response: ${response.statusCode} ${response.body}');

      setState(() {
        _isSubmitting = false;
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        // Success dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (BuildContext context) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: Row(
                children: [
                  const Icon(Icons.check_circle,
                      color: Color(0xFF203B32), size: 24),
                  const SizedBox(width: 8),
                  const Text('Submission Successful'),
                ],
              ),
              content: const Text(
                'Your project has been submitted to Moss Design House for review. Our team will contact you shortly.',
                style: TextStyle(fontSize: 16),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    Navigator.pop(context);
                  },
                  child: const Text('OK',
                      style: TextStyle(color: Color(0xFF203B32))),
                ),
              ],
            );
          },
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Submission failed: ${response.body}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isSubmitting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  String getDirectImageLink(String url) {
    final regExp = RegExp(r'drive\.google\.com\/file\/d\/([^\/]+)');
    final match = regExp.firstMatch(url);
    if (match != null && match.groupCount >= 1) {
      final id = match.group(1);
      return 'https://drive.google.com/uc?export=view&id=$id';
    }
    return url; // fallback to original
  }
}
