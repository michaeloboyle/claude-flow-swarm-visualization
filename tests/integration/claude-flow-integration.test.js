/**
 * BDD Integration Tests for Claude Flow Integration
 * Testing real-world scenarios and user behaviors
 */

const SwarmVisualizationServer = require('../../swarm-vis-server');
const WebSocket = require('ws');

describe('Claude Flow Integration - BDD Scenarios', () => {
  let server;
  let port;

  beforeAll(async () => {
    // Find available port for testing
    port = 8090 + Math.floor(Math.random() * 100);
    server = new SwarmVisualizationServer(port);

    // Mock server.start to avoid actual server startup in tests
    const originalStart = server.start;
    server.start = jest.fn(() => {
      server.server = { listen: jest.fn() };
    });

    server.start();
  });

  afterAll(async () => {
    if (server?.server?.close) {
      server.server.close();
    }
  });

  describe('Feature: Swarm Lifecycle Visualization', () => {
    describe('Scenario: Complete swarm initialization and agent spawning', () => {
      test('Given a new swarm is created, When agents are spawned, Then visualization shows complete hierarchy', () => {
        // Given: New swarm initialization
        const swarmEvent = {
          type: 'swarm_init',
          data: {
            id: 'integration_swarm_001',
            name: 'Integration Test Swarm',
            topology: 'hierarchical',
            agentCount: 0,
            status: 'initializing'
          }
        };

        server.ingestClaudeFlowEvent(swarmEvent);

        // Verify swarm node created
        const swarmNode = server.graph.nodes.find(n => n.id === 'integration_swarm_001');
        expect(swarmNode).toBeDefined();
        expect(swarmNode.type).toBe('Swarm');

        // When: Agents are spawned
        const architectEvent = {
          type: 'agent_spawn',
          data: {
            id: 'architect_001',
            name: 'PKM-Architect',
            type: 'coordinator',
            status: 'active',
            swarmId: 'integration_swarm_001',
            capabilities: ['TDD-design', 'coordination', 'planning']
          }
        };

        const guardianEvent = {
          type: 'agent_spawn',
          data: {
            id: 'guardian_001',
            name: 'TDD-Guardian',
            type: 'tester',
            status: 'active',
            swarmId: 'integration_swarm_001',
            capabilities: ['test-validation', 'quality-assurance']
          }
        };

        server.ingestClaudeFlowEvent(architectEvent);
        server.ingestClaudeFlowEvent(guardianEvent);

        // Then: Complete hierarchy is visualized
        const architectNode = server.graph.nodes.find(n => n.id === 'architect_001');
        const guardianNode = server.graph.nodes.find(n => n.id === 'guardian_001');

        expect(architectNode).toMatchObject({
          type: 'Agent',
          name: 'PKM-Architect',
          status: 'active'
        });

        expect(guardianNode).toMatchObject({
          type: 'Agent',
          name: 'TDD-Guardian',
          status: 'active'
        });

        // Verify orchestration relationships
        const orchestrationEdges = server.graph.edges.filter(e => e.type === 'ORCHESTRATES');
        expect(orchestrationEdges.length).toBe(2);

        const architectEdge = orchestrationEdges.find(e => e.to === 'architect_001');
        const guardianEdge = orchestrationEdges.find(e => e.to === 'guardian_001');

        expect(architectEdge.from).toBe('integration_swarm_001');
        expect(guardianEdge.from).toBe('integration_swarm_001');
      });
    });

    describe('Scenario: Task orchestration and execution flow', () => {
      test('Given active agents, When tasks are orchestrated, Then execution flow is visualized', () => {
        // Given: Active agents from previous test
        const agentId = 'architect_001';

        // When: Task is orchestrated
        const taskEvent = {
          type: 'task_orchestrate',
          data: {
            id: 'task_tdd_setup',
            name: 'Setup TDD Infrastructure',
            priority: 'high',
            status: 'pending',
            description: 'Create comprehensive test framework'
          }
        };

        server.ingestClaudeFlowEvent(taskEvent);

        // And: Task is assigned to agent
        const assignmentEvent = {
          type: 'task_assign',
          data: {
            taskId: 'task_tdd_setup',
            agentId: agentId,
            startTime: new Date()
          }
        };

        server.ingestClaudeFlowEvent(assignmentEvent);

        // Then: Task node and execution relationship are created
        const taskNode = server.graph.nodes.find(n => n.id === 'task_tdd_setup');
        expect(taskNode).toMatchObject({
          type: 'Task',
          name: 'Setup TDD Infrastructure',
          priority: 'high',
          status: 'pending'
        });

        const executionEdge = server.graph.edges.find(e =>
          e.type === 'EXECUTES' &&
          e.from === agentId &&
          e.to === 'task_tdd_setup'
        );
        expect(executionEdge).toBeDefined();
        expect(executionEdge.startTime).toBeInstanceOf(Date);
      });
    });

    describe('Scenario: Real-time progress updates', () => {
      test('Given executing task, When progress updates occur, Then visualization reflects changes', async () => {
        const taskId = 'task_tdd_setup';

        // When: Progress updates are sent
        const progressUpdates = [25, 50, 75, 100];

        for (const progress of progressUpdates) {
          const progressEvent = {
            type: 'task_progress',
            data: {
              taskId,
              progress,
              status: progress < 100 ? 'executing' : 'completed'
            }
          };

          server.ingestClaudeFlowEvent(progressEvent);

          // Then: Task node reflects current progress
          const taskNode = server.graph.nodes.find(n => n.id === taskId);
          expect(taskNode.progress).toBe(progress);
          expect(taskNode.status).toBe(progress < 100 ? 'executing' : 'completed');
        }

        // Final verification
        const completedTask = server.graph.nodes.find(n => n.id === taskId);
        expect(completedTask.status).toBe('completed');
        expect(completedTask.progress).toBe(100);
      });
    });

    describe('Scenario: Agent collaboration visualization', () => {
      test('Given multiple agents, When they collaborate, Then collaboration network is shown', () => {
        const architectId = 'architect_001';
        const guardianId = 'guardian_001';

        // When: Agents collaborate
        const collaborationEvent = {
          type: 'agent_message',
          data: {
            from: architectId,
            to: guardianId,
            protocol: 'task_coordination',
            messages: 5,
            timestamp: new Date()
          }
        };

        server.ingestClaudeFlowEvent(collaborationEvent);

        // Then: Collaboration edge is created
        const collaborationEdge = server.graph.edges.find(e =>
          e.type === 'COLLABORATES' &&
          e.from === architectId &&
          e.to === guardianId
        );

        expect(collaborationEdge).toMatchObject({
          protocol: 'task_coordination',
          messages: 5
        });
      });
    });
  });

  describe('Feature: Performance Monitoring', () => {
    describe('Scenario: Real-time metrics calculation', () => {
      test('Given active swarm, When metrics are requested, Then accurate performance data is returned', () => {
        // Given: Active swarm with nodes and edges from previous tests

        // When: Metrics are calculated
        const metrics = server.calculateMetrics();

        // Then: Metrics reflect current state
        expect(metrics).toMatchObject({
          graph: {
            totalNodes: expect.any(Number),
            totalEdges: expect.any(Number),
            nodesByType: expect.any(Object),
            edgesByType: expect.any(Object)
          },
          performance: {
            activeTasks: expect.any(Number),
            completedTasks: expect.any(Number),
            activeAgents: expect.any(Number),
            avgTaskDuration: expect.any(Number)
          },
          connectivity: {
            avgDegree: expect.any(Number),
            clustering: expect.any(Number),
            components: expect.any(Number)
          }
        });

        // Verify specific performance metrics
        expect(metrics.performance.activeAgents).toBe(2); // architect + guardian
        expect(metrics.performance.completedTasks).toBe(1); // tdd setup task
      });
    });

    describe('Scenario: Bottleneck detection', () => {
      test('Given overloaded agent, When bottleneck analysis runs, Then issues are identified', () => {
        const overloadedAgentId = 'architect_001';

        // Create multiple tasks for same agent (simulating bottleneck)
        const taskIds = ['task_1', 'task_2', 'task_3'];

        taskIds.forEach(taskId => {
          server.addNode('Task', {
            id: taskId,
            status: 'executing',
            duration: 300 // High duration indicates slow task
          });

          server.addEdge('EXECUTES', overloadedAgentId, taskId);
        });

        // When: Analyzing for bottlenecks
        const agentTasks = server.graph.edges.filter(e =>
          e.type === 'EXECUTES' && e.from === overloadedAgentId
        );

        const avgDuration = server.calculateAvgTaskDuration();

        // Then: Bottleneck is detected
        expect(agentTasks.length).toBe(4); // 3 new + 1 from previous test
        expect(avgDuration).toBeGreaterThan(100); // High average due to slow tasks
      });
    });
  });

  describe('Feature: Error Handling and Recovery', () => {
    describe('Scenario: Malformed event handling', () => {
      test('Given malformed Claude Flow event, When processed, Then system remains stable', () => {
        const initialNodeCount = server.graph.nodes.length;

        // When: Malformed events are sent
        const malformedEvents = [
          { type: 'invalid_type', data: null },
          { type: 'swarm_init' }, // Missing data
          { data: { test: 'value' } }, // Missing type
          null,
          undefined,
          'not_an_object'
        ];

        malformedEvents.forEach(event => {
          expect(() => {
            server.ingestClaudeFlowEvent(event);
          }).not.toThrow();
        });

        // Then: System remains stable
        expect(server.graph.nodes.length).toBe(initialNodeCount);
        expect(server.graph.edges.length).toBeGreaterThan(0);
      });
    });

    describe('Scenario: Memory management under load', () => {
      test('Given high event volume, When processed continuously, Then memory usage remains controlled', () => {
        const initialMemory = process.memoryUsage();

        // Simulate high event volume
        for (let i = 0; i < 1000; i++) {
          server.ingestClaudeFlowEvent({
            type: 'task_progress',
            data: {
              taskId: `load_test_task_${i % 10}`, // Cycle through 10 tasks
              progress: Math.floor(Math.random() * 100)
            }
          });
        }

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

        // Memory increase should be reasonable (less than 50MB for this test)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

        // Graph should not grow excessively
        expect(server.graph.nodes.length).toBeLessThan(100);
      });
    });
  });

  describe('Feature: Data Integrity', () => {
    describe('Scenario: Consistent state maintenance', () => {
      test('Given complex event sequence, When processed, Then graph state remains consistent', () => {
        const swarmId = 'consistency_test_swarm';
        const agentId = 'consistency_test_agent';
        const taskId = 'consistency_test_task';

        // Complex sequence of events
        const eventSequence = [
          { type: 'swarm_init', data: { id: swarmId, status: 'active' } },
          { type: 'agent_spawn', data: { id: agentId, swarmId, status: 'active' } },
          { type: 'task_orchestrate', data: { id: taskId, status: 'pending' } },
          { type: 'task_assign', data: { taskId, agentId } },
          { type: 'task_progress', data: { taskId, progress: 50, status: 'executing' } },
          { type: 'task_progress', data: { taskId, progress: 100, status: 'completed' } }
        ];

        eventSequence.forEach(event => {
          server.ingestClaudeFlowEvent(event);
        });

        // Verify final consistent state
        const swarmNode = server.graph.nodes.find(n => n.id === swarmId);
        const agentNode = server.graph.nodes.find(n => n.id === agentId);
        const taskNode = server.graph.nodes.find(n => n.id === taskId);

        expect(swarmNode?.status).toBe('active');
        expect(agentNode?.status).toBe('active');
        expect(taskNode?.status).toBe('completed');
        expect(taskNode?.progress).toBe(100);

        // Verify relationships
        const orchestrationEdge = server.graph.edges.find(e =>
          e.type === 'ORCHESTRATES' && e.from === swarmId && e.to === agentId
        );
        const executionEdge = server.graph.edges.find(e =>
          e.type === 'EXECUTES' && e.from === agentId && e.to === taskId
        );

        expect(orchestrationEdge).toBeDefined();
        expect(executionEdge).toBeDefined();
      });
    });
  });
});