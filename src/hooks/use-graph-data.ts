import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { LibraryItem, Collection, CollectionItem } from '@/hooks/use-library';

interface Reflection {
  id: string;
  message: string;
  mood: string | null;
  tags: string[] | null;
  context: string | null;
  created_at: string;
  is_favorite: boolean;
}

export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  nodeType: 'reflection' | 'tag' | 'mood' | 'library_item' | 'collection';
  sublabel?: string;
  count?: number;
  emoji?: string;
  onClick?: () => void;
  entityId?: string; // original reflection/library_item id
}

const MOOD_EMOJIS: Record<string, string> = {
  fomo: '😰', excited: '🤩', greedy: '🤑', anxious: '😟',
  calm: '😌', detached: '😐', uncertain: '🤔', fearful: '😨',
};

const MOOD_COLORS: Record<string, string> = {
  fomo: 'hsl(var(--destructive))',
  excited: 'hsl(var(--chart-4))',
  greedy: 'hsl(var(--chart-5))',
  anxious: 'hsl(var(--chart-3))',
  calm: 'hsl(var(--chart-1))',
  detached: 'hsl(var(--muted-foreground))',
  uncertain: 'hsl(var(--chart-2))',
  fearful: 'hsl(var(--destructive))',
};

export function useGraphData(
  reflections: Reflection[],
  libraryItems: LibraryItem[],
  collections: Collection[],
  collectionItems: CollectionItem[],
) {
  return useMemo(() => {
    const nodes: Node<GraphNodeData>[] = [];
    const edges: Edge[] = [];
    const tagCounts = new Map<string, number>();

    // Count tag occurrences first
    reflections.forEach((r) => {
      r.tags?.forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1));
    });
    libraryItems.forEach((li) => {
      li.tags?.forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1));
    });

    // Mood nodes
    const usedMoods = new Set(reflections.map((r) => r.mood).filter(Boolean) as string[]);
    usedMoods.forEach((mood) => {
      nodes.push({
        id: `mood-${mood}`,
        type: 'moodNode',
        position: { x: 0, y: 0 },
        data: {
          label: mood,
          nodeType: 'mood',
          emoji: MOOD_EMOJIS[mood] || '❓',
          count: reflections.filter((r) => r.mood === mood).length,
        },
      });
    });

    // Tag nodes
    tagCounts.forEach((count, tag) => {
      nodes.push({
        id: `tag-${tag}`,
        type: 'tagNode',
        position: { x: 0, y: 0 },
        data: { label: tag, nodeType: 'tag', count },
      });
    });

    // Collection nodes
    collections.forEach((col) => {
      nodes.push({
        id: `col-${col.id}`,
        type: 'collectionNode',
        position: { x: 0, y: 0 },
        data: {
          label: col.name,
          nodeType: 'collection',
          emoji: col.icon || '📂',
          count: collectionItems.filter((ci) => ci.collection_id === col.id).length,
        },
      });
    });

    // Reflection nodes + edges
    reflections.forEach((r) => {
      nodes.push({
        id: `ref-${r.id}`,
        type: 'reflectionNode',
        position: { x: 0, y: 0 },
        data: {
          label: r.message.slice(0, 60) + (r.message.length > 60 ? '…' : ''),
          nodeType: 'reflection',
          sublabel: r.context || undefined,
          entityId: r.id,
        },
      });

      if (r.mood) {
        edges.push({
          id: `e-ref-${r.id}-mood-${r.mood}`,
          source: `ref-${r.id}`,
          target: `mood-${r.mood}`,
          type: 'default',
          style: { stroke: MOOD_COLORS[r.mood] || 'hsl(var(--border))', strokeWidth: 1, opacity: 0.4 },
        });
      }

      r.tags?.forEach((tag) => {
        edges.push({
          id: `e-ref-${r.id}-tag-${tag}`,
          source: `ref-${r.id}`,
          target: `tag-${tag}`,
          type: 'default',
          style: { stroke: 'hsl(var(--primary) / 0.3)', strokeWidth: 1 },
        });
      });
    });

    // Library item nodes + edges
    libraryItems.forEach((li) => {
      nodes.push({
        id: `lib-${li.id}`,
        type: 'libraryNode',
        position: { x: 0, y: 0 },
        data: {
          label: li.title || li.body?.slice(0, 40) || 'Untitled',
          nodeType: 'library_item',
          sublabel: li.type,
        },
      });

      li.tags?.forEach((tag) => {
        if (tagCounts.has(tag)) {
          edges.push({
            id: `e-lib-${li.id}-tag-${tag}`,
            source: `lib-${li.id}`,
            target: `tag-${tag}`,
            type: 'default',
            style: { stroke: 'hsl(var(--primary) / 0.2)', strokeWidth: 1 },
          });
        }
      });

      if (li.reflection_id) {
        const refNode = `ref-${li.reflection_id}`;
        edges.push({
          id: `e-lib-${li.id}-ref-${li.reflection_id}`,
          source: `lib-${li.id}`,
          target: refNode,
          type: 'default',
          style: { stroke: 'hsl(var(--accent-foreground) / 0.3)', strokeWidth: 1 },
        });
      }
    });

    // Collection → Library item edges
    collectionItems.forEach((ci) => {
      edges.push({
        id: `e-col-${ci.collection_id}-lib-${ci.library_item_id}`,
        source: `col-${ci.collection_id}`,
        target: `lib-${ci.library_item_id}`,
        type: 'default',
        style: { stroke: 'hsl(var(--accent-foreground) / 0.2)', strokeWidth: 1 },
      });
    });

    // Filter edges that reference non-existent nodes
    const nodeIds = new Set(nodes.map((n) => n.id));
    const validEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    return { nodes, edges: validEdges };
  }, [reflections, libraryItems, collections, collectionItems]);
}
