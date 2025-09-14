/**
 * PKM Swarm Visualization Client
 * Real-time graph visualization using vis.js
 */

class SwarmVisualization {
    constructor() {
        this.nodes = new vis.DataSet();
        this.edges = new vis.DataSet();
        this.network = null;
        this.ws = null;
        this.selectedNode = null;
        this.physicsEnabled = true;
        this.currentLayout = 'hierarchical';

        this.nodeColors = {
            Swarm: '#FF6B6B',
            Agent: '#4ECDC4',
            Task: '#F39C12',
            Issue: '#3498DB',
            File: '#2C3E50',
            Memory: '#34495E'
        };

        this.nodeShapes = {
            Swarm: 'hexagon',
            Agent: 'dot',
            Task: 'square',
            Issue: 'diamond',
            File: 'box',
            Memory: 'database'
        };

        this.init();
    }

    init() {
        this.setupNetwork();
        this.connectWebSocket();
        this.setupEventListeners();
    }

    setupNetwork() {
        const container = document.getElementById('network');

        const data = {
            nodes: this.nodes,
            edges: this.edges
        };

        const options = {
            nodes: {
                font: {
                    color: '#ffffff',
                    size: 12
                },
                borderWidth: 2,
                borderWidthSelected: 3,
                chosen: {
                    node: (values, id, selected, hovering) => {
                        if (selected) {
                            values.size *= 1.3;
                            values.borderWidth = 3;
                        }
                    }
                }
            },
            edges: {
                width: 2,
                color: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    highlight: '#ffffff'
                },
                smooth: {
                    type: 'continuous',
                    forceDirection: 'none'
                },
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 0.5
                    }
                }
            },
            physics: {
                enabled: this.physicsEnabled,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -50,
                    centralGravity: 0.01,
                    springLength: 100,
                    springConstant: 0.08
                }
            },
            layout: {
                hierarchical: {
                    enabled: this.currentLayout === 'hierarchical',
                    direction: 'UD',
                    sortMethod: 'directed',
                    levelSeparation: 150,
                    nodeSpacing: 200
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                navigationButtons: true,
                keyboard: true
            }
        };

        this.network = new vis.Network(container, data, options);

        // Network events
        this.network.on('click', (params) => {
            if (params.nodes.length > 0) {
                this.selectNode(params.nodes[0]);
            }
        });

        this.network.on('doubleClick', (params) => {
            if (params.nodes.length > 0) {
                this.focusNode(params.nodes[0]);
            }
        });

        this.network.on('hoverNode', (params) => {
            container.style.cursor = 'pointer';
        });

        this.network.on('blurNode', (params) => {
            container.style.cursor = 'default';
        });
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.hostname}:8080`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('Connected to visualization server');
            this.updateConnectionStatus(true);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from visualization server');
            this.updateConnectionStatus(false);
            // Attempt reconnection after 3 seconds
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };
    }

    handleMessage(message) {
        switch (message.type) {
            case 'initial':
                this.loadInitialGraph(message.data);
                break;
            case 'node:added':
                this.addNode(message.data);
                break;
            case 'node:updated':
                this.updateNode(message.data);
                break;
            case 'edge:added':
                this.addEdge(message.data);
                break;
            case 'file:modified':
                this.handleFileModification(message.data);
                break;
            case 'task:progress':
                this.updateTaskProgress(message.data);
                break;
            case 'collaboration':
                this.animateCollaboration(message.data);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }

        this.updateMetrics();
    }

    loadInitialGraph(data) {
        // Clear existing data
        this.nodes.clear();
        this.edges.clear();

        // Add nodes
        const visNodes = data.nodes.map(node => this.createVisNode(node));
        this.nodes.add(visNodes);

        // Add edges
        const visEdges = data.edges.map(edge => this.createVisEdge(edge));
        this.edges.add(visEdges);

        // Update sidebar
        this.updateSidebar();
        this.updateMetrics();
    }

    createVisNode(nodeData) {
        const type = nodeData.type || 'Unknown';
        return {
            id: nodeData.id,
            label: nodeData.label || nodeData.name || nodeData.id,
            group: type,
            color: this.nodeColors[type] || '#95A5A6',
            shape: this.nodeShapes[type] || 'dot',
            size: this.getNodeSize(nodeData),
            title: this.createNodeTooltip(nodeData),
            data: nodeData
        };
    }

    createVisEdge(edgeData) {
        return {
            id: edgeData.id,
            from: edgeData.from,
            to: edgeData.to,
            label: edgeData.label || edgeData.type,
            color: this.getEdgeColor(edgeData),
            width: this.getEdgeWidth(edgeData),
            dashes: edgeData.type === 'COLLABORATES',
            arrows: this.getArrowConfig(edgeData),
            data: edgeData
        };
    }

    getNodeSize(nodeData) {
        const baseSizes = {
            Swarm: 50,
            Agent: 30,
            Task: 25,
            Issue: 35,
            File: 20,
            Memory: 25
        };
        return baseSizes[nodeData.type] || 20;
    }

    createNodeTooltip(nodeData) {
        return `
            <div style="padding: 10px;">
                <strong>${nodeData.type}: ${nodeData.label}</strong><br>
                Status: ${nodeData.status || 'Unknown'}<br>
                ID: ${nodeData.id}
            </div>
        `;
    }

    getEdgeColor(edgeData) {
        const edgeColors = {
            ORCHESTRATES: '#FF6B6B',
            EXECUTES: '#4ECDC4',
            COLLABORATES: '#95A5A6',
            IMPLEMENTS: '#3498DB',
            MODIFIES: '#E74C3C',
            DEPENDS_ON: '#9B59B6',
            STORES: '#34495E',
            LINKS_TO: '#2C3E50'
        };
        return edgeColors[edgeData.type] || '#95A5A6';
    }

    getEdgeWidth(edgeData) {
        const widths = {
            ORCHESTRATES: 3,
            EXECUTES: 2,
            COLLABORATES: 1,
            IMPLEMENTS: 2,
            MODIFIES: 2,
            DEPENDS_ON: 2,
            STORES: 1,
            LINKS_TO: 1
        };
        return widths[edgeData.type] || 1;
    }

    getArrowConfig(edgeData) {
        const bidirectional = ['COLLABORATES', 'STORES'];
        if (bidirectional.includes(edgeData.type)) {
            return { to: true, from: true };
        }
        return { to: true };
    }

    addNode(nodeData) {
        const visNode = this.createVisNode(nodeData);
        this.nodes.add(visNode);
        this.updateSidebar();

        // Animate new node
        this.animateNodeAddition(visNode.id);
    }

    updateNode(nodeData) {
        const existing = this.nodes.get(nodeData.id);
        if (existing) {
            const updated = { ...existing, ...this.createVisNode(nodeData) };
            this.nodes.update(updated);
        }
    }

    addEdge(edgeData) {
        const visEdge = this.createVisEdge(edgeData);
        this.edges.add(visEdge);

        // Animate new edge
        this.animateEdgeAddition(visEdge.id);
    }

    selectNode(nodeId) {
        this.selectedNode = nodeId;
        const nodeData = this.nodes.get(nodeId);
        if (nodeData && nodeData.data) {
            this.displayNodeDetails(nodeData.data);
        }
    }

    focusNode(nodeId) {
        this.network.focus(nodeId, {
            scale: 1.5,
            animation: {
                duration: 1000,
                easingFunction: 'easeInOutQuad'
            }
        });
    }

    displayNodeDetails(nodeData) {
        const detailsDiv = document.getElementById('detail-content');

        let html = `
            <div class="detail-section">
                <h3>${nodeData.type}</h3>
                <div class="property">
                    <span class="property-key">ID:</span>
                    <span class="property-value">${nodeData.id}</span>
                </div>
                <div class="property">
                    <span class="property-key">Name:</span>
                    <span class="property-value">${nodeData.name || nodeData.label || 'N/A'}</span>
                </div>
                <div class="property">
                    <span class="property-key">Status:</span>
                    <span class="property-value">${nodeData.status || 'Unknown'}</span>
                </div>
            </div>
        `;

        // Add type-specific details
        if (nodeData.type === 'Agent') {
            html += `
                <div class="detail-section">
                    <h4>Capabilities</h4>
                    ${(nodeData.capabilities || []).map(cap =>
                        `<div class="property-value">• ${cap}</div>`
                    ).join('')}
                </div>
            `;
        } else if (nodeData.type === 'Task') {
            html += `
                <div class="detail-section">
                    <div class="property">
                        <span class="property-key">Priority:</span>
                        <span class="property-value">${nodeData.priority || 'Normal'}</span>
                    </div>
                    <div class="property">
                        <span class="property-key">Progress:</span>
                        <span class="property-value">${nodeData.progress || 0}%</span>
                    </div>
                </div>
            `;
        }

        detailsDiv.innerHTML = html;
    }

    updateSidebar() {
        const nodeList = document.getElementById('node-list');
        const nodes = this.nodes.get();

        const groupedNodes = {};
        nodes.forEach(node => {
            if (!groupedNodes[node.group]) {
                groupedNodes[node.group] = [];
            }
            groupedNodes[node.group].push(node);
        });

        let html = '';
        for (const [type, typeNodes] of Object.entries(groupedNodes)) {
            html += `<li style="font-weight: bold; margin-top: 10px;">${type}s</li>`;
            typeNodes.forEach(node => {
                const status = node.data?.status || 'unknown';
                html += `
                    <li class="node-item" onclick="swarmVis.selectNode('${node.id}')">
                        <span class="status-indicator status-${status}"></span>
                        ${node.label}
                    </li>
                `;
            });
        }

        nodeList.innerHTML = html;
    }

    updateMetrics() {
        const nodes = this.nodes.get();
        const edges = this.edges.get();

        document.getElementById('metric-nodes').textContent = nodes.length;
        document.getElementById('metric-edges').textContent = edges.length;

        const agents = nodes.filter(n => n.group === 'Agent').length;
        const tasks = nodes.filter(n => n.group === 'Task' && n.data?.status === 'executing').length;
        const files = nodes.filter(n => n.group === 'File').length;
        const issues = nodes.filter(n => n.group === 'Issue' && n.data?.status === 'open').length;

        document.getElementById('metric-agents').textContent = agents;
        document.getElementById('metric-tasks').textContent = tasks;
        document.getElementById('metric-files').textContent = files;
        document.getElementById('metric-issues').textContent = issues;
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connection-indicator');
        if (connected) {
            indicator.textContent = 'Connected';
            indicator.className = 'connection-status connected';
        } else {
            indicator.textContent = 'Disconnected';
            indicator.className = 'connection-status disconnected';
        }
    }

    animateNodeAddition(nodeId) {
        // Pulse effect for new nodes
        const node = this.nodes.get(nodeId);
        if (node) {
            const originalSize = node.size;
            this.nodes.update({
                id: nodeId,
                size: originalSize * 1.5
            });

            setTimeout(() => {
                this.nodes.update({
                    id: nodeId,
                    size: originalSize
                });
            }, 500);
        }
    }

    animateEdgeAddition(edgeId) {
        // Flash effect for new edges
        const edge = this.edges.get(edgeId);
        if (edge) {
            const originalWidth = edge.width;
            this.edges.update({
                id: edgeId,
                width: originalWidth * 2,
                color: '#ffffff'
            });

            setTimeout(() => {
                this.edges.update({
                    id: edgeId,
                    width: originalWidth,
                    color: edge.color
                });
            }, 500);
        }
    }

    animateCollaboration(data) {
        // Animate collaboration between agents
        const edgeId = `${data.from}_COLLABORATES_${data.to}`;
        this.animateEdgeAddition(edgeId);
    }

    updateTaskProgress(data) {
        const node = this.nodes.get(data.taskId);
        if (node) {
            // Update progress visually
            const progress = data.progress || 0;
            const color = progress < 50 ? '#F39C12' :
                         progress < 100 ? '#3498DB' : '#27AE60';

            this.nodes.update({
                id: data.taskId,
                color: color,
                title: `${node.title}<br>Progress: ${progress}%`
            });
        }
    }

    handleFileModification(data) {
        // Add or update file node
        this.addNode({
            id: data.filePath,
            type: 'File',
            label: data.filePath.split('/').pop(),
            status: data.operation,
            ...data
        });

        // Flash the file node
        this.animateNodeAddition(data.filePath);
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.network) {
                this.network.redraw();
                this.network.fit();
            }
        });
    }
}

// Global functions for controls
let swarmVis = null;

function togglePhysics() {
    if (swarmVis && swarmVis.network) {
        swarmVis.physicsEnabled = !swarmVis.physicsEnabled;
        swarmVis.network.setOptions({
            physics: { enabled: swarmVis.physicsEnabled }
        });
    }
}

function fitNetwork() {
    if (swarmVis && swarmVis.network) {
        swarmVis.network.fit({
            animation: {
                duration: 1000,
                easingFunction: 'easeInOutQuad'
            }
        });
    }
}

function toggleLayout() {
    if (swarmVis && swarmVis.network) {
        swarmVis.currentLayout = swarmVis.currentLayout === 'hierarchical' ? 'force' : 'hierarchical';

        if (swarmVis.currentLayout === 'hierarchical') {
            swarmVis.network.setOptions({
                layout: {
                    hierarchical: {
                        enabled: true,
                        direction: 'UD',
                        sortMethod: 'directed'
                    }
                }
            });
        } else {
            swarmVis.network.setOptions({
                layout: {
                    hierarchical: { enabled: false }
                }
            });
        }
    }
}

// Initialize visualization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    swarmVis = new SwarmVisualization();
});