# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time WebSocket-based visualization system for Claude Flow swarm intelligence activities. Built with vis.js for graph visualization and follows a Neo4j-like schema for representing swarm entities and relationships.

## Commands

### Development
- `npm start` - Start the visualization server on port 8080
- `npm run dev` - Start with nodemon for auto-reload during development

### Testing (TDD/BDD)
- `npm test` - Run all tests with coverage
- `npm run test:watch` - Run tests in watch mode for TDD
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:tdd` - Run unit tests in verbose watch mode
- `npm run test:bdd` - Run integration tests in verbose mode
- `npm run test:coverage` - Generate coverage report

### Code Quality
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run validate` - Run both lint and test coverage

### Documentation
- `npm run docs` - Generate JSDoc documentation

### Docker
- `npm run docker:build` - Build Docker container
- `npm run docker:run` - Run containerized visualization server

## Architecture

### Core Server (`swarm-vis-server.js`)
- **SwarmVisualizationServer** class extends EventEmitter
- Manages WebSocket connections for real-time updates
- Maintains graph state with nodes and edges
- Provides REST API endpoints for graph data and metrics
- Integrates with Claude Flow through event ingestion
- **Memory Management**: Automatic garbage collection system with configurable limits
- **Client-Aware GC**: More aggressive cleanup when no clients are connected

### Graph Schema (`swarm-vis-schema.json`)
Defines six node types with Neo4j-like relationships:
- **Nodes**: Swarm, Agent, Task, Issue, File, Memory
- **Relationships**: ORCHESTRATES, EXECUTES, COLLABORATES, IMPLEMENTS, MODIFIES, DEPENDS_ON, STORES, LINKS_TO
- Each entity has specific properties and visualization attributes

### Client Visualization (`public/visualization.js`)
- **SwarmVisualization** class manages vis.js network
- Real-time WebSocket client for receiving graph updates
- Supports hierarchical and force-directed layouts
- Interactive controls for physics, layout, and view fitting

### Multiple Visualization Interfaces
- **Main Interface** (`index.html`): Primary swarm visualization
- **Global Agents Dashboard** (`global-agents-dashboard.html`): Agent-focused view
- **Debug Interface** (`debug-vis.html`): Development and troubleshooting
- **Test Interface** (`test-vis.html`): Testing visualization components

### Event Flow
1. Claude Flow events → `ingestClaudeFlowEvent()`
2. Server emits internal events (e.g., 'agent:spawned')
3. Graph state updates (nodes/edges)
4. Broadcast to connected WebSocket clients
5. Client updates vis.js visualization in real-time

## Key Integration Points

### Claude Flow Events
The server listens for these event types:
- `swarm_init` → Creates swarm node
- `agent_spawn` → Creates agent node with ORCHESTRATES edge
- `task_orchestrate` → Creates task node
- `task_assign` → Creates EXECUTES edge
- `task_progress` → Updates task node progress
- `file_operation` → Creates file node with MODIFIES edge
- `issue_update` → Creates issue node with IMPLEMENTS edge
- `agent_message` → Creates COLLABORATES edge

### Graph Metrics
Calculated metrics include:
- Node/edge counts by type
- Active tasks and agents
- Average task duration
- Graph connectivity (degree, clustering, components)

## Testing Strategy

Tests are organized in:
- `tests/unit/` - Unit tests for server components
- `tests/integration/` - Integration tests for Claude Flow
- `tests/setup.js` - Jest setup configuration

Coverage thresholds (from `jest.config.js`):
- Global: 85% lines/statements, 80% branches
- Critical `swarm-vis-server.js`: 95% lines/statements, 90% branches

### TDD/BDD Workflow
The project follows strict TDD principles with dedicated test commands:
- Use `npm run test:tdd` for unit test development
- Use `npm run test:bdd` for integration test development
- Coverage reports required before commits