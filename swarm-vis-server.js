/**
 * PKM Swarm Visualization Server
 * Real-time WebSocket server for swarm activity visualization
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const EventEmitter = require('events');

class SwarmVisualizationServer extends EventEmitter {
  constructor(port = 8080) {
    super();
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });

    // Graph state
    this.graph = {
      nodes: [],
      edges: [],
      metrics: {},
      timestamp: new Date()
    };

    // Client connections
    this.clients = new Set();

    this.setupRoutes();
    this.setupWebSocket();
    this.setupClaudeFlowIntegration();
  }

  setupRoutes() {
    // Serve static files
    this.app.use(express.static(path.join(__dirname, 'public')));

    // API endpoints
    this.app.get('/api/graph', (req, res) => {
      res.json(this.graph);
    });

    this.app.get('/api/metrics', (req, res) => {
      res.json(this.calculateMetrics());
    });

    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        clients: this.clients.size,
        nodes: this.graph.nodes.length,
        edges: this.graph.edges.length,
        uptime: process.uptime()
      });
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('New client connected');
      this.clients.add(ws);

      // Send initial graph state
      console.log(`📤 Sending initial data: ${this.graph.nodes.length} nodes, ${this.graph.edges.length} edges`);
      ws.send(JSON.stringify({
        type: 'initial',
        data: this.graph
      }));

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  setupClaudeFlowIntegration() {
    // Initialize Global Agents Integration
    const GlobalAgentsIntegration = require('./global-agents-integration');
    this.globalAgents = new GlobalAgentsIntegration(this, {
      configPath: require('path').join(require('os').homedir(), '.claude-flow/agents'),
      logPath: require('path').join(require('os').homedir(), '.claude-flow/logs'),
      pollInterval: 3000
    });

    // Listen for Claude Flow events
    this.on('swarm:created', (data) => {
      this.addNode('Swarm', data);
      this.broadcast('node:added', { type: 'Swarm', data });
    });

    this.on('agent:spawned', (data) => {
      this.addNode('Agent', data);
      this.addEdge('ORCHESTRATES', data.swarmId, data.id);
      this.broadcast('node:added', { type: 'Agent', data });
    });

    this.on('task:created', (data) => {
      this.addNode('Task', data);
      this.broadcast('node:added', { type: 'Task', data });
    });

    this.on('task:assigned', (data) => {
      this.addEdge('EXECUTES', data.agentId, data.taskId, {
        startTime: new Date()
      });
      this.broadcast('edge:added', {
        type: 'EXECUTES',
        from: data.agentId,
        to: data.taskId
      });
    });

    this.on('task:progress', (data) => {
      this.updateNode(data.taskId, {
        progress: data.progress,
        status: 'executing'
      });
      this.broadcast('node:updated', data);
    });

    this.on('file:modified', (data) => {
      this.addNode('File', data);
      this.addEdge('MODIFIES', data.taskId, data.filePath, {
        operation: data.operation,
        timestamp: new Date()
      });
      this.broadcast('file:modified', data);
    });

    this.on('issue:linked', (data) => {
      this.addNode('Issue', data);
      this.addEdge('IMPLEMENTS', data.taskId, data.issueId);
      this.broadcast('issue:linked', data);
    });

    this.on('agent:collaboration', (data) => {
      this.addEdge('COLLABORATES', data.from, data.to, {
        protocol: data.protocol,
        messages: data.messages
      });
      this.broadcast('collaboration', data);
    });
  }

  addNode(type, data) {
    const node = {
      id: data.id || `${type}_${Date.now()}`,
      type,
      label: data.name || data.title || data.path || type,
      ...data,
      timestamp: new Date()
    };

    // Remove existing node if updating
    this.graph.nodes = this.graph.nodes.filter(n => n.id !== node.id);
    this.graph.nodes.push(node);

    return node;
  }

  addEdge(type, from, to, properties = {}) {
    const edge = {
      id: `${from}_${type}_${to}`,
      type,
      from,
      to,
      ...properties,
      timestamp: new Date()
    };

    // Remove existing edge if updating
    this.graph.edges = this.graph.edges.filter(e => e.id !== edge.id);
    this.graph.edges.push(edge);

    return edge;
  }

  updateNode(nodeId, updates) {
    const node = this.graph.nodes.find(n => n.id === nodeId);
    if (node) {
      Object.assign(node, updates, { updated: new Date() });
    }
    return node;
  }

  calculateMetrics() {
    const metrics = {
      timestamp: new Date(),
      graph: {
        totalNodes: this.graph.nodes.length,
        totalEdges: this.graph.edges.length,
        nodesByType: this.countByType(this.graph.nodes),
        edgesByType: this.countByType(this.graph.edges)
      },
      performance: {
        activeTasks: this.graph.nodes.filter(n =>
          n.type === 'Task' && n.status === 'executing'
        ).length,
        completedTasks: this.graph.nodes.filter(n =>
          n.type === 'Task' && n.status === 'completed'
        ).length,
        activeAgents: this.graph.nodes.filter(n =>
          n.type === 'Agent' && n.status === 'active'
        ).length,
        avgTaskDuration: this.calculateAvgTaskDuration()
      },
      connectivity: {
        avgDegree: this.calculateAvgDegree(),
        clustering: this.calculateClustering(),
        components: this.findConnectedComponents()
      }
    };

    this.graph.metrics = metrics;
    return metrics;
  }

  countByType(items) {
    return items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
  }

  calculateAvgDegree() {
    if (this.graph.nodes.length === 0) return 0;
    return (this.graph.edges.length * 2) / this.graph.nodes.length;
  }

  calculateClustering() {
    // Simplified clustering coefficient
    const triangles = this.findTriangles();
    const possibleTriangles = this.graph.nodes.length *
      (this.graph.nodes.length - 1) * (this.graph.nodes.length - 2) / 6;
    return possibleTriangles > 0 ? triangles / possibleTriangles : 0;
  }

  findTriangles() {
    // Count triangles in the graph
    let count = 0;
    const adjacency = this.buildAdjacencyList();

    for (const node of this.graph.nodes) {
      const neighbors = adjacency[node.id] || [];
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (this.hasEdge(neighbors[i], neighbors[j])) {
            count++;
          }
        }
      }
    }

    return count / 3; // Each triangle counted 3 times
  }

  buildAdjacencyList() {
    const adj = {};
    for (const edge of this.graph.edges) {
      if (!adj[edge.from]) adj[edge.from] = [];
      if (!adj[edge.to]) adj[edge.to] = [];
      adj[edge.from].push(edge.to);
      adj[edge.to].push(edge.from);
    }
    return adj;
  }

  hasEdge(from, to) {
    return this.graph.edges.some(e =>
      (e.from === from && e.to === to) ||
      (e.from === to && e.to === from)
    );
  }

  findConnectedComponents() {
    const visited = new Set();
    const components = [];
    const adjacency = this.buildAdjacencyList();

    for (const node of this.graph.nodes) {
      if (!visited.has(node.id)) {
        const component = this.dfs(node.id, adjacency, visited);
        components.push(component);
      }
    }

    return components.length;
  }

  dfs(nodeId, adjacency, visited) {
    const stack = [nodeId];
    const component = [];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!visited.has(current)) {
        visited.add(current);
        component.push(current);
        const neighbors = adjacency[current] || [];
        stack.push(...neighbors);
      }
    }

    return component;
  }

  calculateAvgTaskDuration() {
    const completedTasks = this.graph.nodes.filter(n =>
      n.type === 'Task' && n.status === 'completed' && n.duration
    );

    if (completedTasks.length === 0) return 0;

    const totalDuration = completedTasks.reduce((sum, task) =>
      sum + task.duration, 0
    );

    return totalDuration / completedTasks.length;
  }

  broadcast(type, data) {
    const message = JSON.stringify({ type, data, timestamp: new Date() });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`🎨 Swarm Visualization Server running on http://localhost:${this.port}`);
      console.log(`🔌 WebSocket endpoint: ws://localhost:${this.port}`);
    });
  }

  // Integration with Claude Flow
  ingestClaudeFlowEvent(event) {
    // Parse Claude Flow events and emit appropriate visualization events
    switch (event.type) {
      case 'swarm_init':
        this.emit('swarm:created', event.data);
        break;
      case 'agent_spawn':
        this.emit('agent:spawned', event.data);
        break;
      case 'task_orchestrate':
        this.emit('task:created', event.data);
        break;
      case 'task_assign':
        this.emit('task:assigned', event.data);
        break;
      case 'task_progress':
        this.emit('task:progress', event.data);
        break;
      case 'file_operation':
        this.emit('file:modified', event.data);
        break;
      case 'issue_update':
        this.emit('issue:linked', event.data);
        break;
      case 'agent_message':
        this.emit('agent:collaboration', event.data);
        break;
    }
  }
}

// Export for use
module.exports = SwarmVisualizationServer;

// Start server if run directly
if (require.main === module) {
  const server = new SwarmVisualizationServer(8080);
  server.start();
}