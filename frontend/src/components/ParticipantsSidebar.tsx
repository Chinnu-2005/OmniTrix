import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { socketClient } from '../lib/socket';

interface Participant {
  _id: string;
  username: string;
  avatar?: string;
}

interface ParticipantsSidebarProps {
  participants: Participant[];
  roomId: string;
}

export const ParticipantsSidebar = ({ participants, roomId }: ParticipantsSidebarProps) => {
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    const handleVoiceToggle = (data: { userId: string; isActive: boolean }) => {
      setSpeakingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isActive) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };

    const handleVoiceChunk = (data: { from: string }) => {
      setSpeakingUsers(prev => new Set(prev).add(data.from));
      setTimeout(() => {
        setSpeakingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.from);
          return newSet;
        });
      }, 500);
    };

    socket.on('voice-toggle', handleVoiceToggle);
    socket.on('voice-chunk', handleVoiceChunk);

    return () => {
      socket.off('voice-toggle', handleVoiceToggle);
      socket.off('voice-chunk', handleVoiceChunk);
    };
  }, [roomId]);

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Participants ({participants.length})
      </h3>
      
      <div className="space-y-2">
        {participants.map((participant) => (
          <div
            key={participant._id}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
              speakingUsers.has(participant._id)
                ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700'
                : 'bg-gray-50 dark:bg-gray-700'
            }`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {participant.username.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {participant.username}
              </div>
            </div>
            
            <div className="flex items-center">
              {speakingUsers.has(participant._id) ? (
                <Mic className="w-4 h-4 text-green-600 dark:text-green-400 animate-pulse" />
              ) : (
                <MicOff className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};