import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomCode: string) {
    if (this.socket) {
      this.socket.emit('join-room', roomCode);
    }
  }

  sendDrawingUpdate(data: any) {
    if (this.socket) {
      this.socket.emit('drawing-update', data);
    }
  }

  sendChatMessage(message: { text: string }) {
    if (this.socket) {
      this.socket.emit('chat-message', message);
    }
  }

  toggleVoice(isEnabled: boolean) {
    if (this.socket) {
      this.socket.emit('voice-toggle', { isEnabled });
    }
  }

  onUserJoined(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  onUserLeft(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user-left', callback);
    }
  }

  onDrawingUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('drawing-update', callback);
    }
  }

  onChatMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('chat-message', callback);
    }
  }

  onVoiceToggle(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('voice-toggle', callback);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketClient = new SocketClient();