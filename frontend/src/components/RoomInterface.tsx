import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Zap, LogOut, Moon, Sun, Users, Copy, Check, ArrowLeft } from 'lucide-react';
import { supabase, Room, Profile } from '../lib/supabase';

type RoomInterfaceProps = {
  roomId: string;
  onLeave: () => void;
};

export const RoomInterface = ({ roomId, onLeave }: RoomInterfaceProps) => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadRoomData();
    loadParticipants();

    const participantsChannel = supabase
      .channel(`room_${roomId}_participants`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      participantsChannel.unsubscribe();
    };
  }, [roomId]);

  const loadRoomData = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('Error loading room:', error);
      return;
    }
    setRoom(data);
  };

  const loadParticipants = async () => {
    const { data, error } = await supabase
      .from('room_participants')
      .select('user_id')
      .eq('room_id', roomId);

    if (error) {
      console.error('Error loading participants:', error);
      return;
    }

    const userIds = data.map((p) => p.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error loading profiles:', error);
      return;
    }

    setParticipants(profiles || []);
  };

  const handleCopyCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveRoom = async () => {
    await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', profile?.id);

    onLeave();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 flex flex-col">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLeaveRoom}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <Zap className="w-8 h-8 text-blue-600 dark:text-cyan-400" />
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {room?.name || 'Loading...'}
                </span>
                {room?.room_code && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {room.room_code}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-300" />
                )}
              </button>
              <button
                onClick={signOut}
                className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex">
        <aside className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Participants ({participants.length})
            </h2>
          </div>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 dark:from-cyan-500 dark:to-cyan-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {participant.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {participant.username}
                    {participant.id === profile?.id && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(You)</span>
                    )}
                  </p>
                  {participant.id === room?.owner_id && (
                    <p className="text-xs text-blue-600 dark:text-cyan-400">Owner</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center transition-colors duration-300">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 dark:from-cyan-500 dark:to-cyan-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Canvas Placeholder
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                This is where the collaborative whiteboard will appear. Start brainstorming with your team at lightning speed!
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
