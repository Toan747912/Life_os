"use client";

import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';

export default function KnowledgeGraph() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/graph/data');
                // Backend returns { nodes: [], edges: [] }
                setNodes(res.data.nodes || []);
                setEdges(res.data.edges || []);
            } catch (error) {
                console.error("Failed to fetch graph data:", error);
            }
        };
        fetchData();
    }, [setNodes, setEdges]);

    return (
        <div className="w-full h-[600px] border border-gray-200 rounded-lg shadow-sm bg-white">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}
