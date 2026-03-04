# halt-js

TypeScript/JavaScript client for **Halt.rs** - Multi-Agent Proxy for Swarm Control

[![npm version](https://badge.fury.io/js/halt-js.svg)](https://badge.fury.io/js/halt-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install halt-js
```

## Quick Start

```typescript
import { HaltRestClient, Priority } from 'halt-js';

const client = new HaltRestClient('http://localhost:8080');

// Health check
const health = await client.healthCheck();
console.log(health); // { status: 'healthy', version: '0.1.0' }

// Circuit breaker
const status = await client.getBreakerStatus('AgentA', 'AgentB');
await client.registerCall('AgentA', 'AgentB', false);

// Queue management
await client.pushTask('ProcessData', Priority.HIGH, '{"data": "value"}');
const task = await client.popTask();

// Audit logging
await client.logInteraction('AgentA', 'AgentB', ['token1', 'token2']);
const topology = await client.getTopology();

// Real-time updates
const ws = client.connectWebSocket((data) => {
  console.log('Topology update:', data);
});
```

## API Reference

### HaltRestClient

#### Constructor

```typescript
new HaltRestClient(baseUrl?: string)
```

- `baseUrl`: Halt.rs server URL (default: 'http://localhost:8080')

#### Methods

##### Health Check
```typescript
healthCheck(): Promise<{ status: string; version: string }>
```

##### Circuit Breaker
```typescript
getBreakerStatus(from: string, to: string): Promise<CircuitBreakerStatus>
registerCall(from: string, to: string, isTerminal: boolean): Promise<{ status: string }>
```

##### Queue Management
```typescript
pushTask(name: string, priority: Priority, payload: string): Promise<{ status: string; task_id: string }>
popTask(): Promise<Task | null>
```

##### Audit Logging
```typescript
logInteraction(from: string, to: string, tokenPath: string[]): Promise<{ status: string }>
getTopology(): Promise<Topology>
```

##### Real-time Updates
```typescript
connectWebSocket(onMessage: (data: any) => void): WebSocket
```

## Types

```typescript
enum Priority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2
}

interface Task {
  id: string;
  name: string;
  priority: Priority;
  payload: string;
  created_at: string;
}

interface CircuitBreakerStatus {
  from: string;
  to: string;
  calls_in_window: number;
  window_start: string;
  is_tripped: boolean;
  last_trip?: string;
}

interface Topology {
  nodes: TopologyNode[];
  edges: Array<{
    from: string;
    to: string;
    weight: number;
    last_interaction: string;
  }>;
  timestamp: string;
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint

# Format
npm run format
```

## License

MIT - see [LICENSE](LICENSE) file for details.

## Links

- [Halt.rs Repository](https://github.com/ez0000001000000/Halt.rs)
- [Documentation](https://github.com/ez0000001000000/Halt.rs#readme)
- [API Reference](https://github.com/ez0000001000000/Halt.rs/docs/api/api.md)
