import 'package:flutter/material.dart';
import 'package:estetika_ui/screens/inbox_screen.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

class ChatDetailScreen extends StatefulWidget {
  final String title;
  final String? profileImage;
  final List<MessageItem> messages;
  final bool isOnline; // <-- add this
  final Function(String) onSendMessage;

  const ChatDetailScreen({
    super.key,
    required this.title,
    this.profileImage,
    required this.messages,
    required this.isOnline, // <-- add this
    required this.onSendMessage,
  });

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isTyping = false;

  late List<MessageItem> _localMessages; // <-- Add this

  @override
  void initState() {
    super.initState();
    _localMessages = List.from(widget.messages); // <-- Initialize local copy
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_messageController.text.trim().isNotEmpty) {
      widget.onSendMessage(_messageController.text.trim());

      // Add the new message locally for instant UI update
      setState(() {
        _localMessages.add(
          MessageItem(
            sender: "You", // or pass the actual userId if available
            recipient: "", // you can fill this if needed
            content: _messageController.text.trim(),
            timestamp: DateTime.now(),
            isFromUser: true,
            isRead: true,
          ),
        );
        _isTyping = false;
      });

      _messageController.clear();

      // Scroll to bottom after sending message
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            0.0,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    }
  }

  void _showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    const Text(
                      'Send Media',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: Colors.grey[300]),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildAttachmentOption(
                      icon: Icons.insert_photo,
                      label: 'Photo',
                      color: Colors.blue,
                      onTap: () {
                        Navigator.pop(context);
                        _pickAndSendImage();
                      },
                    ),
                    _buildAttachmentOption(
                      icon: Icons.camera_alt,
                      label: 'Camera',
                      color: Colors.green,
                      onTap: () {
                        Navigator.pop(context);
                        // Implement camera access
                      },
                    ),
                    _buildAttachmentOption(
                      icon: Icons.insert_drive_file,
                      label: 'File',
                      color: Colors.orange,
                      onTap: () {
                        Navigator.pop(context);
                        _pickAndSendFile();
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAttachmentOption({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 30),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final sortedMessages = List<MessageItem>.from(_localMessages)
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            if (widget.profileImage != null && widget.profileImage!.isNotEmpty)
              CircleAvatar(
                radius: 18,
                backgroundImage: NetworkImage(widget.profileImage!),
              )
            else
              CircleAvatar(
                radius: 18,
                backgroundColor: const Color(0xff203B32),
                child: const Icon(Icons.person, color: Colors.white, size: 16),
              ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.title,
                  style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  widget.isOnline ? 'Online' : 'Offline',
                  style: TextStyle(
                    color: widget.isOnline ? Colors.green : Colors.grey,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.videocam, color: Colors.black),
            onPressed: () {
              // Implement video call
            },
          ),
          IconButton(
            icon: const Icon(Icons.call, color: Colors.black),
            onPressed: () {
              // Implement voice call
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              reverse: true,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              itemCount: sortedMessages.length,
              itemBuilder: (context, index) {
                final message =
                    sortedMessages[sortedMessages.length - 1 - index];
                return _buildMessageItem(message);
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  spreadRadius: 1,
                  blurRadius: 3,
                  offset: const Offset(0, -1),
                ),
              ],
            ),
            child: Column(
              children: [
                if (_isTyping)
                  const Padding(
                    padding: EdgeInsets.only(left: 16, bottom: 4),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'typing...',
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                  ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline),
                      color: const Color(0xff203B32),
                      onPressed: _showAttachmentOptions,
                    ),
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: InputDecoration(
                          hintText: 'Type a message',
                          hintStyle: TextStyle(color: Colors.grey[500]),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: Colors.grey[100],
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                        onChanged: (text) {
                          setState(() => _isTyping = text.isNotEmpty);
                        },
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.send,
                        color: Color(0xff203B32),
                      ),
                      onPressed: _sendMessage,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageItem(MessageItem message) {
    final isFromUser = message.isFromUser;
    final content = message.content;

    Widget contentWidget;
    if (content.startsWith('[Image]')) {
      final url = content.replaceFirst('[Image] ', '');
      contentWidget =
          Image.network(url, width: 180, height: 180, fit: BoxFit.cover);
    } else if (content.startsWith('[File]')) {
      final url = content.replaceFirst('[File] ', '');
      contentWidget = InkWell(
        onTap: () {
          // Open file link
          launchUrl(Uri.parse(url));
        },
        child: Text('File: $url',
            style: TextStyle(
                decoration: TextDecoration.underline, color: Colors.blue)),
      );
    } else {
      contentWidget = Text(
        content,
        style: TextStyle(
          color: isFromUser ? Colors.white : Colors.black,
          fontSize: 16,
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment:
            isFromUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isFromUser) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: Colors.grey[400],
              child: const Icon(Icons.person, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isFromUser ? const Color(0xff203B32) : Colors.grey[200],
                borderRadius: isFromUser
                    ? const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                        bottomLeft: Radius.circular(16),
                        bottomRight: Radius.circular(4),
                      )
                    : const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                        bottomRight: Radius.circular(16),
                        bottomLeft: Radius.circular(4),
                      ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  contentWidget,
                  const SizedBox(height: 4),
                  Text(
                    _formatTimestamp(message.timestamp),
                    style: TextStyle(
                      color: isFromUser ? Colors.white70 : Colors.grey[600],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final hour = timestamp.hour.toString();
    final minute = timestamp.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  Future<void> _pickAndSendImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;
    await _uploadAndSendFile(File(picked.path), isImage: true);
  }

  Future<void> _pickAndSendFile() async {
    final result = await FilePicker.platform.pickFiles();
    if (result == null || result.files.isEmpty) return;
    final file = File(result.files.single.path!);
    await _uploadAndSendFile(file, isImage: false);
  }

  Future<void> _uploadAndSendFile(File file, {required bool isImage}) async {
    // You may want to get the token from SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) return;

    final uri =
        Uri.parse('https://capstone-thl5.onrender.com/api/upload/message');
    final request = http.MultipartRequest('POST', uri)
      ..headers['Authorization'] = 'Bearer $token'
      ..files.add(await http.MultipartFile.fromPath('file', file.path));

    final response = await request.send();
    final responseBody = await response.stream.bytesToString();

    if (response.statusCode == 200) {
      final data = jsonDecode(responseBody);
      final fileLink = data['fileLink'];
      final fileType = data['fileType'];
      final fileName = file.path.split('/').last;

      // Call your onSendMessage or emit socket event here
      widget.onSendMessage('[${isImage ? "Image" : "File"}] $fileLink');

      setState(() {
        _localMessages.add(
          MessageItem(
            sender: "You",
            recipient: "",
            content: '[${isImage ? "Image" : "File"}] $fileLink',
            timestamp: DateTime.now(),
            isFromUser: true,
            isRead: true,
          ),
        );
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to upload file')),
      );
    }
  }
}
