import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined' | 'missed';
export type CallType = 'audio' | 'video';

interface UseVideoCallProps {
  socket: Socket | null;
  userId: string;
  onIncomingCall?: (callData: any) => void;
  otherUser?: any; // The other user in the conversation
}

export const useVideoCall = ({ socket, userId, onIncomingCall, otherUser }: UseVideoCallProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const [remoteUser, setRemoteUser] = useState<any>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const incomingSdpOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: Track active call ID and pending local candidates
  const activeCallIdRef = useRef<string | null>(null);
  const pendingLocalIceCandidatesRef = useRef<any[]>([]);

  const iceServers: RTCConfiguration = {
    iceServers: [
      // STUN servers (for NAT traversal)
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },

      // FREE TURN servers (for strict NAT/firewall bypass)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle' as RTCBundlePolicy,
    rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
  };

  const attachMediaStream = useCallback((videoElement: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (videoElement && stream) {
      videoElement.srcObject = stream;
      videoElement.onloadedmetadata = () => {
        videoElement.play().catch(err => console.error('Error playing video:', err));
      };
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      console.log('🛑 Stopping local stream');
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up call resources');

    activeCallIdRef.current = null;
    pendingLocalIceCandidatesRef.current = [];

    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    stopLocalStream();

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    pendingIceCandidatesRef.current = [];
    incomingSdpOfferRef.current = null;

    setCallStatus('ended');

    cleanupTimeoutRef.current = setTimeout(() => {
      setCallStatus('idle');
      setCurrentCall(null);
      setRemoteUser(null);
      setIsCallInitiator(false);
      cleanupTimeoutRef.current = null;
    }, 2000);
  }, [stopLocalStream]);

  const endCall = useCallback(() => {
    if (!currentCall) {
      console.log('⚠️ No current call to end');
      cleanup();
      return;
    }

    if (!socket) {
      cleanup();
      return;
    }

    const duration = currentCall.startedAt
      ? Math.floor((Date.now() - new Date(currentCall.startedAt).getTime()) / 1000)
      : 0;

    console.log('📵 Ending call:', currentCall._id);
    socket.emit('call:end', {
      callId: currentCall._id,
      duration,
      reason: 'completed',
    });

    cleanup();
  }, [socket, currentCall, cleanup]);

  const declineCall = useCallback((callId: string, reason?: string) => {
    if (!socket) return;

    console.log('❌ Declining call:', callId, reason);
    socket.emit('call:decline', { callId, reason });
    setCallStatus('declined');
    stopLocalStream();
    incomingSdpOfferRef.current = null;
    setTimeout(() => setCallStatus('idle'), 2000);
  }, [socket, stopLocalStream]);

  const initializePeerConnection = useCallback(() => {
    console.log('🔌 Initializing peer connection');

    if (peerConnectionRef.current) {
      console.log('⚠️ Closing existing peer connection');
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const candidateData = event.candidate.toJSON();

        if (activeCallIdRef.current) {
          console.log('🧊 Sending ICE candidate:', candidateData.candidate);
          socket.emit('call:ice-candidate', {
            callId: activeCallIdRef.current,
            candidate: candidateData,
          });
        } else {
          console.log('⏳ Queuing local ICE candidate (no call ID yet)');
          pendingLocalIceCandidatesRef.current.push(candidateData);
        }
      } else if (!event.candidate) {
        console.log('🧊 All ICE candidates have been sent');
      }
    };

    pc.ontrack = (event) => {
      console.log('📹 Received remote track:', event.track.kind);

      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
        console.log('✅ Created new remote stream');
      }

      remoteStreamRef.current.addTrack(event.track);
      console.log('✅ Added track to remote stream');

      attachMediaStream(remoteVideoRef.current, remoteStreamRef.current);

      requestAnimationFrame(() => {
        attachMediaStream(remoteVideoRef.current, remoteStreamRef.current);
      });
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);

      if (pc.iceConnectionState === 'failed') {
        console.error('❌ ICE connection failed - attempting restart');
        pc.restartIce();
      } else if (pc.iceConnectionState === 'connected') {
        console.log('✅ ICE connection established!');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);

      if (pc.connectionState === 'connected') {
        console.log('✅ Peer connection established!');
        setCallStatus('connected');

        if (socket && activeCallIdRef.current) {
          socket.emit('call:connected', { callId: activeCallIdRef.current });
          console.log('📤 Sent call:connected to server');
        }
      }
      else if (pc.connectionState === 'connecting') {
        console.log('🔄 Peer connection connecting...');
        setCallStatus('connecting');
      }
      else if (pc.connectionState === 'disconnected') {
        console.log('⚠️ Peer connection disconnected');
        setTimeout(() => {
          if (pc.connectionState === 'disconnected') {
            console.log('❌ Connection still disconnected after 5s, ending call');
            endCall();
          }
        }, 5000);
      }
      else if (pc.connectionState === 'failed') {
        console.log('❌ Peer connection failed');
        endCall();
      }
    };

    console.log('✅ Peer connection initialized with event handlers');
    return pc;
  }, [socket, attachMediaStream, setCallStatus, endCall]);

  const getUserMedia = useCallback(async (callType: CallType) => {
    try {
      console.log('🎥 Requesting user media, type:', callType);

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      attachMediaStream(localVideoRef.current, stream);

      return stream;
    } catch (error: any) {
      console.error('❌ Error accessing media devices:', error);
      throw new Error(`Could not access ${callType === 'video' ? 'camera/microphone' : 'microphone'}. Please check permissions.`);
    }
  }, [attachMediaStream]);

  const startCall = useCallback(async (conversationId: string, callType: CallType = 'video') => {
    if (!socket || !socket.connected) {
      throw new Error('Socket not connected');
    }

    if (!['idle', 'ended', 'declined', 'missed'].includes(callStatus)) {
      console.warn('Cannot start call - already in call state:', callStatus);
      throw new Error('Already in a call');
    }

    if (currentCall || peerConnectionRef.current) {
      cleanup();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      console.log('📞 Starting call:', { conversationId, callType });

      if (otherUser) {
        setRemoteUser(otherUser);
      }

      setCallStatus('calling');
      setIsCallInitiator(true);

      // Reset refs
      activeCallIdRef.current = null;
      pendingLocalIceCandidatesRef.current = [];

      // STEP 1: Get media stream
      const stream = await getUserMedia(callType);

      // STEP 2: Create PeerConnection immediately
      const pc = initializePeerConnection();

      // STEP 3: Add tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // STEP 4: Create Offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video',
      });

      await pc.setLocalDescription(offer);
      console.log('📝 Created and set local SDP offer');

      // STEP 5: Send offer to server
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Call initiation timeout'));
          cleanup();
        }, 10000);

        socket.emit('call:initiate', {
          conversationId,
          type: callType,
          sdpOffer: offer,
          forceNew: true,
        }, async (response: any) => {
          clearTimeout(timeout);

          if (!response.success) {
            console.error('❌ Call initiation failed:', response.error);
            cleanup();
            reject(new Error(response.error));
            return;
          }

          const callId = response.call._id;
          console.log('✅ Call initiated, call ID:', callId);

          setCurrentCall(response.call);
          activeCallIdRef.current = callId;

          // STEP 6: Flush queued local ICE candidates
          if (pendingLocalIceCandidatesRef.current.length > 0) {
            console.log(`🧊 Flushing ${pendingLocalIceCandidatesRef.current.length} queued local ICE candidates`);
            pendingLocalIceCandidatesRef.current.forEach(candidate => {
              socket.emit('call:ice-candidate', {
                callId: callId,
                candidate: candidate,
              });
            });
            pendingLocalIceCandidatesRef.current = [];
          }

          // Set timeout for no answer
          callTimeoutRef.current = setTimeout(() => {
            if (callStatus === 'calling' || callStatus === 'ringing') {
              console.log('⏰ Call timeout - no answer');
              socket.emit('call:missed', { callId });
              cleanup();
              setCallStatus('missed');
            }
          }, 45000);

          resolve(response.call);
        });
      });

    } catch (error) {
      console.error('❌ Error starting call:', error);
      cleanup();
      throw error;
    }
  }, [socket, callStatus, currentCall, otherUser, getUserMedia, initializePeerConnection, cleanup]);

  const answerCall = useCallback(async (callData: any) => {
    if (!socket || !socket.connected) {
      throw new Error('Socket not connected');
    }

    try {
      console.log('📞 Answering call:', callData);

      setRemoteUser(callData.initiator);
      setCallStatus('connecting');
      setCurrentCall(callData.call);
      setIsCallInitiator(false);

      // Set active call ID
      activeCallIdRef.current = callData.call._id;
      pendingLocalIceCandidatesRef.current = [];

      // STEP 1: Get media stream
      const stream = await getUserMedia(callData.call.type);

      // STEP 2: Create peer connection
      const pc = initializePeerConnection();

      // STEP 3: Add tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // STEP 4: Get and set remote SDP
      let remoteSdp = incomingSdpOfferRef.current || callData.sdpOffer || callData.call.metadata?.sdp;

      if (!remoteSdp) {
        throw new Error('No SDP offer found');
      }

      await pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));

      // STEP 5: Add pending remote ICE candidates
      if (pendingIceCandidatesRef.current.length > 0) {
        for (const candidate of pendingIceCandidatesRef.current) {
          try {
            await pc.addIceCandidate(candidate);
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        }
        pendingIceCandidatesRef.current = [];
      }

      // STEP 6: Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // STEP 7: Send answer
      socket.emit('call:answer', {
        callId: callData.call._id,
        sdpAnswer: answer,
      });

      console.log('✅ Call answered successfully');

    } catch (error: any) {
      console.error('❌ Error answering call:', error);
      declineCall(callData.call._id, error.message);
      throw error;
    }
  }, [socket, getUserMedia, initializePeerConnection, declineCall]);

  const toggleMicrophone = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('🎤 Microphone:', audioTrack.enabled ? 'ON' : 'OFF');
        return audioTrack.enabled;
      }
    }
    return false;
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('📹 Camera:', videoTrack.enabled ? 'ON' : 'OFF');
        return videoTrack.enabled;
      }
    }
    return false;
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      console.log('📞 Incoming call event:', data);

      if (data.sdpOffer) {
        incomingSdpOfferRef.current = data.sdpOffer;
      }

      if (data.initiator) {
        setRemoteUser(data.initiator);
      }

      setCallStatus('ringing');
      onIncomingCall?.(data);
    };

    const handleCallAnswered = async (data: any) => {
      console.log('✅ Call answered event:', data);

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      if (!remoteUser && otherUser) {
        setRemoteUser(otherUser);
      }

      setCallStatus('connecting');

      if (peerConnectionRef.current && data.sdpAnswer) {
        try {
          console.log('📥 Setting remote description (answer)');
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.sdpAnswer)
          );

          // Process queued remote ICE candidates
          if (pendingIceCandidatesRef.current.length > 0) {
            console.log(`🧊 Adding ${pendingIceCandidatesRef.current.length} pending remote ICE candidates`);
            for (const candidate of pendingIceCandidatesRef.current) {
              try {
                await peerConnectionRef.current.addIceCandidate(candidate);
              } catch (err) {
                console.error('Error adding ICE candidate:', err);
              }
            }
            pendingIceCandidatesRef.current = [];
          }
        } catch (error) {
          console.error('❌ Error setting remote description:', error);
        }
      }
    };

    const handleCallDeclined = (data: any) => {
      console.log('❌ Call declined event:', data);
      setCallStatus('declined');
      cleanup();
    };

    const handleCallEnded = (data: any) => {
      console.log('📵 Call ended event:', data);
      cleanup();
    };

    const handleIceCandidate = async (data: any) => {
      // Only handle candidates for the current call
      if (data.callId !== activeCallIdRef.current && !incomingSdpOfferRef.current) {
        // If we have an incoming offer but no active call ID yet (ringing state), we might want to queue them
        // But usually we queue them in pendingIceCandidatesRef
      }

      if (peerConnectionRef.current && data.candidate) {
        try {
          const candidate = new RTCIceCandidate(data.candidate);

          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(candidate);
          } else {
            pendingIceCandidatesRef.current.push(candidate);
          }
        } catch (error) {
          console.error('❌ Error handling ICE candidate:', error);
        }
      }
    };

    const handleCallStatus = (data: any) => {
      if (data.status === 'connected') {
        setCallStatus('connected');
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:answered', handleCallAnswered);
    socket.on('call:declined', handleCallDeclined);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:status', handleCallStatus);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:answered', handleCallAnswered);
      socket.off('call:declined', handleCallDeclined);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:status', handleCallStatus);
    };
  }, [socket, cleanup, onIncomingCall, remoteUser, otherUser]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callStatus,
    currentCall,
    isCallInitiator,
    remoteUser,
    localVideoRef,
    remoteVideoRef,
    remoteStreamRef, // Expose remote stream ref
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
  };
};
