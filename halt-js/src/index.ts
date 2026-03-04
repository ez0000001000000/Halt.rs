import axios, { AxiosInstance } from 'axios';

export enum Priority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2
}

export interface Task {
  id: string;
  name: string;
  priority: Priority;
  payload: string;
  created_at: string;
}

export interface CircuitBreakerStatus {
  from: string;
  to: string;
  calls_in_window: number;
  window_start: string;
  is_tripped: boolean;
  last_trip?: string;
}

export interface Interaction {
  from: string;
  to: string;
  token_path: string[];
  timestamp: string;
}

export interface TopologyNode {
  id: string;
  type: 'agent' | 'endpoint';
  connections: string[];
  last_seen: string;
}

export interface Topology {
  nodes: TopologyNode[];
  edges: Array<{
    from: string;
    to: string;
    weight: number;
    last_interaction: string;
  }>;
  timestamp: string;
}

export class HaltRestClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Circuit Breaker
  async getBreakerStatus(from: string, to: string): Promise<CircuitBreakerStatus> {
    const response = await this.client.get(`/api/v1/circuit-breaker/${from}/${to}`);
    return response.data;
  }

  async registerCall(from: string, to: string, isTerminal: boolean): Promise<{ status: string }> {
    const response = await this.client.post(`/api/v1/circuit-breaker/${from}/${to}`, {
      is_terminal: isTerminal,
    });
    return response.data;
  }

  // Backpressure Queue
  async pushTask(name: string, priority: Priority, payload: string): Promise<{ status: string; task_id: string }> {
    const response = await this.client.post('/api/v1/queue/push', {
      name,
      priority,
      payload,
    });
    return response.data;
  }

  async popTask(): Promise<Task | null> {
    try {
      const response = await this.client.post('/api/v1/queue/pop');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Queue empty
      }
      throw error;
    }
  }

  // Audit Logging
  async logInteraction(from: string, to: string, tokenPath: string[]): Promise<{ status: string }> {
    const response = await this.client.post('/api/v1/interactions', {
      from,
      to,
      token_path: tokenPath,
    });
    return response.data;
  }

  async getTopology(): Promise<Topology> {
    const response = await this.client.get('/api/v1/topology');
    return response.data;
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage: (data: any) => void): WebSocket {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/ws';
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return ws;
  }
}

export default HaltRestClient;
