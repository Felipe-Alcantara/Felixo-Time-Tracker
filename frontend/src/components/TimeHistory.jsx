import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Edit, Trash2, Tag } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from './UI';
import { EditEntryModal } from './EditEntryModal';
import { formatDate, formatTime, formatDurationShort, getTagColor } from '../utils/helpers';
import { timeEntryAPI } from '../services/api';

export const TimeEntryItem = ({ entry, onEdit, onDelete }) => {
  const speedrunSnapshot = entry?.meta?.speedrun_snapshot || null;
  const speedrunDynamic = entry?.speedrun_dynamic || null;
  const speedrunStyleByStatus = {
    first: {
      label: 'Primeira sessão',
      className: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30',
    },
    record: {
      label: 'Recorde',
      className: 'bg-green-500/15 text-green-300 border-green-500/40',
    },
    fast: {
      label: 'Bom ritmo',
      className: 'bg-lime-500/15 text-lime-300 border-lime-500/40',
    },
    normal: {
      label: 'Na média',
      className: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
    },
    slow: {
      label: 'Abaixo da média',
      className: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
    },
    very_slow: {
      label: 'Bem abaixo da média',
      className: 'bg-red-500/10 text-red-300 border-red-500/30',
    },
  };
  const speedrunSnapshotStyle = speedrunSnapshot
    ? (speedrunStyleByStatus[speedrunSnapshot.status] || speedrunStyleByStatus.normal)
    : null;
  const speedrunDynamicStyle = speedrunDynamic
    ? (speedrunStyleByStatus[speedrunDynamic.status] || speedrunStyleByStatus.normal)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-zinc-800/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors overflow-hidden"
    >
      <div className="space-y-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-felixo-purple mt-1 shrink-0"></div>
          <span
            className="font-medium text-white min-w-0 [overflow-wrap:anywhere]"
            title={entry.category_name}
          >
            {entry.category_name}
          </span>
        </div>

        {entry.task_name && (
          <div className="flex items-start gap-2 min-w-0 pl-4">
            <span className="text-zinc-500 shrink-0">&gt;</span>
            <span
              className="text-zinc-300 min-w-0 [overflow-wrap:anywhere]"
              title={entry.task_name}
            >
              {entry.task_name}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
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

        {!entry.is_running && (speedrunSnapshotStyle || speedrunDynamicStyle) && (
          <div className="space-y-1 text-xs">
            {speedrunSnapshotStyle && (
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${speedrunSnapshotStyle.className}`}>
                  Na época: {speedrunSnapshotStyle.label}
                </span>
                {(speedrunSnapshot.total_entries || speedrunSnapshot.compared_entries || 0) > 1 && (
                  <span className="text-zinc-500">
                    média base {formatDurationShort(Math.round(speedrunSnapshot.avg_duration || 0))}
                  </span>
                )}
              </div>
            )}

            {speedrunDynamicStyle && (
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${speedrunDynamicStyle.className}`}>
                  Hoje: {speedrunDynamicStyle.label}
                </span>
                {(speedrunDynamic.total_entries || 0) > 1 && (
                  <span className="text-zinc-500">
                    {speedrunDynamic.ratio_percent || 0}% da média • média {formatDurationShort(Math.round(speedrunDynamic.avg_duration || 0))}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {entry.note && (
          <p className="text-sm text-zinc-400 break-words">{entry.note}</p>
        )}

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <Badge key={tag.id} className={getTagColor(tag.name)}>
                <Tag size={10} />
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(entry)}
            className="h-8 w-8 p-0"
            title="Editar"
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(entry)}
            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
            title="Excluir"
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
  const cardClassName = 'overflow-hidden flex flex-col max-h-[78vh]';

  const fetchEntries = async () => {
    const requestId = ++requestSeqRef.current;
    setLoading(true);
    try {
      const params = selectedCategory?.id
        ? { category: selectedCategory.id, include_descendants: 1 }
        : {};
      const response = await timeEntryAPI.getAll(params);
      if (requestId !== requestSeqRef.current) return;
      const nextEntries = response.data.results || response.data;
      setEntries(nextEntries);

      const grouped = {};
      nextEntries.forEach((entry) => {
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
      <Card className={cardClassName}>
        <CardContent className="overflow-y-auto">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle>Histórico de Atividades</CardTitle>
        <p className="text-xs text-zinc-400 mt-1 truncate" title={filterLabel}>
          Filtro: {filterLabel}
        </p>
      </CardHeader>

      <CardContent className="overflow-x-hidden overflow-y-auto">
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
                  {dateEntries.map((entry) => (
                    <TimeEntryItem
                      key={entry.id}
                      entry={entry}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>

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
