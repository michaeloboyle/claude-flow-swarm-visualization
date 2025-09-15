/**
 * Global Agents Integration for Claude Flow Swarm Visualization
 * Connects global PKM agents to real-time visualization system
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class GlobalAgentsIntegration extends EventEmitter {
  constructor(visualizationServer, options = {}) {
    super();
    this.server = visualizationServer;
    this.configPath = options.configPath || path.join(process.env.HOME, '.claude-flow/agents');
    this.logPath = options.logPath || path.join(process.env.HOME, '.claude-flow/logs');
    this.pollInterval = options.pollInterval || 5000; // 5 seconds

    this.globalAgents = new Map();
    this.agentMetrics = new Map();
    this.isRunning = false;

    this.init();
  }

  async init() {
    console.log('🔗 Initializing Global Agents Integration...');

    try {
      await this.loadAgentConfigurations();
      await this.setupVisualizationNodes();
      this.startMonitoring();

      console.log('✅ Global Agents Integration ready');
    } catch (error) {
      console.error('❌ Failed to initialize Global Agents Integration:', error);
    }
  }

  async loadAgentConfigurations() {
    try {
      const configFiles = await fs.readdir(this.configPath);
      const jsonFiles = configFiles.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(this.configPath, file);
        const configData = await fs.readFile(filePath, 'utf8');
        const config = JSON.parse(configData);

        const agentId = path.basename(file, '.json');
        this.globalAgents.set(agentId, {
          id: agentId,
          config,
          status: 'configured',
          lastSeen: new Date(),
          metrics: {
            tasksCompleted: 0,
            uptime: 0,
            health: 1.0,
            workload: 0
          }
        });

        console.log(`📋 Loaded agent config: ${config.name} (${config.type})`);
      }
    } catch (error) {
      console.error('Error loading agent configurations:', error);
    }
  }

  async setupVisualizationNodes() {
    // Add global agents to visualization
    for (const [agentId, agent] of this.globalAgents) {
      const nodeData = {
        id: `global-${agentId}`,
        label: agent.config.name,
        type: 'GlobalAgent',
        agentType: agent.config.type,
        status: agent.status,
        capabilities: agent.config.capabilities || [],
        workspace: agent.config.config?.workspace || '',
        permanent: agent.config.config?.permanent || false,
        color: this.getAgentColor(agent.config.type),
        size: 25,
        font: { size: 14, color: '#ffffff' },
        borderWidth: 3,
        borderColor: agent.status === 'active' ? '#00ff00' : '#888888'
      };

      this.server.addNode('GlobalAgent', nodeData);

      // Add workspace connection
      if (agent.config.config?.workspace) {
        const workspaceNode = {
          id: `workspace-${agentId}`,
          label: path.basename(agent.config.config.workspace),
          type: 'Workspace',
          path: agent.config.config.workspace,
          color: '#4a90e2',
          size: 15,
          font: { size: 10, color: '#ffffff' }
        };

        this.server.addNode('Workspace', workspaceNode);
        this.server.addEdge('OPERATES_IN', `global-${agentId}`, `workspace-${agentId}`);
      }
    }

    // Add coordination hub
    const hubNode = {
      id: 'global-coordination-hub',
      label: 'Global Agent Hub',
      type: 'CoordinationHub',
      color: '#ff6b35',
      size: 35,
      font: { size: 16, color: '#ffffff', face: 'bold' },
      borderWidth: 4,
      borderColor: '#ff4500'
    };

    this.server.addNode('CoordinationHub', hubNode);

    // Connect all global agents to hub
    for (const [agentId] of this.globalAgents) {
      this.server.addEdge('COORDINATES_WITH', 'global-coordination-hub', `global-${agentId}`);
    }
  }

  getAgentColor(agentType) {
    const colors = {
      'coordinator': '#ff6b35',
      'researcher': '#4a90e2',
      'analyst': '#50c878',
      'coder': '#9966cc',
      'architect': '#ff69b4',
      'tester': '#ffa500',
      'reviewer': '#20b2aa',
      'optimizer': '#dc143c'
    };
    return colors[agentType] || '#888888';
  }

  startMonitoring() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🔍 Starting global agents monitoring...');

    this.monitorInterval = setInterval(() => {
      this.updateAgentStatuses();
      this.updateMetrics();
      this.broadcastUpdates();
    }, this.pollInterval);
  }

  stopMonitoring() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    console.log('⏹️  Stopped global agents monitoring');
  }

  async updateAgentStatuses() {
    // Simulate realistic agent work scenarios
    for (const [agentId, agent] of this.globalAgents) {
      const oldStatus = agent.status;

      // Simulate realistic status transitions based on agent type
      const newStatus = this.simulateAgentWork(agent, agentId);

      if (agent.status !== newStatus) {
        agent.status = newStatus;
        agent.lastSeen = new Date();

        // Update visualization with better colors and effects
        this.server.updateNode(`global-${agentId}`, {
          borderColor: this.getStatusColor(newStatus),
          borderWidth: newStatus === 'busy' ? 4 : 3,
          title: `${agent.config.name}\nStatus: ${newStatus}\nLast seen: ${agent.lastSeen.toLocaleTimeString()}\nTasks: ${agent.metrics.tasksCompleted}`
        });

        // Broadcast status change
        this.server.broadcast('agent:status_changed', {
          agentId: `global-${agentId}`,
          oldStatus,
          newStatus,
          agent: agent.config.name
        });
      }

      // Update metrics
      if (newStatus === 'active' || newStatus === 'busy') {
        agent.metrics.tasksCompleted += Math.floor(Math.random() * 2);
        agent.metrics.uptime += this.pollInterval / 1000;
        agent.metrics.workload = Math.random();
        agent.metrics.health = 0.85 + (Math.random() * 0.15);
      }
    }

    // Occasionally create new tasks or collaboration
    if (Math.random() < 0.3) {
      this.simulateAgentActivity();
    }
  }

  simulateAgentWork(agent, agentId) {
    const currentStatus = agent.status;
    const agentType = agent.config.type;

    // Different behavior patterns based on agent type
    const behaviorPatterns = {
      'coordinator': {
        'configured': { next: ['active'], probability: 0.4 },
        'active': { next: ['busy', 'idle'], probability: 0.6 },
        'busy': { next: ['active', 'completed'], probability: 0.7 },
        'idle': { next: ['active', 'configured'], probability: 0.3 },
        'completed': { next: ['idle', 'active'], probability: 0.8 }
      },
      'researcher': {
        'configured': { next: ['active'], probability: 0.5 },
        'active': { next: ['busy'], probability: 0.8 },
        'busy': { next: ['completed', 'active'], probability: 0.6 },
        'idle': { next: ['active'], probability: 0.4 },
        'completed': { next: ['idle'], probability: 0.9 }
      },
      'analyst': {
        'configured': { next: ['active'], probability: 0.3 },
        'active': { next: ['busy'], probability: 0.7 },
        'busy': { next: ['completed'], probability: 0.8 },
        'idle': { next: ['active'], probability: 0.5 },
        'completed': { next: ['idle', 'active'], probability: 0.7 }
      }
    };

    const pattern = behaviorPatterns[agentType] || behaviorPatterns['coordinator'];
    const statusOptions = pattern[currentStatus] || { next: ['idle'], probability: 0.5 };

    if (Math.random() < statusOptions.probability) {
      const nextStatuses = statusOptions.next;
      return nextStatuses[Math.floor(Math.random() * nextStatuses.length)];
    }

    return currentStatus; // No change
  }

  getStatusColor(status) {
    const colors = {
      'active': '#00ff00',      // Green
      'busy': '#ffaa00',        // Orange
      'idle': '#4a90e2',        // Blue
      'configured': '#888888',  // Gray
      'completed': '#27ae60'    // Success green
    };
    return colors[status] || '#888888';
  }

  simulateAgentActivity() {
    const activeAgents = Array.from(this.globalAgents.entries()).filter(
      ([id, agent]) => agent.status === 'active' || agent.status === 'busy'
    );

    if (activeAgents.length === 0) return;

    const activityTypes = ['task_creation', 'collaboration', 'file_operation', 'analysis'];
    const activity = activityTypes[Math.floor(Math.random() * activityTypes.length)];

    switch (activity) {
      case 'task_creation':
        this.simulateTaskCreation(activeAgents);
        break;
      case 'collaboration':
        this.simulateCollaboration(activeAgents);
        break;
      case 'file_operation':
        this.simulateFileOperation(activeAgents);
        break;
      case 'analysis':
        this.simulateAnalysis(activeAgents);
        break;
    }
  }

  simulateTaskCreation(activeAgents) {
    const [agentId, agent] = activeAgents[Math.floor(Math.random() * activeAgents.length)];
    const taskId = `task-${Date.now()}`;

    const tasks = {
      'coordinator': ['Analyze PKM patterns', 'Coordinate workflow', 'Generate insights'],
      'researcher': ['Research market trends', 'Gather intelligence', 'Analyze competitors'],
      'analyst': ['Generate report', 'Analyze performance', 'Review metrics']
    };

    const taskNames = tasks[agent.config.type] || tasks['coordinator'];
    const taskName = taskNames[Math.floor(Math.random() * taskNames.length)];

    // Add task node
    this.server.addNode('Task', {
      id: taskId,
      label: taskName,
      status: 'pending',
      priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      createdBy: agentId,
      timestamp: new Date()
    });

    // Connect agent to task
    this.server.addEdge('EXECUTES', `global-${agentId}`, taskId);

    console.log(`🎯 ${agent.config.name} created task: ${taskName}`);
  }

  simulateCollaboration(activeAgents) {
    if (activeAgents.length < 2) return;

    const agent1 = activeAgents[Math.floor(Math.random() * activeAgents.length)];
    const agent2 = activeAgents[Math.floor(Math.random() * activeAgents.length)];

    if (agent1[0] !== agent2[0]) {
      // Create collaboration edge
      const collabId = `collab-${Date.now()}`;
      this.server.addEdge('COLLABORATES', `global-${agent1[0]}`, `global-${agent2[0]}`, {
        id: collabId,
        type: 'COLLABORATES',
        protocol: 'real-time',
        timestamp: new Date()
      });

      console.log(`🤝 ${agent1[1].config.name} collaborating with ${agent2[1].config.name}`);

      // Remove collaboration edge after 3 seconds
      setTimeout(() => {
        this.server.graph.edges = this.server.graph.edges.filter(e => e.id !== collabId);
        this.server.broadcast('edge:removed', { id: collabId });
      }, 3000);
    }
  }

  simulateFileOperation(activeAgents) {
    const [agentId, agent] = activeAgents[Math.floor(Math.random() * activeAgents.length)];

    const files = [
      'daily-notes.md', 'analysis-report.pdf', 'strategy-doc.md',
      'research-findings.json', 'metrics-dashboard.html'
    ];

    const operations = ['read', 'write', 'analyze', 'update'];
    const fileName = files[Math.floor(Math.random() * files.length)];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    // Add file node if not exists
    const fileId = `file-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`;
    this.server.addNode('File', {
      id: fileId,
      label: fileName,
      status: operation,
      lastModified: new Date()
    });

    // Connect agent to file
    this.server.addEdge('MODIFIES', `global-${agentId}`, fileId, {
      operation,
      timestamp: new Date()
    });

    console.log(`📄 ${agent.config.name} ${operation}ing ${fileName}`);
  }

  simulateAnalysis(activeAgents) {
    const [agentId, agent] = activeAgents[Math.floor(Math.random() * activeAgents.length)];

    // Create analysis node
    const analysisId = `analysis-${Date.now()}`;
    this.server.addNode('Analysis', {
      id: analysisId,
      label: 'Data Analysis',
      status: 'processing',
      progress: Math.floor(Math.random() * 100),
      type: 'Analysis'
    });

    // Connect agent to analysis
    this.server.addEdge('PERFORMS', `global-${agentId}`, analysisId);

    console.log(`📊 ${agent.config.name} performing analysis`);

    // Complete analysis after 5 seconds
    setTimeout(() => {
      this.server.updateNode(analysisId, {
        status: 'completed',
        progress: 100
      });
      this.server.broadcast('analysis:completed', { id: analysisId, agent: agentId });
    }, 5000);
  }

  updateMetrics() {
    const globalMetrics = {
      totalAgents: this.globalAgents.size,
      activeAgents: Array.from(this.globalAgents.values()).filter(a => a.status === 'active').length,
      busyAgents: Array.from(this.globalAgents.values()).filter(a => a.status === 'busy').length,
      totalTasks: Array.from(this.globalAgents.values()).reduce((sum, a) => sum + a.metrics.tasksCompleted, 0),
      averageHealth: Array.from(this.globalAgents.values()).reduce((sum, a) => sum + a.metrics.health, 0) / this.globalAgents.size,
      timestamp: new Date()
    };

    this.server.graph.globalAgentsMetrics = globalMetrics;
  }

  broadcastUpdates() {
    const updateData = {
      type: 'global-agents-update',
      data: {
        agents: Array.from(this.globalAgents.entries()).map(([id, agent]) => ({
          id,
          name: agent.config.name,
          type: agent.config.type,
          status: agent.status,
          metrics: agent.metrics,
          lastSeen: agent.lastSeen
        })),
        metrics: this.server.graph.globalAgentsMetrics
      }
    };

    this.server.broadcast('global-agents-update', updateData);
  }

  // Manual agent operations
  async spawnAgent(agentId, options = {}) {
    const agent = this.globalAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in configuration`);
    }

    // Simulate agent spawning
    agent.status = 'active';
    agent.lastSeen = new Date();

    console.log(`🚀 Spawned global agent: ${agent.config.name}`);

    // Update visualization
    this.server.updateNode(`global-${agentId}`, {
      borderColor: '#00ff00',
      title: `Status: active\nSpawned: ${agent.lastSeen.toLocaleTimeString()}`
    });

    this.server.broadcast('agent:spawned', {
      type: 'GlobalAgent',
      id: agentId,
      name: agent.config.name,
      status: 'active'
    });

    return agent;
  }

  async terminateAgent(agentId) {
    const agent = this.globalAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.status = 'configured';
    agent.lastSeen = new Date();

    console.log(`⏹️  Terminated global agent: ${agent.config.name}`);

    // Update visualization
    this.server.updateNode(`global-${agentId}`, {
      borderColor: '#888888',
      title: `Status: configured\nTerminated: ${agent.lastSeen.toLocaleTimeString()}`
    });

    this.server.broadcast('agent:terminated', {
      type: 'GlobalAgent',
      id: agentId,
      name: agent.config.name,
      status: 'configured'
    });

    return agent;
  }

  getAgentStatus(agentId) {
    return this.globalAgents.get(agentId);
  }

  getAllAgentsStatus() {
    return Array.from(this.globalAgents.entries()).map(([id, agent]) => ({
      id,
      name: agent.config.name,
      type: agent.config.type,
      status: agent.status,
      metrics: agent.metrics,
      lastSeen: agent.lastSeen,
      workspace: agent.config.config?.workspace
    }));
  }
}

module.exports = GlobalAgentsIntegration;