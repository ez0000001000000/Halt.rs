import { HaltRestClient, Priority } from '../src/index';

describe('HaltRestClient', () => {
  let client: HaltRestClient;

  beforeEach(() => {
    client = new HaltRestClient('http://localhost:8080');
  });

  describe('Constructor', () => {
    test('should create client with default URL', () => {
      const defaultClient = new HaltRestClient();
      expect(defaultClient).toBeDefined();
    });

    test('should create client with custom URL', () => {
      const customClient = new HaltRestClient('http://custom:9000');
      expect(customClient).toBeDefined();
    });
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      // Mock axios for testing
      const mockResponse = { data: { status: 'healthy', version: '0.1.0' } };
      jest.spyOn(require('axios'), 'create').mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await client.healthCheck();
      expect(result).toEqual({ status: 'healthy', version: '0.1.0' });
    });
  });

  describe('Circuit Breaker', () => {
    test('should get breaker status', async () => {
      const mockResponse = {
        data: {
          from: 'AgentA',
          to: 'AgentB',
          calls_in_window: 2,
          window_start: '2024-01-01T00:00:00Z',
          is_tripped: false,
        },
      };
      jest.spyOn(require('axios'), 'create').mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await client.getBreakerStatus('AgentA', 'AgentB');
      expect(result.from).toBe('AgentA');
      expect(result.to).toBe('AgentB');
      expect(result.is_tripped).toBe(false);
    });

    test('should register call', async () => {
      const mockResponse = { data: { status: 'registered' } };
      jest.spyOn(require('axios'), 'create').mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await client.registerCall('AgentA', 'AgentB', false);
      expect(result.status).toBe('registered');
    });
  });

  describe('Queue Management', () => {
    test('should push task', async () => {
      const mockResponse = { data: { status: 'enqueued', task_id: 'task-123' } };
      jest.spyOn(require('axios'), 'create').mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await client.pushTask('TestTask', Priority.HIGH, '{"data": "test"}');
      expect(result.status).toBe('enqueued');
      expect(result.task_id).toBe('task-123');
    });

    test('should pop task', async () => {
      const mockTask = {
        id: 'task-123',
        name: 'TestTask',
        priority: Priority.HIGH,
        payload: '{"data": "test"}',
        created_at: '2024-01-01T00:00:00Z',
      };
      const mockResponse = { data: mockTask };
      jest.spyOn(require('axios'), 'create').mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await client.popTask();
      expect(result).toEqual(mockTask);
    });

    test('should return null when queue empty', async () => {
      const mockError = { response: { status: 404 } };
      jest.spyOn(require('axios'), 'create').mockReturnValue({
        post: jest.fn().mockRejectedValue(mockError),
      });

      const result = await client.popTask();
      expect(result).toBeNull();
    });
  });

  describe('Audit Logging', () => {
    test('should log interaction', async () => {
      const mockResponse = { data: { status: 'logged' } };
      jest.spyOn(require('axios'), 'create').mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await client.logInteraction('AgentA', 'AgentB', ['token1']);
      expect(result.status).toBe('logged');
    });

    test('should get topology', async () => {
      const mockTopology = {
        nodes: [{ id: 'AgentA', type: 'agent' as const, connections: ['AgentB'], last_seen: '2024-01-01T00:00:00Z' }],
        edges: [{ from: 'AgentA', to: 'AgentB', weight: 1, last_interaction: '2024-01-01T00:00:00Z' }],
        timestamp: '2024-01-01T00:00:00Z',
      };
      const mockResponse = { data: mockTopology };
      jest.spyOn(require('axios'), 'create').mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await client.getTopology();
      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toHaveLength(1);
    });
  });

  describe('WebSocket', () => {
    test('should create WebSocket connection', () => {
      const mockWebSocket = { onmessage: jest.fn(), onerror: jest.fn() };
      global.WebSocket = jest.fn().mockImplementation(() => mockWebSocket) as any;

      const ws = client.connectWebSocket(() => {});
      expect(ws).toBeDefined();
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8080/ws');
    });
  });
});
