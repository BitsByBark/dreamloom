import type { PreviewDomTreeNode } from "$panels/center/preview-bridge";

export const componentTree = $state({
  tree: null as PreviewDomTreeNode | null,
  selectedPath: [] as number[],
  expandedPaths: new Set<string>(),
});

export function pathKey(path: number[]): string {
  return path.join(",");
}

export function clearComponentTree(): void {
  componentTree.tree = null;
  componentTree.selectedPath = [];
  componentTree.expandedPaths = new Set();
}

function expandPathPrefixes(path: number[]): void {
  const next = new Set(componentTree.expandedPaths);
  for (let i = 0; i <= path.length; i++) {
    next.add(pathKey(path.slice(0, i)));
  }
  componentTree.expandedPaths = next;
}

export function setComponentTree(tree: PreviewDomTreeNode, selectedPath: number[]): void {
  componentTree.tree = tree;
  componentTree.selectedPath = selectedPath;
  expandPathPrefixes(selectedPath);
}

export function isExpanded(path: number[]): boolean {
  return componentTree.expandedPaths.has(pathKey(path));
}

export function toggleExpanded(path: number[]): void {
  const key = pathKey(path);
  const next = new Set(componentTree.expandedPaths);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  componentTree.expandedPaths = next;
}

export function pathsEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function nodeAtPath(tree: PreviewDomTreeNode, path: number[]): PreviewDomTreeNode | null {
  let current: PreviewDomTreeNode = tree;

  for (const index of path) {
    const child = current.children[index];
    if (!child) {
      return null;
    }
    current = child;
  }

  return current;
}

/** Walk from leaf to root; first node with dl-* wins. */
export function nearestDlAlongPath(
  tree: PreviewDomTreeNode,
  path: number[],
): { dlClass: string } | null {
  for (let len = path.length; len >= 0; len--) {
    const node = nodeAtPath(tree, path.slice(0, len));
    if (node?.dlClass) {
      return { dlClass: node.dlClass };
    }
  }

  return null;
}

/** Walk from leaf to root; first node with id wins. */
export function nearestIdAlongPath(
  tree: PreviewDomTreeNode,
  path: number[],
): { id: string } | null {
  for (let len = path.length; len >= 0; len--) {
    const node = nodeAtPath(tree, path.slice(0, len));
    if (node?.id) {
      return { id: node.id };
    }
  }

  return null;
}

export function domNodeLabel(node: PreviewDomTreeNode): string {
  let label = node.tagName;
  if (node.id) {
    label += `#${node.id}`;
  }
  if (node.dlClass) {
    label += ` ${node.dlClass}`;
  }
  return label;
}
