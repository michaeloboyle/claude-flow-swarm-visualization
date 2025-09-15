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
            GlobalAgent: '#ff6b35',
            Task: '#F39C12',
            Issue: '#3498DB',
            File: '#2C3E50',
            Memory: '#34495E',
            Workspace: '#4a90e2',
            CoordinationHub: '#ff4500',
            Analysis: '#9B59B6'
        };

        this.nodeShapes = {
            Swarm: 'hexagon',
            Agent: 'dot',
            GlobalAgent: 'dot',
            Task: 'square',
            Issue: 'diamond',
            File: 'box',
            Memory: 'database',
            Workspace: 'box',
            CoordinationHub: 'star',
            Analysis: 'triangle'
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

        // Debug container dimensions
        console.log('📐 Container element:', container);
        console.log('📐 Container dimensions:', {
            width: container.clientWidth,
            height: container.clientHeight,
            offsetWidth: container.offsetWidth,
            offsetHeight: container.offsetHeight,
            style: getComputedStyle(container)
        });

        // Ensure container has proper dimensions
        if (container.clientHeight === 0) {
            console.warn('⚠️  Container height is 0, setting explicit dimensions');
            container.style.height = '500px';
            container.style.width = '100%';
        }

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

        try {
            console.log('🎨 Creating vis.Network with container:', container);
            console.log('📊 Network data:', { nodes: this.nodes.length, edges: this.edges.length });
            this.network = new vis.Network(container, data, options);
            console.log('✅ vis.Network created successfully');
        } catch (error) {
            console.error('❌ Failed to create vis.Network:', error);
            throw error;
        }

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
            case 'agent:status_changed':
                this.handleAgentStatusChange(message.data);
                break;
            case 'edge:removed':
                this.removeEdge(message.data.id);
                break;
            case 'analysis:completed':
                this.handleAnalysisCompletion(message.data);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }

        this.updateMetrics();
    }

    loadInitialGraph(data) {
        console.log('📥 Loading initial graph data:', data);
        console.log(`📊 Nodes: ${data.nodes?.length || 0}, Edges: ${data.edges?.length || 0}`);

        // Clear existing data
        this.nodes.clear();
        this.edges.clear();

        // Add nodes
        if (data.nodes && data.nodes.length > 0) {
            const visNodes = data.nodes.map(node => this.createVisNode(node));
            console.log('🎯 Adding nodes to DataSet:', visNodes);

            try {
                this.nodes.add(visNodes);
                console.log(`✅ Successfully added ${visNodes.length} nodes to DataSet`);
                console.log('📊 DataSet now contains:', this.nodes.length, 'nodes');
            } catch (error) {
                console.error('❌ Error adding nodes to DataSet:', error);
            }
        }

        // Add edges
        if (data.edges && data.edges.length > 0) {
            const visEdges = data.edges.map(edge => this.createVisEdge(edge));
            console.log('🔗 Adding edges to DataSet:', visEdges);

            try {
                this.edges.add(visEdges);
                console.log(`✅ Successfully added ${visEdges.length} edges to DataSet`);
                console.log('📊 DataSet now contains:', this.edges.length, 'edges');
            } catch (error) {
                console.error('❌ Error adding edges to DataSet:', error);
            }
        }

        // Force network redraw with container size check
        if (this.network) {
            console.log('🔄 Forcing network redraw...');

            // Check container dimensions again
            const container = document.getElementById('network');
            console.log('📐 Container dimensions after data load:', {
                width: container.clientWidth,
                height: container.clientHeight
            });

            this.network.redraw();

            setTimeout(() => {
                console.log('🎯 Fitting network to view...');
                this.network.fit();

                // Force one more redraw to ensure visibility
                setTimeout(() => {
                    console.log('🔄 Final redraw...');
                    this.network.redraw();
                }, 100);
            }, 500);
        }

        // Update sidebar
        this.updateSidebar();
        this.updateMetrics();

        console.log('✅ Graph loaded successfully');
    }

    createVisNode(nodeData) {
        const type = nodeData.type || 'Unknown';

        // Debug logging to understand data structure
        console.log('🔍 Creating vis node:', {
            id: nodeData.id,
            type: type,
            label: nodeData.label,
            name: nodeData.name,
            allData: nodeData
        });

        const visNode = {
            id: nodeData.id,
            label: nodeData.label || nodeData.name || nodeData.id,
            group: type,
            color: nodeData.color || this.nodeColors[type] || '#95A5A6',
            shape: this.nodeShapes[type] || 'dot',
            size: nodeData.size || this.getNodeSize(nodeData),
            title: this.createNodeTooltip(nodeData),
            data: nodeData
        };

        // Apply any additional visual properties from nodeData
        if (nodeData.font) visNode.font = nodeData.font;
        if (nodeData.borderWidth) visNode.borderWidth = nodeData.borderWidth;
        if (nodeData.borderColor) visNode.borderColor = nodeData.borderColor;

        console.log('✅ Created vis node:', visNode);
        return visNode;
    }

    createVisEdge(edgeData) {
        console.log('🔗 Creating vis edge:', {
            id: edgeData.id,
            from: edgeData.from,
            to: edgeData.to,
            type: edgeData.type,
            allData: edgeData
        });

        const visEdge = {
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

        console.log('✅ Created vis edge:', visEdge);
        return visEdge;
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
            LINKS_TO: '#2C3E50',
            COORDINATES_WITH: '#ff6b35',
            OPERATES_IN: '#4a90e2',
            PERFORMS: '#9B59B6'
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
            LINKS_TO: 1,
            COORDINATES_WITH: 3,
            OPERATES_IN: 2,
            PERFORMS: 2
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

        // Log node creation based on type
        let logType = 'system';
        if (nodeData.type === 'Task') logType = 'task';
        else if (nodeData.type === 'File') logType = 'file';
        else if (nodeData.type === 'Analysis') logType = 'analysis';
        else if (nodeData.type === 'GlobalAgent' || nodeData.type === 'Agent') logType = 'agent';

        this.logActivity(logType, `Created: ${nodeData.label || nodeData.id}`);

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

        const agents = nodes.filter(n => n.group === 'Agent' || n.group === 'GlobalAgent').length;
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

    animateFileModification(fileId, operation) {
        const node = this.nodes.get(fileId);
        if (!node) return;

        const baseSize = node.size || 20;

        // Different animations based on operation type
        const operationStyles = {
            'read': {
                size: baseSize * 1.1,
                borderColor: '#3498DB',
                borderWidth: 3
            },
            'write': {
                size: baseSize * 1.3,
                borderColor: '#E74C3C',
                borderWidth: 4
            },
            'update': {
                size: baseSize * 1.2,
                borderColor: '#F39C12',
                borderWidth: 3
            },
            'analyze': {
                size: baseSize * 1.4,
                borderColor: '#9B59B6',
                borderWidth: 5
            }
        };

        const style = operationStyles[operation] || operationStyles['read'];

        // Apply the operation style
        this.nodes.update({
            id: fileId,
            ...style,
            title: `${node.label}\nOperation: ${operation}`
        });

        // Log the file operation
        this.logActivity('file', `${node.label} ${operation} operation (size changed)`);

        // Return to normal size after animation
        setTimeout(() => {
            this.nodes.update({
                id: fileId,
                size: baseSize,
                borderWidth: 2,
                borderColor: this.nodeColors['File'] || '#2C3E50'
            });
        }, 800);
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

        // Animate file modification with size and flash effects
        this.animateFileModification(data.filePath, data.operation);
    }

    handleAgentStatusChange(data) {
        console.log(`🔄 Agent status change: ${data.agent} ${data.oldStatus} → ${data.newStatus}`);

        // Update node visual to indicate activity
        this.animateNodeStatus(data.agentId, data.newStatus);

        // Log the status change
        this.logActivity('agent', `${data.agent}: ${data.oldStatus} → ${data.newStatus}`);

        // Update sidebar immediately
        this.updateSidebar();
    }

    logActivity(type, message) {
        const logContent = document.getElementById('log-content');
        if (!logContent) return;

        const entry = document.createElement('div');
        entry.className = 'log-entry';

        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        entry.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-type log-type-${type}">${type}</span>
            <span class="log-message">${message}</span>
        `;

        logContent.appendChild(entry);

        // Auto-scroll if enabled
        const autoScroll = document.getElementById('auto-scroll');
        if (autoScroll && autoScroll.checked) {
            logContent.scrollTop = logContent.scrollHeight;
        }

        // Limit log entries to prevent memory issues
        const maxEntries = 500;
        while (logContent.children.length > maxEntries) {
            logContent.removeChild(logContent.firstChild);
        }
    }

    animateNodeStatus(nodeId, status) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        // Get base size for calculations
        const baseSize = node.data?.size || this.getNodeSize(node.data || {});

        const statusStyles = {
            'active': {
                borderWidth: 4,
                borderColor: '#00ff00',
                size: baseSize * 1.2, // 20% larger when active
                shadow: {
                    enabled: true,
                    size: 20,
                    color: 'rgba(0, 255, 0, 0.5)'
                }
            },
            'busy': {
                borderWidth: 5,
                borderColor: '#ffaa00',
                size: baseSize * 1.4, // 40% larger when busy
                shadow: {
                    enabled: true,
                    size: 25,
                    color: 'rgba(255, 170, 0, 0.6)'
                }
            },
            'idle': {
                borderWidth: 2,
                borderColor: '#4a90e2',
                size: baseSize * 0.9, // 10% smaller when idle
                shadow: {
                    enabled: true,
                    size: 10,
                    color: 'rgba(74, 144, 226, 0.3)'
                }
            },
            'completed': {
                borderWidth: 3,
                borderColor: '#27ae60',
                size: baseSize * 1.1, // 10% larger when completed
                shadow: {
                    enabled: true,
                    size: 15,
                    color: 'rgba(39, 174, 96, 0.4)'
                }
            },
            'configured': {
                borderWidth: 2,
                borderColor: '#888888',
                size: baseSize, // Normal size when configured
                shadow: {
                    enabled: false
                }
            }
        };

        const style = statusStyles[status] || statusStyles['configured'];

        // Apply the status style with smooth animation
        this.nodes.update({
            id: nodeId,
            ...style,
            title: `${node.label}\nStatus: ${status}`
        });

        // Add pulsing effect for active/busy states
        if (status === 'active' || status === 'busy') {
            this.addPulsingEffect(nodeId, status);
        } else {
            this.removePulsingEffect(nodeId);
        }

        // Log the visual change
        this.logActivity('system', `Node ${node.label} resized for status: ${status}`);
    }

    addPulsingEffect(nodeId, status) {
        // Remove any existing pulse
        this.removePulsingEffect(nodeId);

        const pulseColors = {
            'active': '#00ff00',
            'busy': '#ffaa00'
        };

        const pulseColor = pulseColors[status] || '#4a90e2';
        let pulseSize = 3;
        let growing = true;

        // Store interval ID for cleanup
        if (!this.pulseIntervals) {
            this.pulseIntervals = {};
        }

        this.pulseIntervals[nodeId] = setInterval(() => {
            if (growing) {
                pulseSize += 1;
                if (pulseSize >= 6) growing = false;
            } else {
                pulseSize -= 1;
                if (pulseSize <= 3) growing = true;
            }

            const node = this.nodes.get(nodeId);
            if (node) {
                this.nodes.update({
                    id: nodeId,
                    borderWidth: pulseSize
                });
            }
        }, 200);
    }

    removePulsingEffect(nodeId) {
        if (this.pulseIntervals && this.pulseIntervals[nodeId]) {
            clearInterval(this.pulseIntervals[nodeId]);
            delete this.pulseIntervals[nodeId];
        }
    }

    removeEdge(edgeId) {
        console.log(`🗑️ Removing edge: ${edgeId}`);
        try {
            this.edges.remove(edgeId);
        } catch (error) {
            console.warn('Edge not found for removal:', edgeId);
        }
    }

    handleAnalysisCompletion(data) {
        console.log(`✅ Analysis completed: ${data.id}`);

        // Animate completion
        const node = this.nodes.get(data.id);
        if (node) {
            this.nodes.update({
                id: data.id,
                color: '#27AE60', // Success green
                borderWidth: 4,
                borderColor: '#00ff00'
            });

            // Reset border after animation
            setTimeout(() => {
                this.nodes.update({
                    id: data.id,
                    borderWidth: 2,
                    borderColor: '#27AE60'
                });
            }, 1000);
        }
    }

    // DEPRECATED: Replaced with node-based activity visualization
    // showStatusNotification() - removed in favor of animateNodeStatus()

    getStatusColor(status) {
        const colors = {
            'active': '#00ff00',
            'busy': '#ffaa00',
            'idle': '#4a90e2',
            'configured': '#888888',
            'completed': '#27ae60'
        };
        return colors[status] || '#888888';
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

// Global theme manager
let themeManager = null;

// Pane visibility state
const paneState = {
    sidebar: true,
    network: true,
    details: true,
    console: true
};

// Console management
const consoleOutput = {
    maxEntries: 100,
    entries: []
};

// Global functions for controls
function changeTheme(themeName) {
    if (themeName && themeManager) {
        themeManager.applyTheme(themeName);
    }
}

function togglePane(paneName) {
    const app = document.getElementById('app');
    const button = document.querySelector(`[data-pane="${paneName}"]`);
    const pane = document.getElementById(paneName);

    paneState[paneName] = !paneState[paneName];

    if (paneState[paneName]) {
        // Show pane
        app.classList.remove(`hide-${paneName}`);
        if (pane) pane.classList.remove('pane-hidden');
        button.classList.add('active');
    } else {
        // Hide pane
        app.classList.add(`hide-${paneName}`);
        if (pane) pane.classList.add('pane-hidden');
        button.classList.remove('active');
    }

    // Force network redraw when visibility changes
    if (paneName === 'network' || window.swarmVis) {
        setTimeout(() => {
            if (window.swarmVis && window.swarmVis.network) {
                window.swarmVis.network.redraw();
                window.swarmVis.network.fit();
            }
        }, 350); // After transition
    }

    // Save pane state
    localStorage.setItem('swarm-viz-panes', JSON.stringify(paneState));
}

function loadPaneState() {
    const saved = localStorage.getItem('swarm-viz-panes');
    if (saved) {
        Object.assign(paneState, JSON.parse(saved));

        // Apply saved state
        const app = document.getElementById('app');
        Object.entries(paneState).forEach(([paneName, isVisible]) => {
            const button = document.querySelector(`[data-pane="${paneName}"]`);
            const pane = document.getElementById(paneName);

            if (!isVisible) {
                app.classList.add(`hide-${paneName}`);
                if (pane) pane.classList.add('pane-hidden');
                if (button) button.classList.remove('active');
            }
        });
    }
}

function logToConsole(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, message, level };

    consoleOutput.entries.push(entry);

    // Keep only recent entries
    if (consoleOutput.entries.length > consoleOutput.maxEntries) {
        consoleOutput.entries.shift();
    }

    // Update console display
    updateConsoleDisplay();
}

function updateConsoleDisplay() {
    const output = document.getElementById('console-output');
    if (!output) return;

    const html = consoleOutput.entries.map(entry => `
        <div class="console-entry">
            <span class="console-timestamp">${entry.timestamp}</span>
            <span class="console-level-${entry.level}">${entry.message}</span>
        </div>
    `).join('');

    output.innerHTML = html;
    output.scrollTop = output.scrollHeight;
}

function clearConsole() {
    consoleOutput.entries = [];
    updateConsoleDisplay();
    logToConsole('Console cleared', 'info');
}

// Initialize visualization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM Content Loaded - Initializing SwarmVisualization');
    try {
        // Initialize theme manager
        themeManager = new ThemeManager();
        themeManager.loadSavedTheme();
        console.log('🎨 Theme manager initialized');

        swarmVis = new SwarmVisualization();
        console.log('✅ SwarmVisualization initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize SwarmVisualization:', error);
    }
});

// Clear log function
function clearLog() {
    const logContent = document.getElementById('log-content');
    if (logContent) {
        logContent.innerHTML = '';
        if (swarmVis) {
            swarmVis.logActivity('system', 'Log cleared');
        }
    }
}
