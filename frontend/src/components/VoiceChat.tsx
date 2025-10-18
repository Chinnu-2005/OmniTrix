import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play } from 'lucide-react';
import { socketClient } from '../lib/socket';
import { useAuth } from '../contexts/AuthContext';

interface VoiceChatProps {
  roomId: string;
  participants: any[];
}

interface SenderQueue {
  nextPlayTime: number;
  buffers: AudioBuffer[];
}

export const VoiceChat = ({ roomId, participants }: VoiceChatProps) => {
  const { user } = useAuth();
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const senderQueuesRef = useRef<Map<string, SenderQueue>>(new Map());
  const processedChunksRef = useRef<Set<string>>(new Set());
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);
  const isSpeakerOnRef = useRef(true);

  // Update refs when state changes
  useEffect(() => {
    isSpeakerOnRef.current = isSpeakerOn;
  }, [isSpeakerOn]);

  useEffect(() => {
    isRecordingRef.current = isMicOn;
  }, [isMicOn]);

  const schedulePlayback = useCallback((senderId: string, audioBuffer: AudioBuffer) => {
    if (!audioContextRef.current || !isSpeakerOnRef.current) {
      console.log('🔇 Skipping playback - no context or speaker off');
      return;
    }
    
    const audioContext = audioContextRef.current;
    const currentTime = audioContext.currentTime;
    
    let queue = senderQueuesRef.current.get(senderId);
    if (!queue) {
      queue = { nextPlayTime: currentTime, buffers: [] };
      senderQueuesRef.current.set(senderId, queue);
    }
    
    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.8; // Slightly reduce volume to prevent distortion
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Improved scheduling with small buffer
    const playTime = Math.max(queue.nextPlayTime, currentTime + 0.02);
    source.start(playTime);
    
    queue.nextPlayTime = playTime + audioBuffer.duration;
    
    console.log(`🔊 Scheduled playback for ${senderId} at ${playTime.toFixed(3)}s`);
  }, []);

  const handleVoiceChunk = useCallback(async (data: { from: string; username: string; chunk: ArrayBuffer; timestamp?: number }) => {
    // ONLY check: audio enabled, speaker on (from ref), not from self, valid chunk
    if (!audioEnabled || !isSpeakerOnRef.current || data.from === user?._id || !data.chunk || data.chunk.byteLength === 0) {
      console.log('🔇 Ignoring chunk - speaker off or invalid data');
      return;
    }
    
    // Prevent duplicate processing
    const chunkId = `${data.from}-${data.timestamp || Date.now()}-${data.chunk.byteLength}`;
    if (processedChunksRef.current.has(chunkId)) {
      return;
    }
    processedChunksRef.current.add(chunkId);
    
    // Clean old chunk IDs
    if (processedChunksRef.current.size > 100) {
      const entries = Array.from(processedChunksRef.current);
      entries.slice(0, 50).forEach(id => processedChunksRef.current.delete(id));
    }
    
    console.log(`📥 Playing chunk from ${data.username} (${data.chunk.byteLength} bytes)`);
    
    try {
      if (!audioContextRef.current) return;
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(data.chunk.slice());
      schedulePlayback(data.from, audioBuffer);
      
      setActiveUsers(prev => {
        if (!prev.includes(data.from)) {
          return [...prev, data.from];
        }
        return prev;
      });
      
      setTimeout(() => {
        setActiveUsers(prev => prev.filter(id => id !== data.from));
      }, 600);
      
    } catch (error) {
      console.error('❌ Audio decode failed:', error);
    }
  }, [audioEnabled, user?._id, schedulePlayback]);

  const handleVoiceToggle = useCallback((data: { userId: string; isActive: boolean; username: string }) => {
    if (data.userId === user?._id) return;
    
    if (data.isActive) {
      setActiveUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
    } else {
      setActiveUsers(prev => prev.filter(id => id !== data.userId));
    }
  }, [user?._id]);

  useEffect(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    socket.on('voice-chunk', handleVoiceChunk);
    socket.on('voice-toggle', handleVoiceToggle);

    return () => {
      socket.off('voice-chunk', handleVoiceChunk);
      socket.off('voice-toggle', handleVoiceToggle);
    };
  }, [handleVoiceChunk, handleVoiceToggle]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const enableAudio = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;
      setAudioEnabled(true);
      console.log('✅ Audio enabled');
    } catch (error) {
      console.error('❌ Audio enable failed:', error);
    }
  };

  const startMicrophone = useCallback(async () => {
    if (isMicOn || !audioEnabled) {
      console.log('🎤 Mic already on or audio not enabled');
      return;
    }
    
    try {
      console.log('🎤 Starting microphone...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });
      
      localStreamRef.current = stream;
      
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus', 
        'audio/webm'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType || undefined,
        audioBitsPerSecond: 64000 // Lower bitrate for better transmission
      });
      
      mediaRecorderRef.current = mediaRecorder;

      let chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && isRecordingRef.current) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (chunks.length > 0 && isRecordingRef.current) {
          const blob = new Blob(chunks, { type: selectedMimeType });
          const arrayBuffer = await blob.arrayBuffer();
          const timestamp = Date.now();
          
          socketClient.getSocket()?.emit('voice-chunk', {
            roomId,
            chunk: arrayBuffer,
            timestamp
          });
          console.log(`📤 Sent chunk (${arrayBuffer.byteLength} bytes)`);
        }
        chunks = [];
      };

      // Record every 250ms for good quality/latency balance
      recordIntervalRef.current = setInterval(() => {
        if (!isRecordingRef.current) {
          return;
        }
        
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        if (mediaRecorder.state === 'inactive' && isRecordingRef.current) {
          mediaRecorder.start();
        }
      }, 250);
      
      mediaRecorder.start();
      setIsMicOn(true);
      socketClient.getSocket()?.emit('voice-toggle', { roomId, isActive: true });
      console.log('✅ Microphone started');
      
    } catch (error) {
      console.error('❌ Microphone failed:', error);
      setIsMicOn(false);
    }
  }, [isMicOn, audioEnabled, roomId]);

  const stopMicrophone = useCallback(() => {
    if (!isMicOn) {
      console.log('🎤 Mic already off');
      return;
    }
    
    console.log('🛑 Stopping microphone...');
    setIsMicOn(false);
    
    // Clear recording interval
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      if (recorder.state === 'recording') {
        recorder.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    // Stop media stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }
    
    // Notify others
    socketClient.getSocket()?.emit('voice-toggle', { roomId, isActive: false });
    console.log('✅ Microphone stopped');
  }, [isMicOn, roomId]);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2 z-40">
      {!audioEnabled && (
        <button
          onClick={enableAudio}
          className="p-3 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white transition-all duration-200"
          title="Enable Audio"
        >
          <Play className="w-5 h-5" />
        </button>
      )}
      
      {audioEnabled && (
        <>
          <button
            onClick={() => {
              console.log(`🔊 Speaker toggle: ${isSpeakerOn} -> ${!isSpeakerOn}`);
              setIsSpeakerOn(!isSpeakerOn);
            }}
            className={`p-3 rounded-full transition-all duration-200 relative ${
              isSpeakerOn
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
            disabled={!audioEnabled}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            {isSpeakerOn && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />}
          </button>

          <button
            onClick={() => {
              console.log(`🎤 Mic toggle: ${isMicOn} -> ${!isMicOn}`);
              if (isMicOn) {
                stopMicrophone();
              } else {
                startMicrophone();
              }
            }}
            className={`p-3 rounded-full transition-all duration-200 relative ${
              isMicOn
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={isMicOn ? 'Stop Talking' : 'Start Talking'}
            disabled={!audioEnabled}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            {isMicOn && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />}
          </button>
        </>
      )}

      {activeUsers.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {activeUsers.length} speaking
          </span>
        </div>
      )}
    </div>
  );
};