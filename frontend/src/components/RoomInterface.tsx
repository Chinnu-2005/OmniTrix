import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Zap, LogOut, Moon, Sun, Users, Copy, Check, ArrowLeft, MessageCircle, X, Send, Download, FileImage, FileText, User as UserIcon, Camera } from 'lucide-react';
import { apiClient, Room, User } from '../lib/api';
import { socketClient } from '../lib/socket';
import { Whiteboard } from './Whiteboard';
import { Chat } from './Chat';

type RoomInterfaceProps = {
  roomId: string;
  onLeave: () => void;
};

export const RoomInterface = ({ roomId, onLeave }: RoomInterfaceProps) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadRoomData(), loadMessages()]);
      setIsLoading(false);
    };
    loadData();
    
    // Ensure socket is connected and join the room
    const socket = socketClient.getSocket();
    if (socket && socket.connected) {
      console.log('Socket already connected, joining room:', roomId);
      socketClient.joinRoom(roomId);
    } else {
      console.log('Socket not connected, waiting for connection...');
      // Wait for socket connection then join room
      const checkConnection = setInterval(() => {
        const currentSocket = socketClient.getSocket();
        if (currentSocket && currentSocket.connected) {
          console.log('Socket connected, joining room:', roomId);
          socketClient.joinRoom(roomId);
          clearInterval(checkConnection);
        }
      }, 100);
      
      // Clear interval after 5 seconds to prevent infinite checking
      setTimeout(() => clearInterval(checkConnection), 5000);
    }
    
    // Close menus when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu) {
        setShowExportMenu(false);
      }
      if (showProfileMenu) {
        setShowProfileMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roomId, showExportMenu, showProfileMenu]);

  // Separate useEffect for socket listeners to prevent duplicate listeners
  useEffect(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    const handleUserJoined = (data: any) => {
      console.log('User joined:', data);
      loadRoomData();
    };
    
    const handleUserLeft = (data: any) => {
      console.log('User left:', data);
      loadRoomData();
    };
    
    const handleChatMessage = (message: any) => {
      console.log('💬 Received chat message:', message);
      setMessages(prev => {
        // Prevent duplicate messages by checking if message already exists
        const exists = prev.some(msg => msg._id === message._id);
        if (exists) {
          console.log('⚠️ Duplicate message detected, ignoring');
          return prev;
        }
        console.log('✅ Adding new message to state');
        return [...prev, message];
      });
    };

    // Set up socket listeners
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('chat-message', handleChatMessage);
    
    // Cleanup listeners on unmount or roomId change
    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('chat-message', handleChatMessage);
    };
  }, [roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRoomData = async () => {
    try {
      // Check cache first
      const cachedRooms = sessionStorage.getItem('userRooms');
      if (cachedRooms) {
        const rooms = JSON.parse(cachedRooms);
        const foundRoom = rooms.find((r: Room) => r.roomId === roomId);
        if (foundRoom) {
          setRoom(foundRoom);
          setParticipants(foundRoom.participants || []);
        }
      }

      const response = await apiClient.getUserRooms();
      if (response.success) {
        // Cache the rooms data
        sessionStorage.setItem('userRooms', JSON.stringify(response.data));
        
        const foundRoom = response.data.find(r => r.roomId === roomId);
        if (foundRoom) {
          setRoom(foundRoom);
          setParticipants(foundRoom.participants || []);
        }
      }
    } catch (error) {
      console.error('Error loading room:', error);
    }
  };

  const loadMessages = async () => {
    try {
      // Check cache first
      const cachedMessages = sessionStorage.getItem(`messages-${roomId}`);
      if (cachedMessages) {
        setMessages(JSON.parse(cachedMessages));
      }

      const response = await apiClient.getRoomMessages(roomId);
      if (response.success) {
        setMessages(response.data);
        // Cache messages
        sessionStorage.setItem(`messages-${roomId}`, JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleCopyCode = () => {
    if (room?.roomId) {
      navigator.clipboard.writeText(room.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveRoom = async () => {
    // Clear cache when leaving room to ensure fresh data on return
    sessionStorage.removeItem(`board-${roomId}`);
    sessionStorage.removeItem(`messages-${roomId}`);
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
                {room?.roomId && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {room.roomId}
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
              {/* Export Dropdown - Miro Style */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-white"
                  title="Export"
                >
                  <Download className="w-5 h-5" />
                </button>
                
                {showExportMenu && (
                  <div 
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="py-2">
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('PNG export clicked');
                          const canvases = document.querySelectorAll('canvas');
                          console.log('Found canvases:', canvases.length);
                          const canvas = canvases[0] as HTMLCanvasElement;
                          if (canvas) {
                            console.log('Canvas dimensions:', canvas.width, canvas.height);
                            const dataURL = canvas.toDataURL('image/png');
                            console.log('DataURL length:', dataURL.length);
                            const link = document.createElement('a');
                            link.href = dataURL;
                            link.download = 'whiteboard.png';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            console.log('Download triggered');
                          } else {
                            console.log('No canvas found');
                          }
                          setShowExportMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FileImage className="w-4 h-4" />
                        Export as PNG
                      </button>
                      <button
                        type="button"
                        onMouseDown={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('PDF export clicked');
                          const canvas = document.querySelector('canvas') as HTMLCanvasElement;
                          if (canvas) {
                            try {
                              const { jsPDF } = await import('jspdf');
                              console.log('jsPDF loaded');
                              const pdf = new jsPDF();
                              const imgData = canvas.toDataURL('image/png');
                              pdf.addImage(imgData, 'PNG', 10, 10, 180, 160);
                              pdf.save('whiteboard.pdf');
                              console.log('PDF saved');
                            } catch (error) {
                              console.error('PDF export error:', error);
                            }
                          }
                          setShowExportMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FileText className="w-4 h-4" />
                        Export as PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Participants Avatars - Miro Style */}
              <div className="flex items-center -space-x-2">
                {participants.slice(0, 3).map((participant, index) => (
                  <div
                    key={participant._id}
                    className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 text-white text-xs font-medium"
                    title={participant.username}
                    style={{ zIndex: 10 - index }}
                  >
                    {participant.username.charAt(0).toUpperCase()}
                  </div>
                ))}
                {participants.length > 3 && (
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 text-white text-xs font-medium">
                    +{participants.length - 3}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  showChat 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                title="Toggle Chat"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
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
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-medium hover:from-blue-600 hover:to-blue-800 transition-colors"
                  title={user?.username}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user?.username?.charAt(0).toUpperCase()
                  )}
                </button>
                
                {showProfileMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-medium">
                            {user?.avatar ? (
                              <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              user?.username?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                            <Camera className="w-3 h-3 text-white" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const formData = new FormData();
                                  formData.append('avatar', file);
                                  try {
                                    await apiClient.updateProfile(formData);
                                    window.location.reload();
                                  } catch (error) {
                                    console.error('Avatar update failed:', error);
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{user?.username}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          signOut();
                          setShowProfileMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex relative">
        <main className="flex-1 flex">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading whiteboard...</p>
              </div>
            </div>
          ) : (
            <Whiteboard roomId={roomId} />
          )}
        </main>
        
        {/* Chat Sidebar */}
        {showChat && (
          <aside className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message._id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {message.sender.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">
                    {message.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newMessage.trim()) {
                      const messageText = newMessage.trim();
                      socketClient.sendChatMessage({ text: messageText });
                      setNewMessage('');
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
                <button 
                  onClick={() => {
                    const messageText = newMessage.trim();
                    if (messageText) {
                      socketClient.sendChatMessage({ text: messageText });
                      setNewMessage('');
                    }
                  }}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
