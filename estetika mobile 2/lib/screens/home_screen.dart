import 'package:flutter/material.dart';
import 'package:flutter_carousel_slider/carousel_slider.dart';
import 'package:estetika_ui/widgets/custom_app_bar.dart';
import 'package:estetika_ui/screens/projects_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _projectsData = [];
  List<dynamic> _designersData = [];
  bool _isLoading = true;
  bool _isDesignersLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProjects();
    _fetchDesigners();
  }

  Future<void> _fetchProjects() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await http.get(
        Uri.parse('https://moss-manila.onrender.com/api/project?index=true'),
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _projectsData = data['project'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _projectsData = [];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _projectsData = [];
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchDesigners() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await http.get(
        Uri.parse('https://moss-manila.onrender.com/api/user'),
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Filter users with role == "designer"
        final designers =
            (data as List).where((user) => user['role'] == 'designer').toList();
        setState(() {
          _designersData = designers;
          _isDesignersLoading = false;
        });
      } else {
        setState(() {
          _designersData = [];
          _isDesignersLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _designersData = [];
        _isDesignersLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(actions: [], title: ''),
      body: _isLoading || _isDesignersLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Navigation buttons row
                Padding(
                  padding: const EdgeInsets.symmetric(
                    vertical: 16.0,
                    horizontal: 24.0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildNavButton(context, 0, 'Home'),
                      const SizedBox(width: 16),
                      _buildNavButton(context, 1, 'Projects'),
                    ],
                  ),
                ),

                // Moss In Numbers section
                Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 24.0, vertical: 5.0),
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(12.0),
                    ),
                    padding: const EdgeInsets.symmetric(
                        vertical: 16.0, horizontal: 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Text(
                          'Moss In Numbers',
                          style: TextStyle(
                            fontSize: 25,
                            fontWeight: FontWeight.bold,
                            color: Color(0xff203B32),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem(
                              'Current Designers',
                              _designersData.length.toString(),
                            ),
                            _buildStatItem(
                              'Projects Completed',
                              _projectsData
                                  .where(
                                      (proj) => proj['status'] == 'completed')
                                  .length
                                  .toString(),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16.0),

                // Carousel slider for project images
                SizedBox(
                  height: 200.0,
                  child: CarouselSlider(
                    slideTransform: const CubeTransform(),
                    slideIndicator: CircularSlideIndicator(
                      padding: const EdgeInsets.only(bottom: 20),
                      currentIndicatorColor: const Color(0xff0a4b39),
                    ),
                    autoSliderDelay: const Duration(seconds: 10),
                    enableAutoSlider: true,
                    unlimitedMode: true,
                    viewportFraction: 0.9,
                    children: [
                      'assets/images/interior1.jpg',
                      'assets/images/interior2.jpg',
                      'assets/images/interior3.jpg',
                    ].map((imagePath) {
                      return Builder(
                        builder: (BuildContext context) {
                          return Container(
                            width: MediaQuery.of(context).size.width,
                            margin: const EdgeInsets.symmetric(horizontal: 5.0),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10.0),
                              image: DecorationImage(
                                image: AssetImage(imagePath),
                                fit: BoxFit.cover,
                              ),
                            ),
                          );
                        },
                      );
                    }).toList(),
                  ),
                ),
                // About Us section
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'about us :',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
                          style: TextStyle(fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  // Helper method to build statistic items
  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xff0a4b39),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[700],
          ),
        ),
      ],
    );
  }

  // Helper method to build navigation buttons
  Widget _buildNavButton(BuildContext context, int index, String title) {
    return GestureDetector(
      onTap: () {
        if (index == 1) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const ProjectsScreen()),
          );
        }
      },
      child: Container(
        width: 140,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: index == 0 ? const Color(0xff203B32) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: index == 0 ? Colors.transparent : Colors.grey[300]!,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: TextStyle(
            color: index == 0 ? Colors.white : Colors.black,
            fontSize: 16,
          ),
        ),
      ),
    );
  }
}
