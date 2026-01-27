"use client";
import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Drawer Component (Simple implementation for now)
function Drawer({ isOpen, onClose, title, content }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 p-6 transform transition-transform border-l border-gray-200 overflow-y-auto text-black">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{title}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
            </div>
            <div className="prose">
                {content}
            </div>
        </div>
    );
}

export default function BrainGraph() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);

    const fetchGraphData = useCallback(async () => {
        try {
            // Assuming we have an API to get graph data (nodes logic)
            // For now, let's fetch posts and map them
            const res = await fetch('http://localhost:8080/api/posts'); // Adjust URL as needed
            let posts = await res.json();

            // Safe check: if posts is not an array, default to empty array
            if (!Array.isArray(posts)) {
                console.warn("Graph Data Warning: Expected array but got:", posts);
                posts = [];
            }

            const newNodes = posts.map((post, index) => ({
                id: post.id.toString(),
                position: { x: (index % 5) * 200, y: Math.floor(index / 5) * 150 },
                data: { label: post.title, content: post.content },
                type: 'default', // or custom node type
            }));

            // For edges, we need a link API or calculate them. STUB for now.
            const newEdges = [];

            setNodes(newNodes);
            setEdges(newEdges);
        } catch (err) {
            console.error("Failed to fetch graph data", err);
        }
    }, [setNodes, setEdges]);

    useEffect(() => {
        fetchGraphData();
    }, [fetchGraphData]);

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onNodeClick = (event, node) => {
        setSelectedNode(node);
    };

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                fitView
            >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
                <Panel position="top-right">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded shadow" onClick={fetchGraphData}>
                        Refresh Brain
                    </button>
                </Panel>
            </ReactFlow>

            <Drawer
                isOpen={!!selectedNode}
                onClose={() => setSelectedNode(null)}
                title={selectedNode?.data.label}
                content={selectedNode?.data.content}
            />
        </div>
    );
}
