# PKM Swarm Intelligence Visualization

Real-time WebSocket-based visualization system for Claude Flow swarm activities using vis.js with Neo4j-like graph schema.

## Features

### 🔴 Real-Time Visualization
- Live WebSocket connection to swarm activities
- Real-time updates for agents, tasks, issues, and files
- Animated transitions and visual feedback

### 📊 Neo4j-Like Schema
```cypher
// Node Types
(:Swarm)-[:ORCHESTRATES]->(:Agent)-[:EXECUTES]->(:Task)
(:Task)-[:IMPLEMENTS]->(:Issue)
(:Task)-[:MODIFIES]->(:File)
(:Agent)-[:COLLABORATES]-(:Agent)
(:File)-[:LINKS_TO]->(:File)
```

### 🎨 Interactive Graph
- **Hierarchical & Force Layouts**: Toggle between organizational views
- **Node Types**: Swarms (🐝), Agents (●), Tasks (■), Issues (◆), Files (▬)
- **Status Colors**: Active, Busy, Idle, Failed states
- **Hover Details**: Comprehensive tooltips and side panels

### 📈 Live Metrics
- Total nodes and connections
- Active agents and running tasks
- File modifications and open issues
- Performance analyticstodo

### Installation
```bash
cd .claude-flow/visualization
npm install
```

### Start Server
```bash
npm start
# Or for development
npm run dev
```

### Access Visualization
Open: `http://localhost:8080`

## Architecture

### WebSocket Events
```javascript
// Swarm Events
ws.send({ type: 'swarm:created', data: swarmData });
ws.send({ type: 'agent:spawned', data: agentData });
ws.send({ type: 'task:created', data: taskData });

// Progress Events
ws.send({ type: 'task:progress', data: { taskId, progress: 75 } });
ws.send({ type: 'agent:collaboration', data: { from, to, messages } });

// File Events
ws.send({ type: 'file:modified', data: { path, operation: 'update' } });
```

### Node Schema
```json
{
  "Swarm": {
    "properties": ["id", "topology", "agentCount", "status"],
    "visualization": { "shape": "hexagon", "color": "#FF6B6B", "size": 50 }
  },
  "Agent": {
    "properties": ["id", "type", "capabilities", "status"],
    "visualization": { "shape": "circle", "color": "#4ECDC4", "animation": "pulse" }
  },
  "Task": {
    "properties": ["id", "priority", "progress", "status"],
    "visualization": { "shape": "square", "color": "#F39C12", "animation": "rotate" }
  }
}
```

### Relationship Types
- **ORCHESTRATES**: Swarm → Agent coordination
- **EXECUTES**: Agent → Task assignment
- **COLLABORATES**: Agent ↔ Agent communication
- **IMPLEMENTS**: Task → Issue completion
- **MODIFIES**: Task → File operations
- **DEPENDS_ON**: Issue → Issue dependencies
- **LINKS_TO**: File → File references

## Integration with Claude Flow

### Event Ingestion
```javascript
const server = new SwarmVisualizationServer(8080);

// Listen for Claude Flow events
server.ingestClaudeFlowEvent({
  type: 'swarm_init',
  data: { id: 'swarm_123', topology: 'hierarchical' }
});

server.ingestClaudeFlowEvent({
  type: 'agent_spawn',
  data: { id: 'agent_456', type: 'coordinator', swarmId: 'swarm_123' }
});
```

### Real-Time Monitoring
```javascript
// Monitor swarm activity
mcp__claude-flow__swarm_monitor()
  .then(data => server.ingestClaudeFlowEvent({
    type: 'swarm_status_update',
    data
  }));
```

## Visualization Features

### 🎯 Interactive Controls
- **Toggle Physics**: Enable/disable force simulation
- **Fit View**: Auto-zoom to show entire graph
- **Change Layout**: Switch between hierarchical and force-directed

### 📱 Responsive Design
- **Grid Layout**: Header, sidebar, main visualization, details panel
- **Live Metrics**: Real-time counters and performance indicators
- **Node Selection**: Click nodes for detailed information
- **Connection Status**: WebSocket connection health indicator

### 🔍 Advanced Analytics
- **Graph Metrics**: Degree centrality, clustering coefficient
- **Performance Tracking**: Task throughput, agent utilization
- **Bottleneck Detection**: Identify slow operations and overloaded agents
- **Critical Path Analysis**: Highlight dependencies and blocking issues

## Customization

### Node Styling
```javascript
const nodeColors = {
  Swarm: '#FF6B6B',      // Red hexagon
  Agent: '#4ECDC4',      // Teal circle
  Task: '#F39C12',       // Orange square
  Issue: '#3498DB',      // Blue diamond
  File: '#2C3E50'        // Dark box
};
```

### Edge Styling
```javascript
const edgeStyles = {
  ORCHESTRATES: { color: '#FF6B6B', width: 3 },
  EXECUTES: { color: '#4ECDC4', width: 2, animation: 'flow' },
  COLLABORATES: { color: '#95A5A6', width: 1, dashes: true }
};
```

## Performance

### Optimizations
- **DataSet Updates**: Efficient vis.js DataSet operations
- **Selective Rendering**: Only update changed nodes/edges
- **Animation Throttling**: Smooth animations without performance loss
- **Memory Management**: Cleanup disconnected clients

### Scaling
- **Connection Pooling**: Handle multiple concurrent clients
- **Event Batching**: Group related updates for efficiency
- **Persistence**: Optional graph state persistence
- **Load Balancing**: Ready for horizontal scaling

## Development

### Project Structure
```
visualization/
├── swarm-vis-server.js     # WebSocket server
├── swarm-vis-schema.json   # Neo4j-like schema definition
├── public/
│   ├── index.html         # Main visualization page
│   └── visualization.js   # Client-side vis.js implementation
├── package.json           # Dependencies
└── README.md             # This file
```

### Adding New Node Types
1. Update `swarm-vis-schema.json` with new node definition
2. Add visualization properties (color, shape, size)
3. Update client-side `nodeColors` and `nodeShapes`
4. Add server-side event handling

### Custom Queries
```javascript
// Find performance bottlenecks
const bottlenecks = graph.query(`
  MATCH (a:Agent)-[:EXECUTES]->(t:Task)
  WHERE t.duration > avgDuration * 2
  RETURN a, t
`);

// Analyze collaboration patterns
const collaboration = graph.query(`
  MATCH (a1:Agent)-[c:COLLABORATES]-(a2:Agent)
  RETURN a1, a2, c.messages
  ORDER BY c.messages DESC
`);
```

## Future Enhancements

### Planned Features
- **3D Visualization**: Three.js integration for complex graphs
- **Time-based Analysis**: Historical activity playback
- **ML Integration**: Predictive analytics and anomaly detection
- **Export Capabilities**: Save graph states and generate reports
- **Mobile Support**: Touch-optimized interactions
- **Plugin System**: Extensible visualization components

This visualization system provides comprehensive real-time insights into PKM swarm intelligence operations with beautiful, interactive graph representations.