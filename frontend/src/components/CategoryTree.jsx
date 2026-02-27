import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from './UI';

const CategoryTreeItem = ({ 
  category, 
  level = 0, 
  selectedId, 
  expandedIds,
  onToggle,
  onSelect, 
  onAddChild 
}) => {
  const hasChildren = Array.isArray(category.children) && category.children.length > 0;
  const isExpanded = expandedIds.has(category.id);
  const isSelected = selectedId === category.id;

  const handleToggle = () => {
    if (hasChildren) {
      onToggle(category.id);
    }
  };

  const handleSelect = () => {
    onSelect(category);
    if (hasChildren && !isExpanded) {
      onToggle(category.id);
    }
  };

  return (
    <div className="select-none">
      <motion.div
        className={`group category-tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <div className="flex items-center gap-2 flex-1" onClick={handleSelect}>
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              className="p-1 hover:bg-white/10 rounded"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-zinc-400" />
              ) : (
                <ChevronRight size={16} className="text-zinc-400" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen size={16} className="text-felixo-purple" />
              ) : (
                <Folder size={16} className="text-felixo-purple" />
              )
            ) : (
              <div className="w-4 h-4 rounded bg-felixo-purple/20 border border-felixo-purple/40" />
            )}
            
            <span className="text-sm text-white font-medium">
              {category.name}
            </span>
          </div>
        </div>
        
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(category);
          }}
          className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus size={14} className="text-zinc-400" />
        </button>
      </motion.div>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {category.children.map(child => (
              <CategoryTreeItem
                key={child.id}
                category={child}
                level={level + 1}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onSelect={onSelect}
                onAddChild={onAddChild}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CategoryTree = ({ 
  categories = [], 
  selectedCategory, 
  onCategorySelect, 
  onAddCategory,
  className = '' 
}) => {
  const [expandedIds, setExpandedIds] = useState(new Set());

  const parentById = useMemo(() => {
    const parentMap = new Map();
    const walk = (nodes = []) => {
      nodes.forEach((node) => {
        parentMap.set(node.id, node.parent ?? null);
        if (Array.isArray(node.children) && node.children.length > 0) {
          walk(node.children);
        }
      });
    };
    walk(categories);
    return parentMap;
  }, [categories]);

  useEffect(() => {
    if (!selectedCategory?.id) {
      return;
    }

    setExpandedIds((prev) => {
      const next = new Set(prev);
      let parentId = parentById.get(selectedCategory.id);

      while (parentId) {
        next.add(parentId);
        parentId = parentById.get(parentId);
      }

      return next;
    });
  }, [selectedCategory, parentById]);

  const handleAddRoot = () => {
    onAddCategory(null);
  };

  const handleAddChild = (parentCategory) => {
    onAddCategory(parentCategory);
  };

  const handleToggleCategory = (categoryId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Categorias</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddRoot}
          >
            <Plus size={16} />
            Nova
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {categories.length === 0 ? (
            <div className="p-5 text-center text-zinc-400">
              <Folder size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma categoria criada</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddRoot}
                className="mt-2"
              >
                Criar primeira categoria
              </Button>
            </div>
          ) : (
            <div className="py-2">
              {categories.map(category => (
                <CategoryTreeItem
                  key={category.id}
                  category={category}
                  selectedId={selectedCategory?.id}
                  expandedIds={expandedIds}
                  onToggle={handleToggleCategory}
                  onSelect={onCategorySelect}
                  onAddChild={handleAddChild}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
