import 'package:estetika_ui/screens/call_screen.dart';
import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

class IncomingCallScreen extends StatefulWidget {
  final socket_io.Socket socket;
  final String currentUserId;
  final String callerId;
  final String callerName;
  final String? callerProfileImage;
  final String callId;
  final bool isVideo;

  const IncomingCallScreen({
    super.key,
    required this.socket,
    required this.currentUserId,
    required this.callerId,
    required this.callerName,
    this.callerProfileImage,
    required this.callId,
    required this.isVideo,
  });

  @override
  State<IncomingCallScreen> createState() => _IncomingCallScreenState();
}

class _IncomingCallScreenState extends State<IncomingCallScreen> {
  late final Function(dynamic) _onCallEnded;
  bool _accepted = false;

  @override
  void initState() {
    super.initState();
    // While ringing there is no CallService yet, so this screen must watch for
    // the caller canceling or dropping. The backend emits 'call_ended' to the
    // callee in both cases; without this listener the ringing screen would stay
    // stuck on screen after the caller hangs up.
    _onCallEnded = (data) {
      if (!mounted || _accepted) return;
      if (data is! Map || data['callId'] != widget.callId) return;
      Navigator.of(context).maybePop();
    };
    widget.socket.on('call_ended', _onCallEnded);
  }

  @override
  void dispose() {
    widget.socket.off('call_ended', _onCallEnded);
    super.dispose();
  }

  void _reject(BuildContext context) {
    widget.socket.emit('call_reject', {
      'recipientId': widget.callerId,
      'callId': widget.callId,
    });
    Navigator.of(context).maybePop();
  }

  void _accept(BuildContext context) {
    // Once accepted, CallScreen/CallService own the 'call_ended' handling, so
    // mark accepted to stop this screen's listener from racing the transition.
    _accepted = true;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => CallScreen(
          socket: widget.socket,
          currentUserId: widget.currentUserId,
          peerId: widget.callerId,
          peerName: widget.callerName,
          peerProfileImage: widget.callerProfileImage,
          isVideo: widget.isVideo,
          isIncoming: true,
          callId: widget.callId,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xff101815),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            children: [
              const Spacer(),
              _buildAvatar(),
              const SizedBox(height: 24),
              Text(
                widget.callerName,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                widget.isVideo ? 'Incoming video call' : 'Incoming voice call',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildActionButton(
                    icon: Icons.call_end,
                    label: 'Decline',
                    color: Colors.red,
                    onPressed: () => _reject(context),
                  ),
                  _buildActionButton(
                    icon: widget.isVideo ? Icons.videocam : Icons.call,
                    label: 'Accept',
                    color: const Color(0xff203B32),
                    onPressed: () => _accept(context),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    if (widget.callerProfileImage != null &&
        widget.callerProfileImage!.isNotEmpty) {
      return CircleAvatar(
        radius: 58,
        backgroundImage: NetworkImage(widget.callerProfileImage!),
      );
    }

    return const CircleAvatar(
      radius: 58,
      backgroundColor: Color(0xff203B32),
      child: Icon(Icons.person, color: Colors.white, size: 58),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 70,
          height: 70,
          child: ElevatedButton(
            onPressed: onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: color,
              foregroundColor: Colors.white,
              shape: const CircleBorder(),
              padding: EdgeInsets.zero,
            ),
            child: Icon(icon, size: 30),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 13),
        ),
      ],
    );
  }
}
