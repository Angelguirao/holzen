import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useLibrary } from '@/hooks/use-library';
import { useGraphData, type GraphNodeData } from '@/hooks/use-graph-data';
import { nodeTypes } from './graph/GraphNodes';
import { useTranslation } from 'react-i18next';

interface Reflection {
  id: string;
  message: string;
  mood: string | null;
  tags: string[] | null;
  context: string | null;
  created_at: string;
  is_favorite: boolean;
}

// Simple force layout since @xyflow doesn't include one
function applySimpleLayout(nodes: Node<GraphNodeData>[]): Node<GraphNodeData>[] {
  const byType: Record<string, Node<GraphNodeData>[]> = {};
  nodes.forEach((n) => {
    const t = n.data.nodeType;
    if (!byType[t]) byType[t] = [];
    byType[t].push(n);
  });

  const rows = ['mood', 'tag', 'collection', 'reflection', 'library_item'];
  let y = 0;

  return nodes.map((node) => {
    const type = node.data.nodeType;
    const rowIdx = rows.indexOf(type);
    const group = byType[type] || [];
    const idx = group.indexOf(node);
    const cols = group.length;
    const spacing = type === 'reflection' || type === 'library_item' ? 200 : 160;
    const rowY = rowIdx * 180;
    const x = (idx - (cols - 1) / 2) * spacing;

    return { ...node, position: { x, y: rowY } };
  });
}

export default function GraphView() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const library = useLibrary();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('reflections')
      .select('id, message, mood, tags, context, created_at, is_favorite')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setReflections((data as Reflection[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const { nodes: rawNodes, edges: rawEdges } = useGraphData(
    reflections,
    library.items,
    library.collections,
    library.collectionItems,
  );

  const laidOutNodes = useMemo(() => applySimpleLayout(rawNodes), [rawNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(laidOutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges);

  useEffect(() => {
    setNodes(applySimpleLayout(rawNodes));
    setEdges(rawEdges);
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  const [filter, setFilter] = useState<string[]>(['reflection', 'tag', 'mood', 'library_item', 'collection']);

  const filteredNodes = useMemo(
    () => nodes.filter((n) => filter.includes((n.data as GraphNodeData).nodeType)),
    [nodes, filter],
  );
  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const filteredEdges = useMemo(
    () => edges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)),
    [edges, filteredNodeIds],
  );

  const toggleFilter = (type: string) => {
    setFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  if (loading || library.loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-xs font-mono text-muted-foreground/40 animate-pulse">Loading graph…</p>
      </div>
    );
  }

  if (rawNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-xs font-mono text-muted-foreground/40">
          {t('library.graphEmpty', 'No data yet. Complete reflections and save items to build your graph.')}
        </p>
      </div>
    );
  }

  const FILTERS = [
    { key: 'reflection', label: '● Reflections', emoji: '' },
    { key: 'tag', label: '● Tags', emoji: '' },
    { key: 'mood', label: '● Moods', emoji: '' },
    { key: 'library_item', label: '■ Items', emoji: '' },
    { key: 'collection', label: '📂 Collections', emoji: '' },
  ];

  return (
    <div className="space-y-2">
      {/* Filter toggles */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`text-[9px] font-mono px-2 py-0.5 rounded transition-colors ${
              filter.includes(key)
                ? 'bg-primary/10 text-foreground'
                : 'text-muted-foreground/30 line-through'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="text-[9px] font-mono text-muted-foreground/30 ml-auto">
          {filteredNodes.length} nodes · {filteredEdges.length} edges
        </span>
      </div>

      {/* Graph */}
      <div className="h-[500px] rounded-md border border-border/40 overflow-hidden bg-background">
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="!bg-background" />
          <Controls
            showInteractive={false}
            className="!bg-card !border-border/40 !shadow-sm [&>button]:!bg-card [&>button]:!border-border/40 [&>button]:!text-foreground [&>button:hover]:!bg-accent"
          />
          <MiniMap
            nodeColor={(node) => {
              const t = (node.data as GraphNodeData)?.nodeType;
              if (t === 'mood') return 'hsl(var(--chart-4))';
              if (t === 'tag') return 'hsl(var(--primary))';
              if (t === 'collection') return 'hsl(var(--secondary))';
              if (t === 'library_item') return 'hsl(var(--accent))';
              return 'hsl(var(--foreground))';
            }}
            className="!bg-card !border-border/40"
            maskColor="hsl(var(--background) / 0.8)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
