import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';

export const GraphView = ({ apiUrl, onNodeClick }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredNode, setHoveredNode] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetch(`${apiUrl}/graph/data`)
            .then(res => res.json())
            .then(data => {
                if (data.nodes) {
                    // Spread nodes out if they are all at 0,0 (server logic was random, which is fine)
                    setNodes(data.nodes);
                }
                if (data.edges) setEdges(data.edges);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [apiUrl, setNodes, setEdges]);

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    if (loading) return <div className="h-full flex items-center justify-center text-slate-400">Loading Brain Map...</div>;

    return (
        <div className="w-full h-[600px] bg-slate-50 rounded-3xl overflow-hidden border border-slate-200">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => onNodeClick && onNodeClick(node)}
                onNodeMouseEnter={(_, node) => setHoveredNode(node)}
                onNodeMouseLeave={() => setHoveredNode(null)}
                fitView
            >
                <Background color="#cbd5e1" gap={16} />
                <Controls />
                <MiniMap style={{ height: 100 }} zoomable pannable />
            </ReactFlow>
            {hoveredNode && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 z-50 animate-fade-in pointer-events-none min-w-[200px]">
                    <h4 className="font-bold text-indigo-900 text-lg">{hoveredNode.data.label}</h4>
                    <span className="inline-block mt-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">{hoveredNode.data.type}</span>
                </div>
            )}
        </div>
    );
};
