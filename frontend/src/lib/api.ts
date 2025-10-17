const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  _id: string;
  roomId: string;
  name: string;
  participants: User[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  success: boolean;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('accessToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('accessToken');
  }

  // Auth endpoints
  async signup(username: string, email: string, password: string): Promise<ApiResponse<User>> {
    return this.request('/users/user-signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> {
    const response = await this.request<{ user: User; accessToken: string; refreshToken: string }>('/users/user-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
    }
    
    return response;
  }

  // Room endpoints
  async createRoom(name: string): Promise<ApiResponse<Room>> {
    return this.request('/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async joinRoom(roomCode: string): Promise<ApiResponse<Room>> {
    return this.request('/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode }),
    });
  }

  async getUserRooms(): Promise<ApiResponse<Room[]>> {
    return this.request('/rooms');
  }

  // Board endpoints
  async getBoard(roomId: string): Promise<ApiResponse<any>> {
    return this.request(`/boards/${roomId}`);
  }

  // Chat endpoints
  async getRoomMessages(roomId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/chat/${roomId}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);