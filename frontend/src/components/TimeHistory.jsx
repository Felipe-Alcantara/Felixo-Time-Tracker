import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Edit, Trash2, Tag } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from './UI';
import { EditEntryModal } from './EditEntryModal';
import { formatDate, formatTime, formatDurationShort, getTagColor } from '../utils/helpers';
import { timeEntryAPI } from '../services/api';

export const TimeEntryItem = ({ entry, onEdit, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-zinc-800/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-felixo-purple"></div>
            <span className="font-medium text-white">{entry.category_name}</span>
            {entry.task_name && (
              <>
                <span className="text-zinc-500">›</span>
                <span className="text-zinc-300">{entry.task_name}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-zinc-400 mb-2">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{formatTime(entry.start_at)}</span>
              {entry.end_at && (
                <>
                  <span>-</span>
                  <span>{formatTime(entry.end_at)}</span>
                </>
              )}
            </div>
            
            <div className="font-medium text-felixo-purple">
              {entry.is_running ? 'Em andamento' : formatDurationShort(entry.duration_seconds)}
            </div>
          </div>
          
          {entry.note && (
            <p className="text-sm text-zinc-400 mb-2">{entry.note}</p>
          )}
          
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map(tag => (
                <Badge
                  key={tag.id}
                  className={getTagColor(tag.name)}
                >
                  <Tag size={10} />
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-1 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(entry)}
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(entry)}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const TimeEntriesHistory = ({ refreshTrigger = 0, categories = [], selectedCategory = null }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedEntries, setGroupedEntries] = useState({});
  const [editingEntry, setEditingEntry] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const requestSeqRef = useRef(0);
  const filterLabel = selectedCategory?.path || 'Todas as categorias';

  const fetchEntries = async () => {
    const requestId = ++requestSeqRef.current;
    setLoading(true);
    try {
      const params = selectedCategory?.id
        ? { category: selectedCategory.id, include_descendants: 1 }
        : {};
      const response = await timeEntryAPI.getAll(params);
      if (requestId !== requestSeqRef.current) return;
      setEntries(response.data.results || response.data);
      
      // Agrupar por data
      const grouped = {};
      (response.data.results || response.data).forEach(entry => {
        const date = formatDate(entry.start_at);
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(entry);
      });
      if (requestId !== requestSeqRef.current) return;
      setGroupedEntries(grouped);
    } catch (error) {
      if (requestId !== requestSeqRef.current) return;
      console.error('Erro ao carregar histórico:', error);
    } finally {
      if (requestId !== requestSeqRef.current) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEntries();
    }, 120);

    return () => {
      requestSeqRef.current += 1;
      clearTimeout(timeoutId);
    };
  }, [refreshTrigger, selectedCategory?.id]);

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    fetchEntries();
  };

  const handleDelete = async (entry) => {
    if (window.confirm('Tem certeza que deseja excluir esta entrada?')) {
      try {
        await timeEntryAPI.delete(entry.id);
        fetchEntries();
      } catch (error) {
        console.error('Erro ao excluir entrada:', error);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-zinc-800/50 rounded-xl"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Atividades</CardTitle>
        <p className="text-xs text-zinc-400 mt-1">
          Filtro: {filterLabel}
        </p>
      </CardHeader>
      
      <CardContent>
        {Object.keys(groupedEntries).length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <Clock size={48} className="mx-auto mb-4 opacity-50" />
              {selectedCategory?.id ? (
                <>
                  <p>Nenhuma atividade nesta categoria</p>
                  <p className="text-sm">Selecione outra categoria ou limpe o filtro</p>
                </>
              ) : (
                <>
                  <p>Nenhuma atividade registrada ainda</p>
                  <p className="text-sm">Inicie seu primeiro timer para ver o histórico aqui</p>
                </>
              )}
            </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEntries).map(([date, dateEntries]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold text-white mb-3 sticky top-0 bg-zinc-950/80 backdrop-blur-sm py-2">
                  {date}
                </h3>
                
                <div className="space-y-3">
                  {dateEntries.map(entry => (
                    <TimeEntryItem
                      key={entry.id}
                      entry={entry}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
                
                {/* Resumo do dia */}
                <div className="mt-4 p-3 bg-felixo-purple/10 border border-felixo-purple/20 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-300">Total do dia:</span>
                    <span className="font-medium text-felixo-purple">
                      {formatDurationShort(
                        dateEntries.reduce((total, entry) => total + (entry.duration_seconds || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Edit Entry Modal */}
      <EditEntryModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        entry={editingEntry}
        categories={categories}
        onSuccess={handleEditSuccess}
      />
    </Card>
  );
};
