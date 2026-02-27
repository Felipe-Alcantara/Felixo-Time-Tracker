import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button, Input, Select, Modal } from './UI';
import { timeEntryAPI } from '../services/api';
import { formatTime } from '../utils/helpers';

export const EditEntryModal = ({ isOpen, onClose, entry, categories, onSuccess }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entry && isOpen) {
      setStartTime(formatTime(entry.start_at));
      setEndTime(entry.end_at ? formatTime(entry.end_at) : '');
      setNote(entry.note || '');
      setCategoryId(entry.category || '');
    }
  }, [entry, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startTime) return;

    setLoading(true);
    try {
      // Validar formato de horário
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        alert('Formato de hora inválido para início');
        setLoading(false);
        return;
      }
      if (endTime && !timeRegex.test(endTime)) {
        alert('Formato de hora inválido para fim');
        setLoading(false);
        return;
      }

      const startDate = new Date(entry.start_at);
      const [startHour, startMinute] = startTime.split(':');
      startDate.setHours(parseInt(startHour), parseInt(startMinute));

      let endDate = null;
      if (endTime) {
        endDate = new Date(entry.start_at);
        const [endHour, endMinute] = endTime.split(':');
        endDate.setHours(parseInt(endHour), parseInt(endMinute));
        
        // Se hora final é menor que inicial, assumir próximo dia
        if (endDate <= startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
        
        // Validar duração máxima (24 horas)
        const duration = (endDate - startDate) / (1000 * 60 * 60);
        if (duration > 24) {
          const confirm = window.confirm(`Sessão de ${duration.toFixed(1)} horas detectada. Continuar?`);
          if (!confirm) {
            setLoading(false);
            return;
          }
        }
      }

      const data = {
        ...entry,
        start_at: startDate.toISOString(),
        end_at: endDate ? endDate.toISOString() : null,
        note: note.trim(),
        category: parseInt(categoryId) || entry.category
      };

      await timeEntryAPI.update(entry.id, data);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao editar entrada:', error);
      alert('Erro ao editar entrada. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStartTime('');
    setEndTime('');
    setNote('');
    setCategoryId('');
    onClose();
  };

  const flattenCategories = (cats) => {
    let result = [];
    for (const cat of cats) {
      result.push(cat);
      if (cat.children) {
        result = result.concat(flattenCategories(cat.children));
      }
    }
    return result;
  };

  if (!entry) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Editar Entrada
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
        >
          <X size={16} />
        </Button>
      </div>

      <div className="mb-4 p-3 bg-zinc-800/50 border border-white/10 rounded-lg">
        <p className="text-sm text-zinc-300">
          <span className="font-medium">{entry.category_name}</span>
          {entry.task_name && (
            <span className="text-zinc-400"> › {entry.task_name}</span>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Hora de Início *
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Hora de Fim
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Categoria
          </label>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Manter categoria atual</option>
            {flattenCategories(categories).map(category => (
              <option key={category.id} value={category.id}>
                {category.path}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Nota
          </label>
          <Input
            placeholder="Adicione uma nota..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!startTime || loading}
            className="flex-1"
          >
            <Save size={16} />
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};