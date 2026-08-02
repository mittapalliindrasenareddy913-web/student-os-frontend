import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://student-os-backend-44v4.onrender.com";
const socketUrl = BACKEND_URL.replace(/\/api$/, "").replace(/\/$/, "");

export const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw Error(`useSocket must be used inside SocketProvider`);
  return context;
};

// Web Audio Ringtone Synthesizer
let audioCtx = null;
let ringInterval = null;

const playWebSound = (type) => {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (ringInterval) {
      clearInterval(ringInterval);
    }
    
    const playTone = () => {
      if (!audioCtx) return;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'ringback') {
        osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc2.frequency.setValueAtTime(480, audioCtx.currentTime);
      } else {
        osc1.frequency.setValueAtTime(550, audioCtx.currentTime);
        osc2.frequency.setValueAtTime(650, audioCtx.currentTime);
      }

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime + 1.6);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.8);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 1.8);
      osc2.stop(audioCtx.currentTime + 1.8);
    };

    playTone();
    ringInterval = setInterval(playTone, 3000);
  } catch (err) {
    console.error('Failed to play web sound:', err);
  }
};

const stopWebSound = () => {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, ringing, connecting, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [endMessage, setEndMessage] = useState('');

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  
  const callStatusRef = useRef('idle');
  const activeCallRef = useRef(null);
  const incomingCallRef = useRef(null);
  const localStreamInstanceRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const timerCountRef = useRef(0);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    localStreamInstanceRef.current = localStreamRef.current;
  }, [localStreamRef.current]);

  useEffect(() => {
    timerCountRef.current = callDuration;
  }, [callDuration]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('sos_token');
    console.log(`🔌 [Socket] Connecting to:`, socketUrl);
    const newSocket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`🔌 [Socket] Connected successfully!`);
    });

    newSocket.on('connect_error', (e) => {
      console.error(`🔌 [Socket] Connection error:`, e.message);
    });

    newSocket.on('disconnect', (e) => {
      console.log(`🔌 [Socket] Disconnected:`, e);
    });

    newSocket.on('incoming-call', (data) => {
      if (callStatusRef.current !== 'idle') {
        newSocket.emit('call-reject', {
          callId: data.callId,
          callerId: data.caller._id,
        });
        return;
      }
      setIncomingCall(data);
      setCallStatus('ringing');
      playWebSound('ringtone');
    });

    newSocket.on('call-accepted', async (data) => {
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }
      stopWebSound();
      setCallStatus('connecting');
      await createPeerConnection(data.receiverId);
    });

    newSocket.on('call-rejected', () => {
      handleEndCall(false, 'Call Declined');
    });

    newSocket.on('call-ended', () => {
      handleEndCall(false, 'Call Ended');
    });

    newSocket.on('call-cancelled', () => {
      handleEndCall(false, 'Missed Call');
    });

    newSocket.on('webrtc-offer', async (data) => {
      await handleWebRtcOffer(data.offer, data.callerId);
    });

    newSocket.on('webrtc-answer', async (data) => {
      await handleWebRtcAnswer(data.answer);
    });

    newSocket.on('webrtc-ice-candidate', (data) => {
      handleIceCandidate(data.candidate);
    });

    newSocket.on('call-error', (data) => {
      toast.error(data.message);
      handleEndCall(false, data.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const setupMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = stream;
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      peerConnectionRef.current.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      return stream;
    } catch (err) {
      console.error('Error accessing microphone', err);
      toast.error('Microphone access denied');
      return null;
    }
  };

  const startCall = async (recipientId, recipientData) => {
    if (!socket) return;
    setActiveCall({ ...recipientData, role: 'caller' });
    setCallStatus('ringing');
    socket.emit('call-request', { recipientId });
    playWebSound('ringback');

    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    ringTimeoutRef.current = setTimeout(() => {
      handleEndCall(true, 'No Answer');
    }, 30000);
  };

  const acceptCall = async () => {
    stopWebSound();
    const data = incomingCallRef.current;
    if (!socket || !data) return;

    if (!(await setupMediaStream())) {
      rejectCall();
      return;
    }

    setActiveCall({ ...data.caller, role: 'receiver', callId: data.callId });
    setCallStatus('connecting');
    socket.emit('call-accept', { callId: data.callId, callerId: data.caller._id });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', {
          targetId: data.caller._id,
          candidate: event.candidate,
        });
      }
    };

    setIncomingCall(null);
  };

  const rejectCall = () => {
    stopWebSound();
    const data = incomingCallRef.current;
    if (!socket || !data) return;

    socket.emit('call-reject', { callId: data.callId, callerId: data.caller._id });
    setCallStatus('ended');
    setEndMessage('Call Declined');
    setTimeout(() => {
      setIncomingCall(null);
      setCallStatus('idle');
      setEndMessage('');
    }, 2000);
  };

  const createPeerConnection = async (targetId) => {
    if (!(await setupMediaStream())) {
      handleEndCall();
      return;
    }

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', {
          targetId,
          candidate: event.candidate,
        });
      }
    };

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit('webrtc-offer', { targetId, offer });
  };

  const handleWebRtcOffer = async (offer, callerId) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    socket.emit('webrtc-answer', { targetId: callerId, answer });
    setCallStatus('connected');
    startTimer();
  };

  const handleWebRtcAnswer = async (answer) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    setCallStatus('connected');
    startTimer();
  };

  const handleIceCandidate = async (candidate) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const handleEndCall = (shouldEmit = true, msg = '') => {
    stopWebSound();
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    const curActive = activeCallRef.current;
    const curIncoming = incomingCallRef.current;
    const status = callStatusRef.current;
    const stream = localStreamInstanceRef.current;
    const duration = timerCountRef.current;

    if (shouldEmit && socket && (curActive || curIncoming)) {
      const activeObj = curActive || curIncoming;
      if (activeObj.role === 'caller' && status === 'ringing') {
        socket.emit('call-cancel', { callId: activeObj.callId, receiverId: activeObj._id });
      } else {
        socket.emit('call-end', {
          callId: activeObj.callId,
          otherUserId: activeObj._id,
          duration,
        });
      }
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    stopTimer();

    let displayMsg = 'Call Ended';
    if (msg) {
      displayMsg = msg;
    } else if (status === 'ringing') {
      displayMsg = curActive?.role === 'caller' ? 'No Answer' : 'Missed Call';
    }

    setCallStatus('ended');
    setEndMessage(displayMsg);

    setTimeout(() => {
      setIncomingCall(null);
      setActiveCall(null);
      setCallStatus('idle');
      setCallDuration(0);
      setEndMessage('');
    }, 2000);
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
  };

  const startTimer = () => {
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        incomingCall,
        activeCall,
        callStatus,
        isMuted,
        isSpeaker,
        callDuration,
        endMessage,
        localAudioRef,
        remoteAudioRef,
        startCall,
        acceptCall,
        rejectCall,
        endCall: handleEndCall,
        toggleMute,
        toggleSpeaker,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
