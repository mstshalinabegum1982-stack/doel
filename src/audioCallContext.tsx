import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { AuthContext } from './authContext';
import { 
  setCallSessionRTDB, 
  listenCallSessionRTDB, 
  sendIceCandidateRTDB, 
  listenIceCandidatesRTDB, 
  removeCallSessionRTDB 
} from './services/rtdbEphemeralService';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  User, 
  Maximize2, 
  Minimize2, 
  Bluetooth, 
  Smartphone,
  Video,
  VideoOff,
  RotateCw,
  Zap,
  Sparkles,
  FlipHorizontal,
  SwitchCamera
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type CallStatus = 'idle' | 'dialing' | 'incoming' | 'connecting' | 'connected' | 'busy' | 'ended' | 'rejected';
export type CallType = 'audio' | 'video';
export type CallResolution = '480p' | '720p';

export // Helper to configure adaptive WebRTC video parameters (3G/4G network auto-adjustment like WhatsApp/Imo)
const configureAdaptiveWebRTCParameters = (sender: RTCRtpSender) => {
  if (!sender || !sender.track || sender.track.kind !== 'video') return;
  
  try {
    const parameters = sender.getParameters();
    if (!parameters.encodings) {
      parameters.encodings = [{}];
    }
    
    // Check network type if supported by browser
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const effectiveType = conn?.effectiveType || '4g';
    
    if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      parameters.encodings[0].maxBitrate = 150000; // 150 kbps
      parameters.encodings[0].maxFramerate = 12;
    } else if (effectiveType === '3g') {
      parameters.encodings[0].maxBitrate = 350000; // 350 kbps
      parameters.encodings[0].maxFramerate = 18;
    } else {
      parameters.encodings[0].maxBitrate = 1800000; // 1.8 Mbps for 4G/WiFi
      parameters.encodings[0].maxFramerate = 30;
    }
    
    // Automatic degradation preference: 'balanced' scales both framerate & resolution smoothly without breaking call
    parameters.degradationPreference = 'balanced';
    sender.setParameters(parameters).catch(e => console.warn("Adaptive bitrate setParameters warning:", e));
  } catch (err) {
    console.warn("Error setting WebRTC adaptive parameters:", err);
  }
};

interface CallData {
  id: string;
  callerId: string;
  callerName: string;
  callerPhoto: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto: string;
  status: CallStatus;
  type: CallType;
  resolution: CallResolution;
  offer?: any;
  answer?: any;
  createdAt?: string;
  micMutedByCaller?: boolean;
  micMutedByReceiver?: boolean;
  videoOffByCaller?: boolean;
  videoOffByReceiver?: boolean;
}

interface AudioCallContextType {
  currentCall: CallData | null;
  callStatus: CallStatus;
  isMuted: boolean;
  isVideoOff: boolean;
  facingMode: 'user' | 'environment';
  isMirrorLocal: boolean;
  resolution: CallResolution;
  duration: number; // in seconds
  startCall: (receiverId: string, receiverName: string, receiverPhoto: string, type?: CallType, res?: CallResolution) => Promise<void>;
  acceptCall: (withVideo?: boolean) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleMirrorLocal: () => void;
  switchCamera: () => Promise<void>;
  changeResolution: (res: CallResolution) => Promise<void>;
  swapVideoFeeds: () => void;
}

export const AudioCallContext = createContext<AudioCallContextType>({
  currentCall: null,
  callStatus: 'idle',
  isMuted: false,
  isVideoOff: false,
  facingMode: 'user',
  isMirrorLocal: true,
  resolution: '720p',
  duration: 0,
  startCall: async () => {},
  acceptCall: async () => {},
  endCall: async () => {},
  toggleMute: () => {},
  toggleVideo: () => {},
  toggleMirrorLocal: () => {},
  switchCamera: async () => {},
  changeResolution: async () => {},
  swapVideoFeeds: () => {}
});

const iceServersConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export function AudioCallProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useContext(AuthContext);
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [resolution, setResolution] = useState<CallResolution>('720p');
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [audioRoute, setAudioRoute] = useState<'speaker' | 'ear' | 'bluetooth'>('speaker');
  const [isSwappedVideo, setIsSwappedVideo] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrorLocal, setIsMirrorLocal] = useState(true);

  const toggleMirrorLocal = () => {
    setIsMirrorLocal(prev => !prev);
  };

  const dragConstraintsRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const ringtoneRef = useRef<{ stop: () => void } | null>(null);
  const currentCallRef = useRef<CallData | null>(null);
  const callStatusRef = useRef<CallStatus>('idle');
  const durationRef = useRef<number>(0);
  const hasSavedCallLogRef = useRef<Record<string, boolean>>({});
  const wasConnectedRef = useRef(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  // WebRTC candidate buffering & RTDB candidate listener ref
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const rtdbCandidatesUnsubRef = useRef<(() => void) | null>(null);

  const addOrQueueIceCandidate = (candidateInit: any) => {
    if (!candidateInit) return;
    const pc = pcRef.current;
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch(err => {
        console.warn("ICE candidate add failed:", err);
      });
    } else {
      pendingCandidatesRef.current.push(candidateInit);
    }
  };

  const flushPendingCandidates = async () => {
    if (pcRef.current && pendingCandidatesRef.current.length > 0) {
      const candidates = [...pendingCandidatesRef.current];
      pendingCandidatesRef.current = [];
      for (const cand of candidates) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn("Failed adding queued ICE candidate:", err);
        }
      }
    }
  };

  // WebSocket for zero-Firestore read/write WebRTC signaling
  const wsRef = useRef<WebSocket | null>(null);

  // Keep current call refs updated
  useEffect(() => {
    currentCallRef.current = currentCall;
  }, [currentCall]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  // Connect WebSocket Signaling Client
  useEffect(() => {
    if (!user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let isSubscribed = true;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/signaling`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[WebRTC Signaling] WebSocket connected. Registering user:", user.uid);
          ws.send(JSON.stringify({ type: 'register', userId: user.uid }));
        };

        ws.onmessage = async (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'signal-offer') {
              // Incoming call signal received via WebSocket (Zero Firestore read/write!)
              if (callStatusRef.current !== 'idle' && callStatusRef.current !== 'incoming') {
                // Busy response
                sendSignal({ type: 'signal-busy', toUserId: data.callerId, callId: data.callId });
                return;
              }

              let callerPhoto = data.callerPhoto || '';
              let callerName = data.callerName || 'User';

              // If caller photo is empty, asynchronously fetch from Firestore user doc
              if (!callerPhoto && data.callerId) {
                try {
                  const callerSnap = await getDoc(doc(db, 'users', data.callerId));
                  if (callerSnap.exists()) {
                    const cData = callerSnap.data();
                    callerPhoto = cData.profileImage || cData.photoURL || cData.avatar || '';
                    if (cData.name) callerName = cData.name;
                  }
                } catch (e) {
                  console.warn("Failed to fetch caller photo:", e);
                }
              }

              const incomingCall: CallData = {
                id: data.callId,
                callerId: data.callerId,
                callerName: callerName,
                callerPhoto: callerPhoto,
                receiverId: user.uid,
                receiverName: profile?.name || (profile as any)?.storeName || user.displayName || 'User',
                receiverPhoto: profile?.profileImage || (profile as any)?.avatar || user.photoURL || '',
                status: 'incoming',
                type: data.callType || 'audio',
                resolution: data.resolution || '720p',
                offer: data.offer,
                createdAt: new Date().toISOString()
              };

              setCurrentCall(incomingCall);
              setCallStatus('incoming');
              setResolution(data.resolution || '720p');
              setIsMuted(false);
              setIsVideoOff(false);

              // Play incoming call ringtone
              if (ringtoneRef.current) ringtoneRef.current.stop();
              const callNotifEnabled = localStorage.getItem('notification_call') !== 'false';
              if (callNotifEnabled) {
                ringtoneRef.current = playRingToneLoop(true);
              }

            } else if (data.type === 'signal-answer') {
              // Answer received by caller
              if (pcRef.current && data.answer) {
                if (ringtoneRef.current) {
                  ringtoneRef.current.stop();
                  ringtoneRef.current = null;
                }
                setCallStatus('connected');
                const answerDesc = new RTCSessionDescription(data.answer);
                await pcRef.current.setRemoteDescription(answerDesc).catch(e => console.warn("SDP Answer set err:", e));
                await flushPendingCandidates();
              }

            } else if (data.type === 'signal-ice') {
              // ICE candidate received
              if (data.candidate) {
                addOrQueueIceCandidate(data.candidate);
              }

            } else if (data.type === 'signal-reject') {
              setCallStatus('rejected');
              cleanupCalling();
              playBusyOrErrorBeep();
              if (currentCallRef.current) {
                saveCallLogToChat(currentCallRef.current, 'rejected', 0);
              }
              setTimeout(() => {
                setCurrentCall(null);
                setCallStatus('idle');
              }, 2500);

            } else if (data.type === 'signal-busy') {
              setCallStatus('busy');
              cleanupCalling();
              playBusyOrErrorBeep();
              if (currentCallRef.current) {
                saveCallLogToChat(currentCallRef.current, 'busy', 0);
              }
              setTimeout(() => {
                setCurrentCall(null);
                setCallStatus('idle');
              }, 3000);

            } else if (data.type === 'signal-end') {
              const finalDur = durationRef.current;
              setCallStatus('ended');
              cleanupCalling();
              if (currentCallRef.current) {
                saveCallLogToChat(currentCallRef.current, 'ended', finalDur);
              }
              setTimeout(() => {
                setCurrentCall(null);
                setCallStatus('idle');
              }, 2000);

            } else if (data.type === 'signal-resolution-change') {
              if (data.resolution) {
                setResolution(data.resolution);
              }

            } else if (data.type === 'signal-toggle-mic') {
              setCurrentCall(prev => prev ? {
                ...prev,
                [data.fromUserId === prev.callerId ? 'micMutedByCaller' : 'micMutedByReceiver']: data.micMuted
              } : null);

            } else if (data.type === 'signal-toggle-video') {
              setCurrentCall(prev => prev ? {
                ...prev,
                [data.fromUserId === prev.callerId ? 'videoOffByCaller' : 'videoOffByReceiver']: data.videoOff
              } : null);
            }
          } catch (e) {
            console.error("Error parsing WebSocket signaling message:", e);
          }
        };

        ws.onclose = () => {
          if (isSubscribed) {
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          }
        };

        ws.onerror = (err) => {
          console.warn("[WebRTC Signaling] WS error:", err);
        };
      } catch (err) {
        console.warn("WebSocket connect failed:", err);
      }
    };

    connectWebSocket();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?.uid]);

  // --- REAL-TIME FIRESTORE CALL SIGNALING LISTENER (Guarantees call receiver screen pops up) ---
  useEffect(() => {
    if (!user?.uid) return;

    // 1. Listen to calls where current user is receiver
    const qIncoming = query(
      collection(db, 'calls'),
      where('receiverId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubIncoming = onSnapshot(qIncoming, async (snap) => {
      snap.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        const callId = change.doc.id;

        if (change.type === 'added' || change.type === 'modified') {
          // If call is incoming or dialing, and current user is currently idle
          if ((data.status === 'incoming' || data.status === 'dialing') && callStatusRef.current === 'idle') {
            const createdAtMs = data.createdAt ? new Date(data.createdAt).getTime() : Date.now();
            const isRecent = Date.now() - createdAtMs < 60000; // initiated within 60s

            if (isRecent) {
              let callerPhoto = data.callerPhoto || '';
              let callerName = data.callerName || 'User';

              if (!callerPhoto && data.callerId) {
                try {
                  const callerSnap = await getDoc(doc(db, 'users', data.callerId));
                  if (callerSnap.exists()) {
                    const cData = callerSnap.data();
                    callerPhoto = cData.profileImage || cData.photoURL || cData.avatar || '';
                    if (cData.name) callerName = cData.name;
                  }
                } catch (e) {
                  console.warn("Failed to fetch caller photo:", e);
                }
              }

              const incomingCall: CallData = {
                id: callId,
                callerId: data.callerId,
                callerName,
                callerPhoto,
                receiverId: user.uid,
                receiverName: profile?.name || (profile as any)?.storeName || user.displayName || 'User',
                receiverPhoto: profile?.profileImage || (profile as any)?.avatar || user.photoURL || '',
                status: 'incoming',
                type: data.type || 'audio',
                resolution: data.resolution || '720p',
                offer: data.offer,
                createdAt: data.createdAt || new Date().toISOString()
              };

              setCurrentCall(incomingCall);
              setCallStatus('incoming');
              setResolution(data.resolution || '720p');
              setIsMuted(false);
              setIsVideoOff(false);

              if (ringtoneRef.current) ringtoneRef.current.stop();
              const callNotifEnabled = localStorage.getItem('notification_call') !== 'false';
              if (callNotifEnabled) {
                ringtoneRef.current = playRingToneLoop(true);
              }
            }
          } else if (currentCallRef.current?.id === callId && ['ended', 'rejected', 'busy'].includes(data.status)) {
            if (callStatusRef.current !== 'idle' && callStatusRef.current !== 'ended') {
              const finalDur = durationRef.current;
              setCallStatus(data.status as any);
              cleanupCalling();
              if (data.status === 'rejected' || data.status === 'busy') {
                playBusyOrErrorBeep();
              }
              if (currentCallRef.current) {
                saveCallLogToChat(currentCallRef.current, data.status, finalDur);
              }
              setTimeout(() => {
                setCurrentCall(null);
                setCallStatus('idle');
              }, 2000);
            }
          }
        }
      });
    }, (err) => {
      console.warn("Incoming calls Firestore snapshot error:", err);
    });

    // 2. Listen to calls where current user is caller (to receive answer / end / reject)
    const qOutgoing = query(
      collection(db, 'calls'),
      where('callerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubOutgoing = onSnapshot(qOutgoing, async (snap) => {
      snap.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        const callId = change.doc.id;

        if (currentCallRef.current?.id === callId) {
          if (data.status === 'connected' && data.answer && callStatusRef.current === 'dialing') {
            if (ringtoneRef.current) {
              ringtoneRef.current.stop();
              ringtoneRef.current = null;
            }
            setCallStatus('connected');
            if (pcRef.current) {
              const answerDesc = new RTCSessionDescription(data.answer);
              await pcRef.current.setRemoteDescription(answerDesc).catch(e => console.warn("SDP Answer set err:", e));
              await flushPendingCandidates();
            }
          } else if (['ended', 'rejected', 'busy'].includes(data.status)) {
            if (callStatusRef.current !== 'idle' && callStatusRef.current !== 'ended') {
              const finalDur = durationRef.current;
              setCallStatus(data.status as any);
              cleanupCalling();
              if (data.status === 'rejected' || data.status === 'busy') {
                playBusyOrErrorBeep();
              }
              if (currentCallRef.current) {
                saveCallLogToChat(currentCallRef.current, data.status, finalDur);
              }
              setTimeout(() => {
                setCurrentCall(null);
                setCallStatus('idle');
              }, 2000);
            }
          }
        }
      });
    }, (err) => {
      console.warn("Outgoing calls Firestore snapshot error:", err);
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, [user?.uid]);

  // 3. Listen to remote ICE candidates from Firestore
  useEffect(() => {
    if (!currentCall?.id || callStatus === 'idle') return;

    const unsubCandidates = onSnapshot(collection(db, 'calls', currentCall.id, 'candidates'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const cData = change.doc.data();
          if (cData.fromUserId !== user?.uid && cData.candidate) {
            addOrQueueIceCandidate(cData.candidate);
          }
        }
      });
    });

    return () => unsubCandidates();
  }, [currentCall?.id, callStatus, user?.uid]);

  const sendSignal = (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ ...payload, fromUserId: user?.uid }));
    }
  };

  useEffect(() => {
    if (callStatus === 'idle') {
      setIsMinimized(false);
      setAudioRoute('speaker');
      setIsSwappedVideo(false);
    }
  }, [callStatus]);

  // Handle hardware audio route setSinkId
  const toggleAudioRoute = async () => {
    const nextRoute = audioRoute === 'speaker' 
      ? 'ear' 
      : audioRoute === 'ear' 
        ? 'bluetooth' 
        : 'speaker';
    setAudioRoute(nextRoute);

    try {
      const audioEl = document.getElementById('remote-audio') as any;
      if (audioEl && typeof audioEl.setSinkId === 'function') {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
          const devicesList = await navigator.mediaDevices.enumerateDevices();
          const outputs = devicesList.filter(d => d.kind === 'audiooutput');
          
          let targetDevice: MediaDeviceInfo | undefined;
          if (nextRoute === 'speaker') {
            targetDevice = outputs.find(d => d.label.toLowerCase().includes('speaker') || d.label.toLowerCase().includes('loud'));
          } else if (nextRoute === 'ear') {
            targetDevice = outputs.find(d => d.label.toLowerCase().includes('ear') || d.label.toLowerCase().includes('receiver') || d.label.toLowerCase().includes('headset'));
          } else if (nextRoute === 'bluetooth') {
            targetDevice = outputs.find(d => d.label.toLowerCase().includes('bluetooth') || d.label.toLowerCase().includes('bt'));
          }

          if (targetDevice) {
            await audioEl.setSinkId(targetDevice.deviceId);
          } else if (outputs.length > 0) {
            await audioEl.setSinkId('default');
          }
        }
      }
    } catch (err) {
      console.warn("Hardware audio routing setSinkId fallback:", err);
    }
  };

  // Timer tracking
  useEffect(() => {
    if (callStatus === 'connected') {
      wasConnectedRef.current = true;
      setDuration(0);
      durationRef.current = 0;
      timerIntervalRef.current = setInterval(() => {
        setDuration(prev => {
          const next = prev + 1;
          durationRef.current = next;
          return next;
        });
      }, 1000);
    } else {
      setDuration(0);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [callStatus]);

  // Attach local and remote video streams to elements when connected or dialing
  useEffect(() => {
    const syncVideoStreams = () => {
      if (localVideoRef.current && localStreamRef.current) {
        if (localVideoRef.current.srcObject !== localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        if (localVideoRef.current.paused) {
          localVideoRef.current.play().catch(e => console.warn("Local video play warning:", e));
        }
      }
      if (remoteVideoRef.current && remoteStreamRef.current) {
        if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
        if (remoteVideoRef.current.paused) {
          remoteVideoRef.current.play().catch(e => console.warn("Remote video play warning:", e));
        }
      }
    };

    syncVideoStreams();
    const interval = setInterval(syncVideoStreams, 400);
    return () => clearInterval(interval);
  }, [callStatus, isMinimized, isSwappedVideo, currentCall?.type]);

  const saveCallLogToChat = async (call: CallData, finalStatus: string, finalDuration: number) => {
    const callId = call.id;
    if (hasSavedCallLogRef.current[callId]) return;
    hasSavedCallLogRef.current[callId] = true;

    try {
      const chatId = [call.callerId, call.receiverId].sort().join('_');
      const msgId = `call_log_${callId}`;
      const isConnected = wasConnectedRef.current || finalDuration > 0;
      const statusType = isConnected ? 'connected' : 'missed';
      const callKind = call.type === 'video' ? 'VIDEO_CALL' : 'CALL';
      const logText = `${callKind}_LOG:${call.callerId}:${call.receiverId}:${statusType}:${finalDuration}`;

      const msgData = {
        id: msgId,
        chatId,
        senderId: call.callerId,
        type: 'call',
        text: logText,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'chats', chatId, 'messages', msgId), msgData, { merge: true });

      await setDoc(doc(db, 'chats', chatId), {
        participants: [call.callerId, call.receiverId].sort(),
        lastMessage: logText,
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

    } catch (err) {
      console.warn("Failed to save call log to chat:", err);
    }
  };

  const playRingToneLoop = (isIncoming: boolean) => {
    let audioCtx: AudioContext | null = null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();
    } catch {
      return null;
    }
    
    const playBeep = () => {
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.frequency.value = isIncoming ? 380 : 440;
      osc2.frequency.value = isIncoming ? 420 : 480;
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime + 1.2);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 1.6);
      osc2.stop(audioCtx.currentTime + 1.6);
    };
    
    playBeep();
    const interval = setInterval(playBeep, 2400);
    return {
      stop: () => {
        clearInterval(interval);
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close();
        }
      }
    };
  };

  const playBusyOrErrorBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      const playBeep = (timeOffset: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = 480;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime + timeOffset);
        gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + timeOffset + 0.05);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + timeOffset + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + timeOffset + 0.3);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + timeOffset);
        osc.stop(audioCtx.currentTime + timeOffset + 0.35);
      };

      for (let i = 0; i < 4; i++) {
        playBeep(i * 0.5);
      }

      setTimeout(() => {
        if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
      }, 2500);
    } catch (e) {
      console.warn(e);
    }
  };

  const cleanupCalling = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
      ringtoneRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(t => t.stop());
      remoteStreamRef.current = null;
    }
    if (rtdbCandidatesUnsubRef.current) {
      rtdbCandidatesUnsubRef.current();
      rtdbCandidatesUnsubRef.current = null;
    }
    pendingCandidatesRef.current = [];
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  // Obtain constraints based on 480p or 720p HD resolution and camera facing mode
  const getVideoConstraints = (res: CallResolution, facing: 'user' | 'environment' = facingMode) => {
    const base = res === '480p' 
      ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
      : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };
    return { ...base, facingMode: { ideal: facing } };
  };

  // Switch camera between front ('user') and back ('environment')
  const switchCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    if (!localStreamRef.current) return;

    try {
      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...getVideoConstraints(resolution, nextFacing),
            facingMode: { exact: nextFacing }
          },
          audio: false
        });
      } catch {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: getVideoConstraints(resolution, nextFacing),
          audio: false
        });
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        localStreamRef.current.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      localStreamRef.current.addTrack(newVideoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }
    } catch (err) {
      console.warn("Failed to switch camera mode:", err);
    }
  };

  // Start outgoing call (Audio or Video with 480p/720p)
  const startCall = async (
    receiverId: string, 
    receiverName: string, 
    receiverPhoto: string, 
    type: CallType = 'audio', 
    targetResolution: CallResolution = '720p'
  ) => {
    if (!user) return;
    cleanupCalling();

    const callId = `call_${user.uid}_${receiverId}_${Date.now()}`;

    let cName = profile?.name || profile?.storeName || profile?.businessName || user.displayName || 'User';
    let cPhoto = profile?.profileImage || (profile as any)?.avatar || user.photoURL || '';

    let rName = receiverName;
    let rPhoto = receiverPhoto;

    try {
      const [callerSnap, receiverSnap] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDoc(doc(db, 'users', receiverId))
      ]);

      if (callerSnap.exists()) {
        const cData = callerSnap.data();
        if (cData.name || cData.storeName) cName = cData.name || cData.storeName;
        if (cData.profileImage || cData.photoURL || cData.avatar) {
          cPhoto = cData.profileImage || cData.photoURL || cData.avatar;
        }
      }
      if (receiverSnap.exists()) {
        const rData = receiverSnap.data();
        if (rData.name || rData.storeName) rName = rData.name || rData.storeName;
        if (rData.profileImage || rData.photoURL || rData.avatar) {
          rPhoto = rData.profileImage || rData.photoURL || rData.avatar;
        }
      }
    } catch (err) {
      console.warn("Error fetching profiles:", err);
    }

    const newCallData: CallData = {
      id: callId,
      callerId: user.uid,
      callerName: cName,
      callerPhoto: cPhoto,
      receiverId,
      receiverName: rName,
      receiverPhoto: rPhoto,
      status: 'dialing',
      type,
      resolution: targetResolution,
      createdAt: new Date().toISOString()
    };

    setCurrentCall(newCallData);
    setCallStatus('dialing');
    setResolution(targetResolution);
    setIsMuted(false);
    setIsVideoOff(false);
    wasConnectedRef.current = false;

    // Ringer sound
    ringtoneRef.current = playRingToneLoop(false);

    try {
      // Get media stream (Audio + optional Video in 480p or 720p)
      let stream: MediaStream | null = null;
      try {
        const mediaConstraints = {
          audio: true,
          video: type === 'video' ? getVideoConstraints(targetResolution) : false
        };
        stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        localStreamRef.current = stream;

        if (type === 'video' && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Could not get media stream, trying audio only:", err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = stream;
        } catch {
          console.warn("No audio/video hardware accessible.");
        }
      }

      // WebRTC PeerConnection
      const pc = new RTCPeerConnection(iceServersConfig);
      pcRef.current = pc;

      if (stream) {
        stream.getTracks().forEach(track => {
          const sender = pc.addTrack(track, stream!);
          if (sender && track.kind === 'video') {
            configureAdaptiveWebRTCParameters(sender);
          }
        });
      }

      // ICE candidates sent over WebSocket + RTDB + Firestore backup
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candJson = event.candidate.toJSON();
          sendSignal({
            type: 'signal-ice',
            toUserId: receiverId,
            callId,
            candidate: candJson
          });
          sendIceCandidateRTDB(callId, 'receiver', candJson);
          try {
            addDoc(collection(db, 'calls', callId, 'candidates'), {
              candidate: candJson,
              fromUserId: user.uid,
              createdAt: new Date().toISOString()
            }).catch(() => {});
          } catch {}
        }
      };

      // Listen for incoming ICE candidates sent to caller
      if (rtdbCandidatesUnsubRef.current) rtdbCandidatesUnsubRef.current();
      rtdbCandidatesUnsubRef.current = listenIceCandidatesRTDB(callId, 'caller', (cand) => {
        addOrQueueIceCandidate(cand);
      });

      // Remote tracks arrival
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        remoteStreamRef.current = remoteStream;

        if (event.track.kind === 'audio') {
          let audioEl = document.getElementById('remote-audio') as HTMLAudioElement;
          if (!audioEl) {
            audioEl = document.createElement('audio');
            audioEl.id = 'remote-audio';
            audioEl.autoplay = true;
            (audioEl as any).playsInline = true;
            document.body.appendChild(audioEl);
          }
          audioEl.srcObject = remoteStream;
          audioEl.play().catch(e => console.error("Error playing remote audio stream:", e));
        }

        if (event.track.kind === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(e => console.warn("Error playing remote video:", e));
        }
      };

      // Create WebRTC Offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offerData = {
        sdp: offerDescription.sdp,
        type: offerDescription.type
      };

      // Push offer signal over WebSocket
      sendSignal({
        type: 'signal-offer',
        toUserId: receiverId,
        callId,
        callType: type,
        resolution: targetResolution,
        offer: offerData,
        callerId: user.uid,
        callerName: cName,
        callerPhoto: cPhoto
      });

      // Publish call session to RTDB for instantaneous WebRTC signaling with zero Firestore read/write costs
      setCallSessionRTDB(callId, {
        id: callId,
        callerId: user.uid,
        callerName: cName,
        callerPhoto: cPhoto,
        receiverId,
        receiverName: rName,
        receiverPhoto: rPhoto,
        status: 'incoming',
        type,
        resolution: targetResolution,
        offer: offerData,
        createdAt: new Date().toISOString()
      });

      // Also persist call document in Firestore so receiver receives incoming call popup guaranteed
      try {
        await setDoc(doc(db, 'calls', callId), {
          id: callId,
          callerId: user.uid,
          callerName: cName,
          callerPhoto: cPhoto,
          receiverId,
          receiverName: rName,
          receiverPhoto: rPhoto,
          status: 'incoming',
          type,
          resolution: targetResolution,
          offer: offerData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (fsErr) {
        console.warn("Error persisting call to Firestore:", fsErr);
      }

    } catch (err) {
      console.error("Error starting outgoing call:", err);
      setCallStatus('idle');
      setCurrentCall(null);
      cleanupCalling();
    }
  };

  // Accept incoming call
  const acceptCall = async (withVideo: boolean = true) => {
    const call = currentCallRef.current || currentCall;
    if (!call || !user) return;

    // Immediately stop ringtone and give instant UI feedback
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
      ringtoneRef.current = null;
    }
    setCallStatus('connecting');

    try {
      const isVideoCall = (call.type === 'video' || withVideo) && withVideo !== false;
      const targetRes = call.resolution || '720p';

      let stream: MediaStream | null = null;
      try {
        const mediaConstraints = {
          audio: true,
          video: isVideoCall ? getVideoConstraints(targetRes) : false
        };
        stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      } catch (mediaErr) {
        console.warn("Could not obtain high-res stream on accept, trying basic constraints:", mediaErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideoCall ? true : false
          });
        } catch (mErr2) {
          console.warn("Could not obtain video stream, falling back to audio only:", mErr2);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          } catch (audioErr) {
            console.warn("No audio or video hardware accessible on device:", audioErr);
          }
        }
      }

      localStreamRef.current = stream;

      if (stream && isVideoCall && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      const pc = new RTCPeerConnection(iceServersConfig);
      pcRef.current = pc;

      if (stream) {
        stream.getTracks().forEach(track => {
          const sender = pc.addTrack(track, stream!);
          if (sender && track.kind === 'video') {
            configureAdaptiveWebRTCParameters(sender);
          }
        });
      }

      // ICE candidates sent over WebSocket + RTDB + Firestore backup
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candJson = event.candidate.toJSON();
          sendSignal({
            type: 'signal-ice',
            toUserId: call.callerId,
            callId: call.id,
            candidate: candJson
          });
          sendIceCandidateRTDB(call.id, 'caller', candJson);
          try {
            addDoc(collection(db, 'calls', call.id, 'candidates'), {
              candidate: candJson,
              fromUserId: user.uid,
              createdAt: new Date().toISOString()
            }).catch(() => {});
          } catch {}
        }
      };

      // Listen for incoming ICE candidates sent to receiver
      if (rtdbCandidatesUnsubRef.current) rtdbCandidatesUnsubRef.current();
      rtdbCandidatesUnsubRef.current = listenIceCandidatesRTDB(call.id, 'receiver', (cand) => {
        addOrQueueIceCandidate(cand);
      });

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        remoteStreamRef.current = remoteStream;

        if (event.track.kind === 'audio') {
          let audioEl = document.getElementById('remote-audio') as HTMLAudioElement;
          if (!audioEl) {
            audioEl = document.createElement('audio');
            audioEl.id = 'remote-audio';
            audioEl.autoplay = true;
            (audioEl as any).playsInline = true;
            document.body.appendChild(audioEl);
          }
          audioEl.srcObject = remoteStream;
          audioEl.play().catch(e => console.error("Error playing remote audio stream:", e));
        }

        if (event.track.kind === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(e => console.warn("Error playing remote video:", e));
        }
      };

      let callOffer = call.offer;
      if (!callOffer && call.id) {
        try {
          const callSnap = await getDoc(doc(db, 'calls', call.id));
          if (callSnap.exists()) {
            callOffer = callSnap.data()?.offer;
          }
        } catch (e) {
          console.warn("Failed fetching call offer from Firestore:", e);
        }
      }

      if (callOffer) {
        const offerDesc = new RTCSessionDescription(callOffer);
        await pc.setRemoteDescription(offerDesc);
        await flushPendingCandidates();
      } else {
        console.warn("No SDP offer available for incoming call", call.id);
      }

      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answerData = {
        sdp: answerDescription.sdp,
        type: answerDescription.type
      };

      // Send SDP Answer over WebSocket
      sendSignal({
        type: 'signal-answer',
        toUserId: call.callerId,
        callId: call.id,
        answer: answerData
      });

      // Also persist answer in Firestore
      try {
        await setDoc(doc(db, 'calls', call.id), {
          status: 'connected',
          answer: answerData,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn("Error updating answer in Firestore:", fsErr);
      }

      setCallStatus('connected');

    } catch (err) {
      console.error("Error accepting call:", err);
      sendSignal({ type: 'signal-reject', toUserId: call.callerId, callId: call.id });
      try {
        setDoc(doc(db, 'calls', call.id), { status: 'rejected', updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } catch {}
      cleanupCalling();
      setCurrentCall(null);
      setCallStatus('idle');
    }
  };

  // End or decline call
  const endCall = async () => {
    const call = currentCallRef.current;
    const status = callStatusRef.current;
    
    if (!call) return;

    cleanupCalling();

    const targetStatus = status === 'incoming' ? 'rejected' : 'ended';
    const otherUserId = user?.uid === call.callerId ? call.receiverId : call.callerId;

    sendSignal({
      type: targetStatus === 'rejected' ? 'signal-reject' : 'signal-end',
      toUserId: otherUserId,
      callId: call.id
    });

    const finalDur = durationRef.current;
    try {
      await setDoc(doc(db, 'calls', call.id), {
        status: targetStatus,
        durationSecs: finalDur,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    } catch {}

    setCallStatus(targetStatus);
    saveCallLogToChat(call, targetStatus, finalDur);

    setTimeout(() => {
      setCurrentCall(null);
      setCallStatus('idle');
    }, 1500);
  };

  // Toggle Microphone
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }

    const call = currentCallRef.current;
    if (call && user) {
      const otherUserId = user.uid === call.callerId ? call.receiverId : call.callerId;
      sendSignal({
        type: 'signal-toggle-mic',
        toUserId: otherUserId,
        micMuted: nextMuted
      });
    }
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !nextVideoOff;
      });
    }

    const call = currentCallRef.current;
    if (call && user) {
      const otherUserId = user.uid === call.callerId ? call.receiverId : call.callerId;
      sendSignal({
        type: 'signal-toggle-video',
        toUserId: otherUserId,
        videoOff: nextVideoOff
      });
    }
  };

  // Change Resolution (480p SD vs 720p HD)
  const changeResolution = async (newRes: CallResolution) => {
    setResolution(newRes);
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        try {
          const constraints = getVideoConstraints(newRes);
          await videoTrack.applyConstraints(constraints);
          console.log(`Video track resolution adjusted to ${newRes}`);
        } catch (e) {
          console.warn("Failed to apply track resolution constraints dynamically:", e);
        }
      }
    }

    const call = currentCallRef.current;
    if (call && user) {
      const otherUserId = user.uid === call.callerId ? call.receiverId : call.callerId;
      sendSignal({
        type: 'signal-resolution-change',
        toUserId: otherUserId,
        resolution: newRes
      });
    }
  };

  // Swap video feeds (main vs PiP)
  const swapVideoFeeds = () => {
    setIsSwappedVideo(prev => !prev);
  };

  // Helper time formatting
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Proactively fetch other user's photo if missing from currentCall
  const [resolvedOtherPhoto, setResolvedOtherPhoto] = useState<string>('');

  useEffect(() => {
    if (!currentCall || !user) {
      setResolvedOtherPhoto('');
      return;
    }

    const otherId = user.uid === currentCall.callerId ? currentCall.receiverId : currentCall.callerId;
    const directPhoto = user.uid === currentCall.callerId ? currentCall.receiverPhoto : currentCall.callerPhoto;

    if (directPhoto) {
      setResolvedOtherPhoto(directPhoto);
    } else if (otherId) {
      getDoc(doc(db, 'users', otherId)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          const p = data.profileImage || data.photoURL || data.avatar || '';
          if (p) setResolvedOtherPhoto(p);
        }
      }).catch(err => console.warn("Error fetching other user photo in call:", err));
    }
  }, [currentCall?.id, currentCall?.callerPhoto, currentCall?.receiverPhoto, user?.uid]);

  const otherUserPhoto = resolvedOtherPhoto || (user?.uid === currentCall?.callerId ? currentCall?.receiverPhoto : currentCall?.callerPhoto);
  const otherUserName = user?.uid === currentCall?.callerId ? currentCall?.receiverName : currentCall?.callerName;

  const isRemoteMuted = user?.uid === currentCall?.callerId ? currentCall?.micMutedByReceiver : currentCall?.micMutedByCaller;
  const isRemoteVideoOff = user?.uid === currentCall?.callerId ? currentCall?.videoOffByReceiver : currentCall?.videoOffByCaller;

  const isVideoCall = currentCall?.type === 'video';

  const localTransform = (facingMode === 'user' && isMirrorLocal) ? 'scaleX(-1)' : 'scaleX(1)';
  const remoteTransform = 'scaleX(1)';

  // Auto-bind media streams to video elements whenever call is connected or views are swapped
  useEffect(() => {
    if (callStatus === 'connected' && isVideoCall) {
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
      if (remoteStreamRef.current && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch(() => {});
      }
    }
  }, [callStatus, isVideoCall, isSwappedVideo, isMinimized]);

  return (
    <AudioCallContext.Provider value={{ 
      currentCall, 
      callStatus, 
      isMuted, 
      isVideoOff,
      facingMode,
      isMirrorLocal,
      resolution,
      duration, 
      startCall, 
      acceptCall, 
      endCall, 
      toggleMute,
      toggleVideo,
      toggleMirrorLocal,
      switchCamera,
      changeResolution,
      swapVideoFeeds
    }}>
      {children}

      {/* CALL OVERLAY MODAL SCREEN */}
      <AnimatePresence>
        {callStatus !== 'idle' && currentCall && (
          isMinimized ? (
            /* MINIMIZED FLOATING WINDOW (WHATSAPP / MESSENGER STYLE PIP) */
            <div ref={dragConstraintsRef} className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
              <motion.div
                drag
                dragConstraints={dragConstraintsRef}
                dragMomentum={false}
                dragElastic={0.05}
                whileDrag={{ scale: 1.05 }}
                initial={{ scale: 0.7, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.7, opacity: 0 }}
                className="pointer-events-auto fixed bottom-20 right-5 w-32 h-44 bg-zinc-950/90 border border-white/20 rounded-3xl flex flex-col items-center justify-between p-2 text-white select-none cursor-grab active:cursor-grabbing overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl touch-none group"
                style={{ touchAction: 'none' }}
                onClick={(e) => {
                  // Tap anywhere on floating bubble (except action buttons) to maximize like Messenger
                  if ((e.target as HTMLElement).closest('button')) return;
                  setIsMinimized(false);
                }}
              >
                {/* Background Video for Video Calls (Only when connected) */}
                {isVideoCall && callStatus === 'connected' && (
                  <div className="absolute inset-0 w-full h-full bg-zinc-900 rounded-3xl overflow-hidden z-0">
                    <video 
                      ref={isSwappedVideo ? localVideoRef : remoteVideoRef} 
                      autoPlay 
                      playsInline 
                      muted={isSwappedVideo}
                      style={{ transform: isSwappedVideo ? localTransform : remoteTransform }}
                      className="w-full h-full object-cover transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none" />
                  </div>
                )}

                {/* Minimized Background Profile Blur for Audio or Pre-connect Calls */}
                {(!isVideoCall || callStatus !== 'connected' || isRemoteVideoOff) && (
                  <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 rounded-3xl">
                    {otherUserPhoto ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-50 scale-125 transition-all duration-700"
                        style={{ backgroundImage: `url(${otherUserPhoto})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-zinc-950 to-purple-950 opacity-70" />
                    )}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
                  </div>
                )}

                {/* Top Overlay Badge & Expand Button */}
                <div className="z-10 flex items-center justify-between w-full px-1 pt-0.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                    {callStatus === 'connected' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        {formatTime(duration)}
                      </>
                    ) : (
                      'Calling...'
                    )}
                  </span>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMinimized(false);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="p-1 rounded-full bg-black/60 hover:bg-black/80 text-white/90 backdrop-blur-md transition-all cursor-pointer"
                    title="Expand Call"
                  >
                    <Maximize2 size={11} className="text-white" />
                  </button>
                </div>

                {/* Center Content for Audio Call & Dialing/Incoming States */}
                {(!isVideoCall || callStatus !== 'connected' || isRemoteVideoOff) && (
                  <div className="z-10 flex flex-col items-center justify-center my-auto">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full ring-2 ring-emerald-500/80 p-0.5 bg-zinc-800 shadow-lg overflow-hidden flex items-center justify-center animate-pulse">
                        {otherUserPhoto ? (
                          <img 
                            src={otherUserPhoto} 
                            alt={otherUserName} 
                            className="w-full h-full rounded-full object-cover pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User size={20} className="text-gray-300" />
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-center truncate max-w-[100px] mt-1.5 text-white/90 drop-shadow">
                      {otherUserName}
                    </span>
                  </div>
                )}

                {/* Bottom Floating Control Bar */}
                <div className="z-10 flex items-center justify-center gap-2 w-full pb-0.5 px-1">
                  {/* Mic Toggle */}
                  {(callStatus === 'connected' || callStatus === 'dialing') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`p-1.5 rounded-full border transition-all flex items-center justify-center backdrop-blur-md cursor-pointer ${
                        isMuted ? "bg-red-500/80 text-white border-red-500" : "bg-black/60 text-white/90 border-white/20"
                      }`}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <MicOff size={11} /> : <Mic size={11} />}
                    </button>
                  )}

                  {/* Accept / Hangup */}
                  {callStatus === 'incoming' ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptCall(true);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center cursor-pointer animate-bounce"
                      title="Answer"
                    >
                      <Phone size={12} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        endCall();
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center cursor-pointer"
                      title="End Call"
                    >
                      <PhoneOff size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          ) : (
            /* FULL MAXIMIZED CALL SCREEN */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-4 sm:p-8 bg-zinc-950 text-white select-none overflow-hidden"
            >
              {/* Dynamic Profile Blur Background for Caller / Receiver Screen (Audio Calls, and Video Calls during Dialing/Incoming/Connecting/VideoOff) */}
              {(!isVideoCall || callStatus !== 'connected' || isRemoteVideoOff) && (
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 transition-all duration-700">
                  {otherUserPhoto ? (
                    <div 
                      className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-50 scale-125 transition-all duration-1000"
                      style={{ backgroundImage: `url(${otherUserPhoto})` }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-zinc-950 to-purple-950 opacity-70 scale-105" />
                  )}
                  {/* Subtle dark vignette overlay for optimum text & button contrast */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/80 backdrop-blur-[1px]" />
                </div>
              )}

              {/* VIDEO CONTAINER VIEW (Main Display & Floating PiP Display - Active ONLY when Video Call is actually Connected) */}
              {isVideoCall && callStatus === 'connected' ? (
                <div ref={videoContainerRef} className="absolute inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center">
                  {/* MAIN VIDEO STREAM */}
                  <video 
                    ref={isSwappedVideo ? localVideoRef : remoteVideoRef}
                    autoPlay 
                    playsInline 
                    muted={isSwappedVideo}
                    style={{ transform: isSwappedVideo ? localTransform : remoteTransform }}
                    className="w-full h-full object-cover transition-transform duration-200"
                  />

                  {/* OVERLAY IF REMOTE CAMERA IS TURNED OFF */}
                  {!isSwappedVideo && isRemoteVideoOff && (
                    <div className="absolute inset-0 bg-zinc-950/85 flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-md">
                      <div className="w-24 h-24 rounded-full border-2 border-white/20 p-1 bg-zinc-900 overflow-hidden shadow-2xl">
                        <img 
                          src={otherUserPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'} 
                          className="w-full h-full rounded-full object-cover" 
                          alt="Remote User" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <p className="text-sm font-bold text-gray-300 flex items-center gap-2">
                        <VideoOff size={16} className="text-rose-400" /> Camera Turned Off
                      </p>
                    </div>
                  )}

                  {/* FLOATING PICTURE-IN-PICTURE (PiP) LOCAL VIDEO THUMBNAIL */}
                  <motion.div 
                    drag
                    dragConstraints={videoContainerRef}
                    dragElastic={0}
                    dragMomentum={false}
                    whileHover={{ scale: 1.05 }}
                    onClick={swapVideoFeeds}
                    className="absolute top-20 right-4 sm:top-24 sm:right-8 w-28 sm:w-36 h-40 sm:h-52 bg-zinc-900 rounded-2xl border-2 border-dragon-cyan/40 shadow-2xl overflow-hidden cursor-pointer z-20 group transition-all"
                  >
                    <video 
                      ref={isSwappedVideo ? remoteVideoRef : localVideoRef}
                      autoPlay 
                      playsInline 
                      muted={!isSwappedVideo}
                      style={{ transform: !isSwappedVideo ? localTransform : remoteTransform }}
                      className="w-full h-full object-cover transition-transform duration-200"
                    />
                    {isVideoOff && !isSwappedVideo && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-1 text-center">
                        <VideoOff size={18} className="text-rose-400 mb-1" />
                        <span className="text-[9px] font-bold text-gray-400">Camera Off</span>
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-black uppercase text-dragon-cyan tracking-wider opacity-80 group-hover:opacity-100">
                      {isSwappedVideo ? 'Remote' : 'You'}
                    </div>
                  </motion.div>
                </div>
              ) : null}

              {/* TOP HEADER CONTROLS & STATUS */}
              <div className="z-30 w-full max-w-4xl flex items-center justify-between pt-2 px-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-black/60 border border-white/10 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest text-dragon-cyan flex items-center gap-1.5 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-dragon-cyan animate-pulse" />
                    {isVideoCall ? '📹 Video Call' : '📞 Audio Call'}
                  </span>

                  {/* Resolution Selector Toggle (480p SD vs 720p HD) */}
                  {isVideoCall && (
                    <div className="flex items-center bg-black/60 border border-white/10 rounded-full p-0.5 backdrop-blur-md">
                      <button
                        type="button"
                        onClick={() => changeResolution('480p')}
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                          resolution === '480p' 
                            ? "bg-dragon-cyan text-dragon-black font-black" 
                            : "text-gray-400 hover:text-white"
                        )}
                      >
                        480p SD
                      </button>
                      <button
                        type="button"
                        onClick={() => changeResolution('720p')}
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-0.5",
                          resolution === '720p' 
                            ? "bg-dragon-cyan text-dragon-black font-black" 
                            : "text-gray-400 hover:text-white"
                        )}
                      >
                        720p HD <Zap size={10} className="fill-current" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Live Counter Timer - Always at the Top Header */}
                {callStatus === 'connected' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-black/70 border border-white/20 rounded-full font-mono text-xs sm:text-sm font-bold text-dragon-cyan backdrop-blur-md shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{formatTime(duration)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Minimize button */}
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="p-2.5 rounded-full bg-black/60 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center justify-center cursor-pointer backdrop-blur-md"
                    title="Minimize call screen"
                  >
                    <Minimize2 size={18} />
                  </button>
                </div>
              </div>

              {/* CALL STATUS & AVATAR DISPLAY */}
              <div className="z-30 text-center space-y-1.5 my-auto">
                {(!isVideoCall || callStatus !== 'connected' || isRemoteVideoOff) && (
                  <div className="flex flex-col items-center justify-center space-y-4 my-4">
                    {/* Visual Pulse Rings */}
                    <div className="relative flex items-center justify-center">
                      {(callStatus === 'connected' || callStatus === 'dialing' || callStatus === 'incoming' || callStatus === 'connecting') && (
                        <>
                          <motion.div
                            animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                            className="absolute -inset-6 bg-dragon-cyan/25 rounded-full blur-xl -z-10"
                          />
                        </>
                      )}

                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-white/25 p-1 bg-zinc-900/80 shadow-[0_10px_35px_rgba(0,0,0,0.8)] relative overflow-hidden flex items-center justify-center">
                        {otherUserPhoto ? (
                          <img 
                            src={otherUserPhoto} 
                            alt={otherUserName} 
                            className="w-full h-full rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User size={56} className="text-gray-400" />
                        )}

                        {isRemoteMuted && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center space-y-1">
                            <MicOff size={22} className="text-rose-500 animate-bounce" />
                            <span className="text-[8px] font-bold text-rose-400 uppercase">Muted</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{otherUserName || 'User'}</h2>
                      <p className="text-xs text-gray-300 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                        {callStatus === 'dialing' && (isVideoCall ? `Calling... (${resolution})` : 'Calling...')}
                        {callStatus === 'incoming' && `Incoming ${isVideoCall ? 'Video' : 'Audio'} Call`}
                        {callStatus === 'connecting' && 'Connecting...'}
                        {callStatus === 'connected' && (isVideoCall ? 'Live WebRTC Video' : 'Live WebRTC Audio')}
                        {callStatus === 'busy' && 'User is on another call'}
                        {callStatus === 'rejected' && 'Call Declined'}
                        {callStatus === 'ended' && 'Call Ended'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* BOTTOM CONTROLS DASHBOARD */}
              <div className="z-30 w-full max-w-xl pb-6 sm:pb-10 flex flex-col items-center space-y-4">
                
                {/* INCOMING CALL ACTION BUTTONS (RECEIVER SCREEN) */}
                {callStatus === 'incoming' ? (
                  <div className="flex items-center justify-center gap-6 w-full">
                    {/* Decline */}
                    <button
                      type="button"
                      onClick={endCall}
                      className="p-4 sm:p-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center cursor-pointer"
                      title="Decline"
                    >
                      <PhoneOff size={26} />
                    </button>

                    {/* Accept Audio Only */}
                    <button
                      type="button"
                      onClick={() => acceptCall(false)}
                      className="p-4 sm:p-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center cursor-pointer flex-col"
                      title="Answer Audio Only"
                    >
                      <Phone size={24} />
                    </button>

                    {/* Accept Video (If Video Call) */}
                    {isVideoCall && (
                      <button
                        type="button"
                        onClick={() => acceptCall(true)}
                        className="p-5 sm:p-6 rounded-full bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black font-bold shadow-2xl shadow-dragon-cyan/40 transition-all flex items-center justify-center cursor-pointer animate-bounce"
                        title="Answer Video Call"
                      >
                        <Video size={28} />
                      </button>
                    )}
                  </div>
                ) : (
                  /* ACTIVE CONNECTED / DIALING CONTROL BAR */
                  <div className="flex items-center justify-center gap-4 sm:gap-6 px-6 py-3 bg-black/60 border border-white/10 rounded-full backdrop-blur-2xl shadow-2xl">
                    
                    {/* Audio Route Toggle */}
                    <button
                      type="button"
                      onClick={toggleAudioRoute}
                      className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                      title={`Audio Output: ${audioRoute}`}
                    >
                      {audioRoute === 'speaker' && <Volume2 size={20} className="text-dragon-cyan" />}
                      {audioRoute === 'ear' && <Smartphone size={20} className="text-dragon-cyan" />}
                      {audioRoute === 'bluetooth' && <Bluetooth size={20} className="text-dragon-cyan" />}
                    </button>

                    {/* Mic Mute Toggle */}
                    <button
                      type="button"
                      onClick={toggleMute}
                      className={cn(
                        "p-3.5 rounded-full border transition-all cursor-pointer",
                        isMuted 
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/40" 
                          : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                      )}
                      title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                      {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>

                    {/* Video Toggle (Only for Video Calls) */}
                    {isVideoCall && (
                      <button
                        type="button"
                        onClick={toggleVideo}
                        className={cn(
                          "p-3.5 rounded-full border transition-all cursor-pointer",
                          isVideoOff 
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/40" 
                            : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                        )}
                        title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                      >
                        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                      </button>
                    )}

                    {/* Camera Switch Front/Back (Only for Video Calls) */}
                    {isVideoCall && !isVideoOff && (
                      <button
                        type="button"
                        onClick={switchCamera}
                        className={cn(
                          "p-3.5 rounded-full border transition-all cursor-pointer",
                          facingMode === 'environment' 
                            ? "bg-dragon-cyan/25 text-dragon-cyan border-dragon-cyan/50 shadow-lg" 
                            : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                        )}
                        title={facingMode === 'user' ? "Switch to Back Camera (পিছনের ক্যামেরা)" : "Switch to Front Camera (সামনের ক্যামেরা)"}
                      >
                        <SwitchCamera size={22} />
                      </button>
                    )}

                    {/* Mirror Camera Toggle (Only for Front Camera Video Calls) */}
                    {isVideoCall && !isVideoOff && facingMode === 'user' && (
                      <button
                        type="button"
                        onClick={toggleMirrorLocal}
                        className={cn(
                          "p-3.5 rounded-full border transition-all cursor-pointer relative",
                          isMirrorLocal 
                            ? "bg-dragon-cyan/25 text-dragon-cyan border-dragon-cyan/50 shadow-lg" 
                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                        )}
                        title={isMirrorLocal ? "Mirror Enabled: যেদিকে মুখ ঘুরাবেন সেদিকে ঘুরবে (মিরর চালু)" : "Mirror Disabled (মিরর বন্ধ)"}
                      >
                        <FlipHorizontal size={22} />
                        {isMirrorLocal && (
                          <span className="absolute 1 top-1 right-1 w-2 h-2 bg-dragon-cyan rounded-full animate-ping" />
                        )}
                      </button>
                    )}

                    {/* Swap Feeds (Only for Video Calls) */}
                    {isVideoCall && (
                      <button
                        type="button"
                        onClick={swapVideoFeeds}
                        className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                        title="Swap Main & Picture-in-Picture Views"
                      >
                        <RotateCw size={20} />
                      </button>
                    )}

                    {/* End Call Button */}
                    <button
                      type="button"
                      onClick={endCall}
                      className="p-4 sm:p-4.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 transition-all cursor-pointer"
                      title="End Call"
                    >
                      <PhoneOff size={24} />
                    </button>
                  </div>
                )}

                {/* Subtitle / Zero-Firestore signaling note */}
                <p className="text-[9px] uppercase font-mono tracking-widest text-gray-500 text-center flex items-center justify-center gap-1.5">
                  <Sparkles size={11} className="text-dragon-cyan" />
                  Zero-Firestore Signal Push (WebRTC {isVideoCall ? `Adaptive ${resolution}` : 'Audio Direct'})
                </p>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </AudioCallContext.Provider>
  );
}
