/**
 * TDD Tests for SwarmVisualizationServer
 * Following Red-Green-Refactor methodology
 */

const SwarmVisualizationServer = require('../../swarm-vis-server');

describe('SwarmVisualizationServer', () => {
  let server;

  beforeEach(async () => {
    server = await TestUtils.createTestServer();
  });

  afterEach(() => {
    if (server) {
      server.clients?.forEach(client => client.close?.());
    }
  });

  describe('Initialization', () => {
    test('should create server instance with default port 8080', () => {
      const defaultServer = new SwarmVisualizationServer();
      expect(defaultServer.port).toBe(8080);
    });

    test('should create server with custom port', () => {
      const customServer = new SwarmVisualizationServer(9090);
      expect(customServer.port).toBe(9090);
    });

    test('should initialize empty graph state', () => {
      expect(server.graph).toMatchObject({
        nodes: [],
        edges: [],
        metrics: {},
        timestamp: expect.any(Date)
      });
    });

    test('should initialize empty client set', () => {
      expect(server.clients).toBeInstanceOf(Set);
      expect(server.clients.size).toBe(0);
    });
  });

  describe('Node Management - TDD', () => {
    describe('addNode', () => {
      test('should add swarm node with correct properties', () => {
        // Red: Test fails initially
        const swarmData = TestUtils.generateSwarmData();

        const node = server.addNode('Swarm', swarmData);

        expect(node).toMatchObject({
          id: swarmData.id,
          type: 'Swarm',
          label: swarmData.name,
          timestamp: expect.any(Date)
        });
        expect(server.graph.nodes).toContain(node);
      });

      test('should add agent node with capabilities', () => {
        const agentData = TestUtils.generateAgentData({
          capabilities: ['TDD-design', 'coordination']
        });

        const node = server.addNode('Agent', agentData);

        expect(node.capabilities).toEqual(['TDD-design', 'coordination']);
        expect(node.type).toBe('Agent');
      });

      test('should replace existing node when adding with same id', () => {
        const taskData = TestUtils.generateTaskData();

        const node1 = server.addNode('Task', taskData);
        const node2 = server.addNode('Task', { ...taskData, status: 'completed' });

        expect(server.graph.nodes.length).toBe(1);
        expect(server.graph.nodes[0].status).toBe('completed');
      });

      test('should generate default id if not provided', () => {
        const node = server.addNode('Task', { name: 'Test Task' });

        expect(node.id).toMatch(/Task_\d+/);
        expect(node.label).toBe('Test Task');
      });
    });

    describe('updateNode', () => {
      test('should update existing node properties', () => {
        const taskData = TestUtils.generateTaskData();
        const originalNode = server.addNode('Task', taskData);

        const updated = server.updateNode(taskData.id, {
          status: 'completed',
          progress: 100
        });

        expect(updated.status).toBe('completed');
        expect(updated.progress).toBe(100);
        expect(updated.updated).toBeInstanceOf(Date);
      });

      test('should return null for non-existent node', () => {
        const result = server.updateNode('non_existent_id', { status: 'test' });
        expect(result).toBeNull();
      });
    });
  });

  describe('Edge Management - TDD', () => {
    describe('addEdge', () => {
      test('should create orchestration relationship', () => {
        const swarmData = TestUtils.generateSwarmData();
        const agentData = TestUtils.generateAgentData();

        server.addNode('Swarm', swarmData);
        server.addNode('Agent', agentData);

        const edge = server.addEdge('ORCHESTRATES', swarmData.id, agentData.id, {
          role: 'coordinator'
        });

        expect(edge).toMatchObject({
          id: `${swarmData.id}_ORCHESTRATES_${agentData.id}`,
          type: 'ORCHESTRATES',
          from: swarmData.id,
          to: agentData.id,
          role: 'coordinator',
          timestamp: expect.any(Date)
        });
      });

      test('should create execution relationship', () => {
        const agentData = TestUtils.generateAgentData();
        const taskData = TestUtils.generateTaskData();

        const edge = server.addEdge('EXECUTES', agentData.id, taskData.id, {
          startTime: new Date()
        });

        expect(edge.type).toBe('EXECUTES');
        expect(edge.startTime).toBeInstanceOf(Date);
      });

      test('should replace existing edge with same id', () => {
        const from = 'agent_1';
        const to = 'task_1';

        const edge1 = server.addEdge('EXECUTES', from, to, { progress: 50 });
        const edge2 = server.addEdge('EXECUTES', from, to, { progress: 75 });

        expect(server.graph.edges.length).toBe(1);
        expect(server.graph.edges[0].progress).toBe(75);
      });
    });
  });

  describe('Claude Flow Event Ingestion - TDD', () => {
    describe('ingestClaudeFlowEvent', () => {
      test('should handle swarm_init event', () => {
        const eventData = {
          type: 'swarm_init',
          data: TestUtils.generateSwarmData()
        };

        const emitSpy = jest.spyOn(server, 'emit');

        server.ingestClaudeFlowEvent(eventData);

        expect(emitSpy).toHaveBeenCalledWith('swarm:created', eventData.data);
      });

      test('should handle agent_spawn event', () => {
        const eventData = {
          type: 'agent_spawn',
          data: TestUtils.generateAgentData()
        };

        const emitSpy = jest.spyOn(server, 'emit');

        server.ingestClaudeFlowEvent(eventData);

        expect(emitSpy).toHaveBeenCalledWith('agent:spawned', eventData.data);
      });

      test('should handle task_orchestrate event', () => {
        const eventData = {
          type: 'task_orchestrate',
          data: TestUtils.generateTaskData()
        };

        const emitSpy = jest.spyOn(server, 'emit');

        server.ingestClaudeFlowEvent(eventData);

        expect(emitSpy).toHaveBeenCalledWith('task:created', eventData.data);
      });

      test('should handle unknown event types gracefully', () => {
        const eventData = {
          type: 'unknown_event',
          data: { test: 'data' }
        };

        expect(() => {
          server.ingestClaudeFlowEvent(eventData);
        }).not.toThrow();
      });
    });
  });

  describe('Metrics Calculation - TDD', () => {
    beforeEach(() => {
      // Setup test graph with known data
      server.addNode('Swarm', TestUtils.generateSwarmData());
      server.addNode('Agent', TestUtils.generateAgentData({ status: 'active' }));
      server.addNode('Task', TestUtils.generateTaskData({ status: 'executing' }));
      server.addNode('Task', TestUtils.generateTaskData({
        id: 'completed_task',
        status: 'completed',
        duration: 100
      }));
      server.addEdge('ORCHESTRATES', 'test_swarm_123', 'test_agent_456');
    });

    test('should calculate correct node counts by type', () => {
      const metrics = server.calculateMetrics();

      expect(metrics.graph.totalNodes).toBe(4);
      expect(metrics.graph.nodesByType).toMatchObject({
        Swarm: 1,
        Agent: 1,
        Task: 2
      });
    });

    test('should calculate correct edge counts', () => {
      const metrics = server.calculateMetrics();

      expect(metrics.graph.totalEdges).toBe(1);
      expect(metrics.graph.edgesByType).toMatchObject({
        ORCHESTRATES: 1
      });
    });

    test('should calculate performance metrics', () => {
      const metrics = server.calculateMetrics();

      expect(metrics.performance).toMatchObject({
        activeTasks: 1, // executing task
        completedTasks: 1, // completed task
        activeAgents: 1, // active agent
        avgTaskDuration: 100 // from completed task
      });
    });

    test('should calculate connectivity metrics', () => {
      const metrics = server.calculateMetrics();

      expect(metrics.connectivity).toMatchObject({
        avgDegree: expect.any(Number),
        clustering: expect.any(Number),
        components: expect.any(Number)
      });
    });
  });

  describe('WebSocket Communication - TDD', () => {
    test('should broadcast message to all connected clients', () => {
      const mockClient1 = TestUtils.mockWebSocket();
      const mockClient2 = TestUtils.mockWebSocket();

      server.clients.add(mockClient1);
      server.clients.add(mockClient2);

      server.broadcast('test_type', { test: 'data' });

      expect(mockClient1.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"test_type"')
      );
      expect(mockClient2.send).toHaveBeenCalledWith(
        expect.stringContaining('"test":"data"')
      );
    });

    test('should skip closed client connections', () => {
      const mockClient1 = TestUtils.mockWebSocket();
      const mockClient2 = { ...TestUtils.mockWebSocket(), readyState: 3 }; // CLOSED

      server.clients.add(mockClient1);
      server.clients.add(mockClient2);

      server.broadcast('test_type', { test: 'data' });

      expect(mockClient1.send).toHaveBeenCalled();
      expect(mockClient2.send).not.toHaveBeenCalled();
    });
  });

  describe('Graph Analytics - TDD', () => {
    test('should find connected components correctly', () => {
      // Create disconnected graph
      server.addNode('Agent', { id: 'agent_1' });
      server.addNode('Agent', { id: 'agent_2' });
      server.addNode('Agent', { id: 'agent_3' });
      server.addEdge('COLLABORATES', 'agent_1', 'agent_2');
      // agent_3 is disconnected

      const components = server.findConnectedComponents();

      expect(components).toBe(2); // Two components: {agent_1, agent_2} and {agent_3}
    });

    test('should calculate clustering coefficient', () => {
      server.addNode('Agent', { id: 'a1' });
      server.addNode('Agent', { id: 'a2' });
      server.addNode('Agent', { id: 'a3' });

      // Create triangle: a1-a2, a2-a3, a3-a1
      server.addEdge('COLLABORATES', 'a1', 'a2');
      server.addEdge('COLLABORATES', 'a2', 'a3');
      server.addEdge('COLLABORATES', 'a3', 'a1');

      const clustering = server.calculateClustering();

      expect(clustering).toBeGreaterThan(0);
    });

    test('should handle edge cases in graph metrics', () => {
      // Empty graph
      expect(server.calculateAvgDegree()).toBe(0);
      expect(server.findConnectedComponents()).toBe(0);
      expect(server.calculateClustering()).toBe(0);
    });
  });
});