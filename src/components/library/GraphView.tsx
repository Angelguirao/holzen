import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useLibrary } from '@/hooks/use-library';
import type { LibraryItem } from '@/hooks/use-library';
import { useGraphData, type GraphNodeData } from '@/hooks/use-graph-data';
import { nodeTypes } from './graph/GraphNodes';
import { ItemDetailViewer } from './ItemDetailViewer';
import { useTranslation } from 'react-i18next';
import { forceLayout } from '@/lib/force-layout';

interface Reflection {
  id: string;
  message: string;
  mood: string | null;
  tags: string[] | null;
  context: string | null;
  created_at: string;
  is_favorite: boolean;
}

function applyForceLayout(nodes: Node<GraphNodeData>[], edges: { source: string; target: string }[]): Node<GraphNodeData>[] {
  if (nodes.length === 0) return nodes;
  const positions = forceLayout(
    nodes.map((n) => ({ id: n.id, group: n.data.nodeType })),
    edges,
    { iterations: 150 },
  );
  return nodes.map((n) => ({
    ...n,
    position: positions.get(n.id) ?? n.position,
  }));
}

export default function GraphView() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const library = useLibrary();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  // Item viewer state
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

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

  // Inject click handlers into node data
  const nodesWithHandlers = useMemo(() => {
    return rawNodes.map((node) => {
      const data = { ...node.data };
      const entityId = data.entityId;

      if (data.nodeType === 'library_item' && entityId) {
        data.onClick = () => {
          const item = library.items.find((i) => i.id === entityId);
          if (item) setSelectedItem(item);
        };
      } else if (data.nodeType === 'reflection' && entityId) {
        data.onClick = () => {
          // Find the library item that represents this reflection
          const item = library.items.find((i) => i.reflection_id === entityId && i.source_type === 'reflection');
          if (item) setSelectedItem(item);
        };
      }
      // Tags, moods, collections — no detail viewer yet, could be added later

      return { ...node, data };
    });
  }, [rawNodes, library.items]);

  const laidOutNodes = useMemo(
    () => applyForceLayout(nodesWithHandlers, rawEdges),
    [nodesWithHandlers, rawEdges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(laidOutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges);

  useEffect(() => {
    setNodes(applyForceLayout(nodesWithHandlers, rawEdges));
    setEdges(rawEdges);
  }, [nodesWithHandlers, rawEdges, setNodes, setEdges]);

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

  // Linked items for viewer
  const selectedLinkedItems = useMemo(() => {
    if (!selectedItem?.reflection_id || selectedItem.source_type !== 'reflection') return undefined;
    return library.items.filter(
      (i) => i.reflection_id === selectedItem.reflection_id && i.id !== selectedItem.id,
    );
  }, [selectedItem, library.items]);

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
    { key: 'reflection', label: '● Reflections' },
    { key: 'tag', label: '● Tags' },
    { key: 'mood', label: '● Moods' },
    { key: 'library_item', label: '■ Items' },
    { key: 'collection', label: '📂 Collections' },
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
          minZoom={0.15}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            animated: false,
            style: { strokeWidth: 1 },
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="!bg-background" />
          <Controls
            showInteractive={false}
            className="!bg-card !border-border/40 !shadow-sm [&>button]:!bg-card [&>button]:!border-border/40 [&>button]:!text-foreground [&>button:hover]:!bg-accent"
          />
        </ReactFlow>
      </div>

      {/* Item detail viewer */}
      <ItemDetailViewer
        item={selectedItem}
        linkedItems={selectedLinkedItems}
        allItems={library.items}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onToggleFavorite={library.toggleFavorite}
        onSelectItem={setSelectedItem}
      />
    </div>
  );
}
