import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitFork, Star, User, ChevronDown, ChevronRight, Crown, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardBody } from './Card';
import { Button } from './Button';

interface AncestryNode {
  id: string;
  title: string;
  original_recipe_id: string | null;
  created_by: string;
  author_username: string;
  star_count: number;
  fork_count: number;
  created_at: string;
  depth: number;
  is_current: boolean;
}

interface TreeNode extends AncestryNode {
  children: TreeNode[];
}

interface ForkAncestryTreeProps {
  recipeId: string;
  compact?: boolean;
}

export function ForkAncestryTree({ recipeId, compact = false }: ForkAncestryTreeProps) {
  const navigate = useNavigate();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showFullTree, setShowFullTree] = useState(!compact);

  const loadAncestryTree = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase.rpc('get_recipe_ancestry_tree', {
      p_recipe_id: recipeId,
    });

    if (error) {
      console.error('Error loading ancestry tree:', error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    // Build tree structure from flat data
    const tree = buildTree(data as AncestryNode[]);
    setTree(tree);
    
    // Auto-expand the path to current recipe
    const currentPath = new Set<string>();
    data.forEach((node: AncestryNode) => {
      if (node.depth <= 0) {
        currentPath.add(node.id);
      }
    });
    setExpanded(currentPath);
    
    setLoading(false);
  }, [recipeId]);

  useEffect(() => {
    loadAncestryTree();
  }, [loadAncestryTree]);

  const buildTree = (nodes: AncestryNode[]): TreeNode | null => {
    if (nodes.length === 0) return null;

    // Find the root (most negative depth or no parent)
    const root = nodes.find(n => n.depth === Math.min(...nodes.map(x => x.depth)));
    if (!root) return null;

    const nodeMap = new Map<string, TreeNode>();
    
    // Initialize all nodes
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Build parent-child relationships
    nodes.forEach(node => {
      if (node.original_recipe_id && nodeMap.has(node.original_recipe_id)) {
        const parent = nodeMap.get(node.original_recipe_id)!;
        const child = nodeMap.get(node.id)!;
        parent.children.push(child);
      }
    });

    // Sort children by star count (most popular first)
    nodeMap.forEach(node => {
      node.children.sort((a, b) => b.star_count - a.star_count);
    });

    return nodeMap.get(root.id) || null;
  };

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpanded(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.getFullYear().toString();
  };

  const renderNode = (node: TreeNode, isLast: boolean = true, prefix: string = '') => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isCurrent = node.is_current;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer
            ${isCurrent 
              ? 'bg-emerald-100 border-2 border-emerald-500 shadow-md' 
              : 'hover:bg-gray-100 border-2 border-transparent'
            }
          `}
          onClick={() => {
            if (isCurrent) {
              if (hasChildren) toggleExpand(node.id);
            } else {
              navigate(`/recipe/${node.id}`);
            }
          }}
        >
          {/* Expand/Collapse button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Node icon */}
          {node.original_recipe_id === null ? (
            <Crown size={18} className="text-amber-500 flex-shrink-0" title="Original Recipe" />
          ) : isCurrent ? (
            <Sparkles size={18} className="text-emerald-600 flex-shrink-0" title="You are here" />
          ) : (
            <GitFork size={18} className="text-gray-400 flex-shrink-0" />
          )}

          {/* Recipe info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span 
                className={`font-medium truncate ${isCurrent ? 'text-emerald-800' : 'text-gray-900'}`}
                title={node.title}
              >
                {node.title}
              </span>
              {isCurrent && (
                <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  You're here
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <User size={12} />
                {node.author_username || 'Unknown'}
              </span>
              <span>{formatDate(node.created_at)}</span>
              <span className="flex items-center gap-1">
                <Star size={12} />
                {node.star_count}
              </span>
              {node.fork_count > 0 && (
                <span className="flex items-center gap-1">
                  <GitFork size={12} />
                  {node.fork_count}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-6 pl-4 border-l-2 border-gray-200">
            {node.children.map((child, index) => 
              renderNode(child, index === node.children.length - 1, prefix + (isLast ? '    ' : '│   '))
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-gray-500">Loading ancestry tree...</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!tree) {
    return null; // No ancestry to show (original recipe with no forks)
  }

  // Check if there's any ancestry to show (more than just the current recipe)
  const hasAncestry = tree.original_recipe_id !== null || tree.children.length > 0 || !tree.is_current;
  
  if (!hasAncestry && tree.is_current && tree.children.length === 0) {
    return null; // Just the current recipe, no tree to show
  }

  // Count total nodes in tree
  const countNodes = (node: TreeNode): number => {
    return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
  };
  const totalNodes = countNodes(tree);

  if (compact && !showFullTree) {
    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <GitFork className="text-amber-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Fork Family Tree</h3>
                <p className="text-sm text-gray-600">
                  {totalNodes} recipes in this lineage
                </p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowFullTree(true)}
            >
              View Tree
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <GitFork className="text-amber-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Fork Ancestry Tree</h3>
              <p className="text-sm text-gray-600">
                See how this recipe evolved • {totalNodes} recipes in lineage
              </p>
            </div>
          </div>
          {compact && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFullTree(false)}
            >
              Collapse
            </Button>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Crown size={14} className="text-amber-500" />
            <span>Original</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork size={14} className="text-gray-400" />
            <span>Fork</span>
          </div>
        </div>

        {/* Tree */}
        <div className="bg-white rounded-lg p-3 border border-amber-200">
          {renderNode(tree)}
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Click any recipe to view it • Click arrows to expand/collapse
        </p>
      </CardBody>
    </Card>
  );
}

