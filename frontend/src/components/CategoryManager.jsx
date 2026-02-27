import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit, Plus, FolderTree, Clock, ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './UI';
import { formatDurationShort, formatTime, formatDate } from '../utils/helpers';
import { categoryAPI, timeEntryAPI } from '../services/api';

const flattenCategories = (categories = []) => {
  let flat = [];
  categories.forEach((cat) => {
    flat.push(cat);
    if (Array.isArray(cat.children) && cat.children.length > 0) {
      flat = flat.concat(flattenCategories(cat.children));
    }
  });
  return flat;
};

export const CategoryManager = ({ onAddCategory }) => {
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [categorySessions, setCategorySessions] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryAPI.getTree();
      const categoryTree = Array.isArray(response.data) ? response.data : [];
      setCategories(categoryTree);

      const flatCategories = flattenCategories(categoryTree);
      const statsPromises = flatCategories.map(async (cat) => {
        try {
          const stats = await categoryAPI.getStats(cat.id);
          return { id: cat.id, stats: stats.data };
        } catch (error) {
          return { id: cat.id, stats: null };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      statsResults.forEach(result => {
        statsMap[result.id] = result.stats;
      });
      setCategoryStats(statsMap);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = async (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    
    if (expandedCategories.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      
      if (!categorySessions[categoryId]) {
        try {
          const response = await timeEntryAPI.getAll({ category: categoryId });
          setCategorySessions(prev => ({
            ...prev,
            [categoryId]: response.data.results || response.data
          }));
        } catch (error) {
          console.error('Erro ao carregar sessões:', error);
        }
      }
    }
    
    setExpandedCategories(newExpanded);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      await categoryAPI.delete(categoryId);
      fetchCategories();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      alert('Erro ao excluir categoria.');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta sessão?')) {
      return;
    }

    try {
      await timeEntryAPI.delete(sessionId);
      const expandedIds = Array.from(expandedCategories);
      for (const categoryId of expandedIds) {
        const response = await timeEntryAPI.getAll({ category: categoryId });
        setCategorySessions(prev => ({
          ...prev,
          [categoryId]: response.data.results || response.data
        }));
      }
      fetchCategories();
    } catch (error) {
      console.error('Erro ao excluir sessão:', error);
      alert('Erro ao excluir sessão.');
    }
  };

  const handleCollapseAll = () => {
    setExpandedCategories(new Set());
  };

  const CategoryItem = ({ category, level = 0 }) => {
    const stats = categoryStats[category.id];
    const sessions = categorySessions[category.id] || [];
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const hasSessions = sessions.length > 0;

    return (
      <div className="space-y-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 bg-zinc-800/30 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => handleToggleCategory(category.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggleCategory(category.id);
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCategory(category.id);
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-zinc-400" />
                  ) : (
                    <ChevronRight size={16} className="text-zinc-400" />
                  )}
                </button>
                
                <FolderTree size={16} className="text-felixo-purple" />
                <span className="font-medium text-white">{category.name}</span>
                
                {stats && stats.total_entries > 0 && (
                  <Badge color="purple" className="text-xs">
                    {stats.total_entries}
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-zinc-500">
                {category.path}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              {stats && (
                <div className="flex items-center gap-1 text-zinc-400">
                  <Clock size={12} />
                  <span>{formatDurationShort(stats.total_time)}</span>
                </div>
              )}
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddCategory(category);
                  }}
                >
                  <Plus size={14} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category.id);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && hasSessions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pl-6 border-l-2 border-felixo-purple/30 space-y-2"
              >
                {sessions.map(session => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-zinc-700/30 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-zinc-400" />
                        <div>
                          <div className="text-sm text-white">
                            {formatTime(session.start_at)} - {session.end_at ? formatTime(session.end_at) : 'Em andamento'}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {formatDate(session.start_at)} • {formatDurationShort(session.duration_seconds)}
                          </div>
                          {session.note && (
                            <div className="text-xs text-zinc-500 mt-1">{session.note}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => console.log('Editar sessão:', session)}
                        >
                          <Edit size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {isExpanded && hasChildren && (
          <div className="space-y-2">
            {category.children.map(child => (
              <CategoryItem key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="text-felixo-purple" />
            Gerenciar Categorias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-felixo-purple"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderTree className="text-felixo-purple" />
          Gerenciar Categorias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              onClick={() => onAddCategory(null)}
              className="w-full bg-felixo-purple hover:bg-felixo-purple/80"
            >
              <Plus size={16} className="mr-2" />
              Nova Categoria Raiz
            </Button>
            <Button
              variant="outline"
              onClick={handleCollapseAll}
              disabled={expandedCategories.size === 0}
              className="w-full"
            >
              Recolher Todas
            </Button>
          </div>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                <FolderTree size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma categoria encontrada</p>
                <p className="text-sm">Crie sua primeira categoria para começar</p>
              </div>
            ) : (
              categories.map(category => (
                <CategoryItem key={category.id} category={category} />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
