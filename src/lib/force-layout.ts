/**
 * Simple force-directed layout using velocity Verlet integration.
 * No external dependencies needed.
 */

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  group: string; // nodeType for grouping
}

interface LayoutEdge {
  source: string;
  target: string;
}

interface ForceLayoutOptions {
  iterations?: number;
  repulsion?: number;
  attraction?: number;
  damping?: number;
  idealDistance?: number;
  centerStrength?: number;
  groupStrength?: number;
}

const GROUP_Y_TARGETS: Record<string, number> = {
  mood: -300,
  tag: -150,
  collection: -200,
  reflection: 100,
  library_item: 300,
};

export function forceLayout(
  nodeIds: { id: string; group: string }[],
  edgeList: LayoutEdge[],
  options: ForceLayoutOptions = {},
): Map<string, { x: number; y: number }> {
  const {
    iterations = 120,
    repulsion = 6000,
    attraction = 0.008,
    damping = 0.85,
    idealDistance = 140,
    centerStrength = 0.01,
    groupStrength = 0.03,
  } = options;

  // Initialize nodes in a spread-out circle to avoid local minima
  const nodes: LayoutNode[] = nodeIds.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodeIds.length;
    const radius = 200 + Math.random() * 100;
    return {
      id: n.id,
      x: Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
      y: (GROUP_Y_TARGETS[n.group] ?? 0) + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
      group: n.group,
    };
  });

  const nodeMap = new Map<string, LayoutNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Build adjacency for quick lookup
  const adjacency = new Map<string, Set<string>>();
  edgeList.forEach(({ source, target }) => {
    if (!adjacency.has(source)) adjacency.set(source, new Set());
    if (!adjacency.has(target)) adjacency.set(target, new Set());
    adjacency.get(source)!.add(target);
    adjacency.get(target)!.add(source);
  });

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations; // cooling

    // Repulsion between all pairs (Barnes-Hut would be better for large N, but fine for <500 nodes)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(distSq);
        const force = (repulsion * alpha) / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Attraction along edges
    edgeList.forEach(({ source, target }) => {
      const a = nodeMap.get(source);
      const b = nodeMap.get(target);
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy + 1);
      const force = (dist - idealDistance) * attraction * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    });

    // Center gravity
    nodes.forEach((n) => {
      n.vx -= n.x * centerStrength * alpha;
      n.vy -= n.y * centerStrength * alpha;
    });

    // Group attraction (pull towards row bands)
    nodes.forEach((n) => {
      const targetY = GROUP_Y_TARGETS[n.group] ?? 0;
      n.vy += (targetY - n.y) * groupStrength * alpha;
    });

    // Apply velocities with damping
    nodes.forEach((n) => {
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx;
      n.y += n.vy;
    });
  }

  const result = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => result.set(n.id, { x: Math.round(n.x), y: Math.round(n.y) }));
  return result;
}
