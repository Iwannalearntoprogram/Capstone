import 'dart:async';

import 'package:estetika_ui/services/call_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

class CallScreen extends StatefulWidget {
  final socket_io.Socket socket;
  final String currentUserId;
  final String peerId;
  final String peerName;
  final String? peerProfileImage;
  final bool isVideo;
  final bool isIncoming;
  final String? callId;

  const CallScreen({
    super.key,
    required this.socket,
    required this.currentUserId,
    required this.peerId,
    required this.peerName,
    this.peerProfileImage,
    required this.isVideo,
    required this.isIncoming,
    this.callId,
  });

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  CallService? _callService;
  late final String _callId;
  String _status = 'Initializing...';
  bool _isMuted = false;
  bool _isCameraOff = false;
  bool _isSpeakerOn = true;
  bool _isEnding = false;
  bool _durationStarted = false;
  Duration _duration = Duration.zero;
  Timer? _durationTimer;

  @override
  void initState() {
    super.initState();
    _callId = widget.callId ??
        '${widget.currentUserId}-${widget.peerId}-${DateTime.now().millisecondsSinceEpoch}';
    unawaited(_startCall());
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    if (!_isEnding) {
      unawaited(_callService?.endCall());
    }
    super.dispose();
  }

  Future<void> _startCall() async {
    try {
      _callService = CallService(
        socket: widget.socket,
        currentUserId: widget.currentUserId,
        peerId: widget.peerId,
        callId: _callId,
        isVideo: widget.isVideo,
        onStatusChanged: _setStatus,
        onRemoteStream: () {
          if (mounted) setState(() {});
        },
        onEnded: _handleRemoteEnd,
      );

      await _callService!.initialize();
      if (widget.isIncoming) {
        _callService!.acceptIncoming();
      } else {
        _callService!.invite();
      }
    } catch (error) {
      _setStatus(error.toString().replaceFirst('Exception: ', ''));
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) Navigator.of(context).maybePop();
    }
  }

  void _setStatus(String status) {
    if (!mounted) return;
    setState(() {
      _status = status;
    });

    if (status == 'Connected' && !_durationStarted) {
      _durationStarted = true;
      _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (!mounted) return;
        setState(() {
          _duration += const Duration(seconds: 1);
        });
      });
    }
  }

  void _handleRemoteEnd() {
    if (!mounted) return;
    _isEnding = true;
    _durationTimer?.cancel();
    Future.delayed(const Duration(milliseconds: 900), () {
      if (mounted) Navigator.of(context).maybePop();
    });
  }

  Future<void> _endCall() async {
    if (_isEnding) return;
    setState(() {
      _isEnding = true;
      _status = 'Call ended';
    });
    _durationTimer?.cancel();
    await _callService?.endCall();
    if (mounted) Navigator.of(context).maybePop();
  }

  Future<void> _toggleMute() async {
    final muted = !_isMuted;
    await _callService?.toggleMute(muted);
    if (mounted) {
      setState(() {
        _isMuted = muted;
      });
    }
  }

  Future<void> _toggleCamera() async {
    final cameraOff = !_isCameraOff;
    await _callService?.toggleCamera(cameraOff);
    if (mounted) {
      setState(() {
        _isCameraOff = cameraOff;
      });
    }
  }

  Future<void> _toggleSpeaker() async {
    final speakerOn = !_isSpeakerOn;
    await _callService?.toggleSpeaker(speakerOn);
    if (mounted) {
      setState(() {
        _isSpeakerOn = speakerOn;
      });
    }
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        await _endCall();
        return false;
      },
      child: Scaffold(
        backgroundColor: const Color(0xff101815),
        body: SafeArea(
          child: widget.isVideo ? _buildVideoCall() : _buildVoiceCall(),
        ),
      ),
    );
  }

  Widget _buildVideoCall() {
    final remoteRenderer = _callService?.remoteRenderer;
    final localRenderer = _callService?.localRenderer;

    return Stack(
      children: [
        Positioned.fill(
          child: remoteRenderer == null
              ? _buildWaitingArea()
              : RTCVideoView(
                  remoteRenderer,
                  objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                ),
        ),
        Positioned(
          top: 16,
          left: 16,
          right: 16,
          child: _buildTopInfo(Colors.white),
        ),
        Positioned(
          top: 96,
          right: 16,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 112,
              height: 160,
              color: Colors.black54,
              child: localRenderer == null || _isCameraOff
                  ? const Icon(Icons.videocam_off,
                      color: Colors.white70, size: 32)
                  : RTCVideoView(
                      localRenderer,
                      mirror: true,
                      objectFit:
                          RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                    ),
            ),
          ),
        ),
        Positioned(
          left: 16,
          right: 16,
          bottom: 28,
          child: _buildControls(video: true),
        ),
      ],
    );
  }

  Widget _buildVoiceCall() {
    return Column(
      children: [
        const Spacer(),
        _buildAvatar(56),
        const SizedBox(height: 24),
        Text(
          widget.peerName,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.w700,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 10),
        _buildStatusText(Colors.white70),
        const Spacer(),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
          child: _buildControls(video: false),
        ),
      ],
    );
  }

  Widget _buildWaitingArea() {
    return Container(
      color: const Color(0xff101815),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildAvatar(44),
          const SizedBox(height: 18),
          Text(
            widget.peerName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          _buildStatusText(Colors.white70),
        ],
      ),
    );
  }

  Widget _buildTopInfo(Color color) {
    return Row(
      children: [
        _buildAvatar(20),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.peerName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: color,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              _buildStatusText(color.withValues(alpha: 0.75)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatusText(Color color) {
    final text = _durationStarted ? _formatDuration(_duration) : _status;
    return Text(
      text,
      style: TextStyle(
        color: color,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  Widget _buildAvatar(double radius) {
    if (widget.peerProfileImage != null &&
        widget.peerProfileImage!.isNotEmpty) {
      return CircleAvatar(
        radius: radius,
        backgroundImage: NetworkImage(widget.peerProfileImage!),
      );
    }

    return CircleAvatar(
      radius: radius,
      backgroundColor: const Color(0xff203B32),
      child: Icon(Icons.person, color: Colors.white, size: radius),
    );
  }

  Widget _buildControls({required bool video}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildControlButton(
          icon: _isMuted ? Icons.mic_off : Icons.mic,
          label: _isMuted ? 'Muted' : 'Mute',
          onPressed: _toggleMute,
        ),
        if (video)
          _buildControlButton(
            icon: _isCameraOff ? Icons.videocam_off : Icons.videocam,
            label: _isCameraOff ? 'Camera off' : 'Camera',
            onPressed: _toggleCamera,
          )
        else
          _buildControlButton(
            icon: _isSpeakerOn ? Icons.volume_up : Icons.hearing,
            label: _isSpeakerOn ? 'Speaker' : 'Earpiece',
            onPressed: _toggleSpeaker,
          ),
        if (video)
          _buildControlButton(
            icon: Icons.cameraswitch,
            label: 'Switch',
            onPressed: () => _callService?.switchCamera(),
          ),
        _buildControlButton(
          icon: Icons.call_end,
          label: 'End',
          backgroundColor: Colors.red,
          onPressed: _endCall,
        ),
      ],
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
    Color backgroundColor = const Color(0xff2B3934),
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 58,
          height: 58,
          child: ElevatedButton(
            onPressed: onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: backgroundColor,
              foregroundColor: Colors.white,
              shape: const CircleBorder(),
              padding: EdgeInsets.zero,
            ),
            child: Icon(icon, size: 26),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: 72,
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ),
      ],
    );
  }
}
