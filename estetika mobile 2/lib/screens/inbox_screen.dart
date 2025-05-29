import 'package:flutter/material.dart';
import 'package:estetika_ui/widgets/custom_app_bar.dart';
import 'package:estetika_ui/screens/chat_detail_screen.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  late IO.Socket _socket;

  final List<MessageItem> _messages = [];

  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  List<MessageItem> _filteredMessages = [];

  String? _userId;
  String? _userToken;
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _filteredUsers = [];

  @override
  void initState() {
    super.initState();
    _filteredMessages = List.from(_messages);
    _initSocket();
    _fetchUsers();
  }

  void _initSocket() async {
    // Make sure _userToken is set before calling this!
    _socket = IO.io(
      'https://capstone-thl5.onrender.com', // <-- Replace with your server URL
      IO.OptionBuilder().setTransports(['websocket']).setAuth(
              {'token': _userToken}) // Pass token as auth
          .build(),
    );
    _socket.connect();

    // Announce online
    if (_userId != null) {
      _socket.emit('online', _userId);
    }

    // Listen for new messages
    _socket.on('receive_private_message', (data) {
      setState(() {
        _messages.insert(
          0,
          MessageItem(
            sender: data['sender'],
            recipient: data['recipient'], // <-- Add this
            content: data['content'],
            timestamp: DateTime.parse(data['timestamp']),
            isFromUser: data['sender'] == _userId,
            profileImage: null,
            isRead: false,
          ),
        );
        _filteredMessages = List.from(_messages);
      });
    });
  }

  Future<void> _fetchUsers() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    final token = prefs.getString('token');
    if (userString == null || token == null) return;
    final user = jsonDecode(userString);
    _userId = user['_id'] ?? user['id'];
    _userToken = token;

    final response = await http.get(
      Uri.parse('https://capstone-thl5.onrender.com/api/user?exclude=$_userId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      final List users = jsonDecode(response.body);
      setState(() {
        _users = users.cast<Map<String, dynamic>>();
        _filteredUsers = List.from(_users);
      });
    }
  }

  Future<void> _fetchMessagesForUser(Map<String, dynamic> user) async {
    if (_userId == null || _userToken == null) return;
    try {
      final response = await http.get(
        Uri.parse(
            'https://capstone-thl5.onrender.com/api/message?user1=$_userId&user2=${user['_id']}'),
        headers: {
          'Authorization': 'Bearer $_userToken',
        },
      );
      print(
          'Message API response: ${response.body}'); // <-- Print the response here
      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        setState(() {
          _messages.clear();
          for (var msg in data) {
            // Example in _fetchMessagesForUser and socket listener
            _messages.add(
              MessageItem(
                sender: msg['sender'],
                recipient: msg['recipient'], // <-- Add this
                content: msg['content'],
                timestamp: DateTime.parse(msg['timestamp']),
                isFromUser: msg['sender'] == _userId,
                profileImage: null,
                isRead: true,
              ),
            );
          }
          _filteredMessages = List.from(_messages);
        });
      }
    } catch (e) {
      print('Error fetching messages: $e');
    }
  }

  Widget _buildMessageItem(MessageItem message) {
    return ListTile(
      leading: CircleAvatar(
        backgroundImage: message.profileImage != null
            ? AssetImage(message.profileImage!)
            : null,
      ),
      title: Text(message.sender),
      subtitle: Text(message.content),
      trailing: Text(
        _formatTimestamp(message.timestamp),
        style: TextStyle(fontSize: 12, color: Colors.grey),
      ),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ChatDetailScreen(
              title: message.sender,
              profileImage: message.profileImage,
              messages: _messages
                  .where((m) => m.sender == message.sender || m.isFromUser)
                  .toList(),
              isOnline: false, // <-- Add this line
              onSendMessage: (text) {
                setState(() {
                  _messages.insert(
                    0,
                    MessageItem(
                      sender: _userId ?? "You",
                      recipient: message.sender,
                      content: text,
                      timestamp: DateTime.now(),
                      isFromUser: true,
                      isRead: true,
                    ),
                  );
                });
                // Optionally emit socket event here
              },
            ),
          ),
        );
      },
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    // Format the timestamp as needed
    return '${timestamp.hour}:${timestamp.minute}';
  }

  String _formatDate(DateTime date) {
    // Example: 4/12/2025
    return "${date.month}/${date.day}/${date.year}";
  }

  Widget _buildUserSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search users...',
          prefixIcon: Icon(Icons.search),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        ),
        onChanged: (query) {
          setState(() {
            _filteredUsers = _users
                .where((user) => (user['firstName'] ??
                        user['fullName'] ??
                        user['username'] ??
                        '')
                    .toLowerCase()
                    .contains(query.toLowerCase()))
                .toList();
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: 'Inbox',
        actions: [],
        isInboxScreen: true,
        showBackButton: true,
      ),
      body: Column(
        children: [
          _buildUserSearchBar(),
          Expanded(child: _buildConversationsList()),
        ],
      ),
    );
  }

  Widget _buildConversationsList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
      itemCount: _filteredUsers.length,
      itemBuilder: (context, index) {
        final user = _filteredUsers[index];
        // Find the latest message with this user
        final latestMessage = _messages
                .where((m) =>
                    m.sender == user['username'] ||
                    m.sender == user['fullName'] ||
                    m.sender == user['firstName'])
                .toList()
                .isNotEmpty
            ? _messages
                .where((m) =>
                    m.sender == user['username'] ||
                    m.sender == user['fullName'] ||
                    m.sender == user['firstName'])
                .toList()
                .first
            : null;

        final displayName = user['firstName'] ??
            user['fullName'] ??
            user['username'] ??
            'Unknown';

        return InkWell(
          onTap: () async {
            // Mark as read if needed
            if (latestMessage != null && !latestMessage.isRead) {
              setState(() {
                final idx = _messages.indexOf(latestMessage);
                if (idx != -1) {
                  _messages[idx] = MessageItem(
                    sender: latestMessage.sender,
                    recipient:
                        latestMessage.recipient, // <-- Add recipient here
                    content: latestMessage.content,
                    timestamp: latestMessage.timestamp,
                    isFromUser: latestMessage.isFromUser,
                    profileImage: latestMessage.profileImage,
                    isRead: true,
                  );
                }
              });
            }
            // Fetch messages for this user first
            await _fetchMessagesForUser(user);

            // Then open chat detail
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ChatDetailScreen(
                  title: displayName,
                  profileImage: null,
                  messages: _messages
                      .where((m) =>
                          (m.sender == user['_id'] && m.recipient == _userId) ||
                          (m.sender == _userId && m.recipient == user['_id']))
                      .toList(),
                  isOnline: user['socketId'] != null, // <-- pass online status
                  onSendMessage: (text) {
                    setState(() {
                      _messages.insert(
                        0,
                        MessageItem(
                          sender: _userId ?? "You",
                          recipient: user['_id'],
                          content: text,
                          timestamp: DateTime.now(),
                          isFromUser: true,
                          isRead: true,
                        ),
                      );
                    });
                    _socket.emit('send_private_message', {
                      'sender': _userId,
                      'recipientId': user['_id'],
                      'content': text,
                      'timestamp': DateTime.now().toIso8601String(),
                    });
                  },
                ),
              ),
            );
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 16.0),
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(12.0),
              color: (latestMessage != null && !latestMessage.isRead)
                  ? Colors.grey[50]
                  : Colors.white,
            ),
            child: Row(
              children: [
                // Avatar
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: Colors.green[700],
                      child: Text(
                        displayName[0].toUpperCase(),
                        style: const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                    if (latestMessage != null && !latestMessage.isRead)
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          width: 12,
                          height: 12,
                          decoration: const BoxDecoration(
                            color: Color(0xff203B32),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 16),
                // Message preview
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayName,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight:
                              (latestMessage != null && !latestMessage.isRead)
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        latestMessage?.content ?? 'Start a conversation...',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                          fontWeight:
                              (latestMessage != null && !latestMessage.isRead)
                                  ? FontWeight.w500
                                  : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
                // Timestamp
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      latestMessage != null
                          ? _formatDate(latestMessage.timestamp)
                          : '',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                    const SizedBox(height: 4),
                    if (latestMessage != null && !latestMessage.isRead)
                      const Icon(
                        Icons.circle,
                        size: 10,
                        color: Color(0xff203B32),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class MessageItem {
  final String sender;
  final String recipient; // <-- Add this
  final String content;
  final DateTime timestamp;
  final bool isFromUser;
  final String? profileImage;
  final bool isRead;

  MessageItem({
    required this.sender,
    required this.recipient, // <-- Add this
    required this.content,
    required this.timestamp,
    required this.isFromUser,
    this.profileImage,
    required this.isRead,
  });
}
