import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { GraphNodeData } from '@/hooks/use-graph-data';

const baseHandle = 'w-1.5 h-1.5 !bg-border !border-0 !min-w-0 !min-h-0';

export const ReflectionNode = memo(({ data }: { data: GraphNodeData }) => (
  <div
    className="px-2.5 py-1.5 rounded-full bg-card border border-border/60 shadow-sm max-w-[140px] cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
    onClick={() => data.onClick?.()}
  >
    <Handle type="target" position={Position.Top} className={baseHandle} />
    <p className="text-[9px] font-mono text-foreground truncate leading-tight">{data.label}</p>
    {data.sublabel && (
      <p className="text-[8px] font-mono text-muted-foreground/50 truncate">{data.sublabel}</p>
    )}
    <Handle type="source" position={Position.Bottom} className={baseHandle} />
  </div>
));
ReflectionNode.displayName = 'ReflectionNode';

export const TagNode = memo(({ data }: { data: GraphNodeData }) => (
  <div
    className="px-2 py-1 rounded-md bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
    onClick={() => data.onClick?.()}
  >
    <Handle type="target" position={Position.Top} className={baseHandle} />
    <p className="text-[9px] font-mono text-primary font-medium">{data.label}</p>
    {data.count && data.count > 1 && (
      <p className="text-[7px] font-mono text-primary/50 text-center">{data.count}</p>
    )}
    <Handle type="source" position={Position.Bottom} className={baseHandle} />
  </div>
));
TagNode.displayName = 'TagNode';

export const MoodNode = memo(({ data }: { data: GraphNodeData }) => (
  <div
    className="flex flex-col items-center gap-0.5 cursor-pointer hover:scale-110 transition-transform"
    onClick={() => data.onClick?.()}
  >
    <Handle type="target" position={Position.Top} className={baseHandle} />
    <span className="text-lg">{data.emoji}</span>
    <p className="text-[8px] font-mono text-muted-foreground">{data.label}</p>
    {data.count && <p className="text-[7px] font-mono text-muted-foreground/50">{data.count}×</p>}
    <Handle type="source" position={Position.Bottom} className={baseHandle} />
  </div>
));
MoodNode.displayName = 'MoodNode';

export const LibraryNode = memo(({ data }: { data: GraphNodeData }) => (
  <div
    className="px-2 py-1.5 rounded-sm bg-accent/50 border border-accent-foreground/10 max-w-[120px] cursor-pointer hover:bg-accent/80 hover:shadow-sm transition-all"
    onClick={() => data.onClick?.()}
  >
    <Handle type="target" position={Position.Top} className={baseHandle} />
    <p className="text-[9px] font-mono text-foreground truncate">{data.label}</p>
    {data.sublabel && (
      <p className="text-[7px] font-mono text-muted-foreground/50">{data.sublabel}</p>
    )}
    <Handle type="source" position={Position.Bottom} className={baseHandle} />
  </div>
));
LibraryNode.displayName = 'LibraryNode';

export const CollectionNode = memo(({ data }: { data: GraphNodeData }) => (
  <div
    className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md bg-secondary/50 border border-border/40 cursor-pointer hover:bg-secondary/80 transition-colors"
    onClick={() => data.onClick?.()}
  >
    <Handle type="target" position={Position.Top} className={baseHandle} />
    <span className="text-sm">{data.emoji}</span>
    <p className="text-[9px] font-mono text-foreground font-medium">{data.label}</p>
    {data.count !== undefined && (
      <p className="text-[7px] font-mono text-muted-foreground/50">{data.count} items</p>
    )}
    <Handle type="source" position={Position.Bottom} className={baseHandle} />
  </div>
));
CollectionNode.displayName = 'CollectionNode';

export const nodeTypes = {
  reflectionNode: ReflectionNode,
  tagNode: TagNode,
  moodNode: MoodNode,
  libraryNode: LibraryNode,
  collectionNode: CollectionNode,
};
