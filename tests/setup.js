/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Suppress console output during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error // Keep errors visible
  };
}

// Test utilities
global.TestUtils = {
  // Mock WebSocket for testing
  mockWebSocket: () => {
    const mockWs = {
      readyState: 1, // OPEN
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    return mockWs;
  },

  // Generate test data
  generateSwarmData: (overrides = {}) => ({
    id: 'test_swarm_123',
    name: 'Test Swarm',
    topology: 'hierarchical',
    agentCount: 2,
    status: 'active',
    ...overrides
  }),

  generateAgentData: (overrides = {}) => ({
    id: 'test_agent_456',
    name: 'Test Agent',
    type: 'coordinator',
    status: 'active',
    capabilities: ['test-capability'],
    ...overrides
  }),

  generateTaskData: (overrides = {}) => ({
    id: 'test_task_789',
    name: 'Test Task',
    priority: 'medium',
    status: 'pending',
    progress: 0,
    ...overrides
  }),

  // Test server helpers
  createTestServer: async (port = 0) => {
    const SwarmVisualizationServer = require('../swarm-vis-server');
    const server = new SwarmVisualizationServer(port);

    // Don't actually start the server in tests
    server.start = jest.fn();

    return server;
  },

  // Wait for async operations
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Global test hooks
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});