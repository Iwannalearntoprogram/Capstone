import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:estetika_ui/widgets/custom_app_bar.dart';
import 'package:estetika_ui/screens/send_project_screen.dart';
import 'package:estetika_ui/screens/project_detail_screen.dart';
import 'package:intl/intl.dart';
import 'package:estetika_ui/widgets/project_card.dart';

extension StringCasingExtension on String {
  String capitalize() =>
      isNotEmpty ? '${this[0].toUpperCase()}${substring(1)}' : '';
}

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  int _selectedButtonIndex = 1; // 1 for Projects selected

  List<Map<String, dynamic>> _projects = [];

  @override
  void initState() {
    super.initState();
    _fetchProjects();
  }

  Future<void> _fetchProjects() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userString = prefs.getString('user');
      if (userString == null) return;
      final user = jsonDecode(userString);
      final userId = user['id'];
      print('User ID: $userId');
      final response = await http.get(
        Uri.parse(
            'https://capstone-moss.onrender.com/api/project?projectCreator=$userId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${prefs.getString('token') ?? ''}',
        },
      );
      // print('Response status: ${response.statusCode}');
      // print('Response body: ${response.body}');
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        print('Projects fetched: ${decoded['project']}');
        final List<dynamic> data = decoded['project'] ?? [];
        setState(() {
          _projects = data.cast<Map<String, dynamic>>();
        });
      } else if (response.statusCode == 404) {
        setState(() {
          _projects = [];
        });
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to load projects. Please try again.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error fetching projects: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        showBackButton: false,
        actions: [],
        title: '',
      ),
      body: Column(
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
                _buildNavButton(0, 'Home'),
                const SizedBox(width: 16),
                _buildNavButton(1, 'Projects'),
              ],
            ),
          ),

          // Projects list
          Expanded(
            child: _projects.isEmpty
                ? const Center(
                    child: Text(
                      'No projects',
                      style: TextStyle(fontSize: 18, color: Colors.grey),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    itemCount: _projects.length,
                    itemBuilder: (context, index) {
                      return GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ProjectDetailScreen(
                                project: _projects[index],
                              ),
                            ),
                          );
                        },
                        child: _buildProjectCard(_projects[index]),
                      );
                    },
                  ),
          ),

          // Send Project Proposal button
          Padding(
            padding: const EdgeInsets.all(40.0),
            child: SizedBox(
              width: double.infinity,
              height: 60.0,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) => const SendProjectScreen()),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF203B32),
                  foregroundColor: Colors.white,
                  textStyle: const TextStyle(
                    fontFamily: 'Figtree',
                    fontWeight: FontWeight.w500,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: const Text(
                  'Send Project Proposal',
                  style: TextStyle(
                    fontFamily: 'Figtree',
                    fontWeight: FontWeight.w500,
                    fontSize: 20,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavButton(int index, String title) {
    bool isSelected = _selectedButtonIndex == index;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedButtonIndex = index;
        });
        if (index == 0) {
          Navigator.pushReplacementNamed(context, '/home');
        }
      },
      child: Container(
        width: 140,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xff203B32) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? Colors.transparent : Colors.grey[300]!,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black,
            fontSize: 16,
          ),
        ),
      ),
    );
  }

  Widget _buildProjectCard(Map<String, dynamic> project) {
    String status = (project['status'] ?? 'Pending').toString().capitalize();

    Color statusColor;
    switch (status) {
      case 'Pending':
        statusColor = Colors.orange;
        break;
      case 'Completed':
        statusColor = Colors.green;
        break;
      case 'On Going':
        statusColor = Colors.blue;
        break;
      case 'Cancelled':
        statusColor = Colors.red;
        break;
      default:
        statusColor = Colors.blue;
    }

    final String title = project['title'] ?? 'No Title';
    final String description = project['description'] ?? '';
    final int budget = project['budget'] ?? 0;
    final String roomType = project['roomType'] ?? 'N/A';
    final String startDate = project['startDate'] != null
        ? project['startDate'].toString().substring(0, 10)
        : 'N/A';
    final String endDate = project['endDate'] != null
        ? project['endDate'].toString().substring(0, 10)
        : 'N/A';
    final double progress = (project['progress'] ?? 0).toDouble();

    final NumberFormat currencyFormat =
        NumberFormat.currency(locale: 'en_PH', symbol: '₱');

    return ProjectCard(
      title: title,
      status: status,
      statusColor: statusColor,
      description: description,
      roomType: roomType,
      budget: currencyFormat.format(budget),
      startDate: startDate,
      endDate: endDate,
      progress: progress,
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProjectDetailScreen(project: project),
          ),
        );
      },
    );
  }
}
