#!/usr/bin/env node
/**
 * Debug client to test WebSocket connection and data flow
 */

const WebSocket = require('ws');

console.log('🔍 Debug Client - Testing Visualization WebSocket');
console.log('=' .repeat(60));

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log('📥 Received message:');
        console.log(`   Type: ${message.type}`);

        if (message.type === 'initial') {
            console.log(`   📊 Nodes: ${message.data.nodes?.length || 0}`);
            console.log(`   🔗 Edges: ${message.data.edges?.length || 0}`);

            if (message.data.nodes) {
                console.log('   📋 Node Details:');
                message.data.nodes.forEach((node, i) => {
                    console.log(`      ${i + 1}. ${node.label} (${node.type}) - ID: ${node.id}`);
                });
            }

            if (message.data.edges) {
                console.log('   🔗 Edge Details:');
                message.data.edges.forEach((edge, i) => {
                    console.log(`      ${i + 1}. ${edge.from} → ${edge.to} (${edge.type})`);
                });
            }
        }

        console.log('');
    } catch (error) {
        console.error('❌ Error parsing message:', error);
        console.log('Raw data:', data.toString());
    }
});

ws.on('close', () => {
    console.log('🔌 Connection closed');
    process.exit(0);
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    process.exit(1);
});

// Auto-close after 5 seconds
setTimeout(() => {
    console.log('⏰ Closing connection after 5 seconds');
    ws.close();
}, 5000);