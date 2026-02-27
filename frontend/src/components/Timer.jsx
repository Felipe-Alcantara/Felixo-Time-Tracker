import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Clock, Plus } from 'lucide-react';
import { Button, Card, CardContent, Input, Select } from './UI';
import { formatDuration } from '../utils/helpers';
import { useTimer } from '../hooks/useTimer';

export const TimerDisplay = ({ elapsedTime, isRunning }) => {
  return (
    <motion.div
      animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
      transition={{ duration: 2, repeat: isRunning ? Infinity : 0 }}
      className="text-center"
    >
      <div className="timer-display mb-2">
        {formatDuration(elapsedTime)}
      </div>
      <div className="flex items-center justify-center gap-2 text-zinc-400">
        <Clock size={16} />
        <span className="text-sm">
          {isRunning ? 'Timer ativo' : 'Timer parado'}
        </span>
      </div>
    </motion.div>
  );
};

export const TimerControls = ({ 
  categories = [], 
  tasks = [], 
  tags = [], 
  onCategoryChange,
  onStart,
  onStop,
  isRunning,
  currentEntry,
  onAddTask
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [note, setNote] = useState('');

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedTask('');
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
  };

  const handleStart = () => {
    if (!selectedCategory) return;
    
    const data = {
      category_id: parseInt(selectedCategory),
      task_id: selectedTask ? parseInt(selectedTask) : null,
      tag_ids: selectedTags,
      note: note
    };
    
    onStart(data);
  };

  const handleStop = () => {
    onStop();
    // Limpar formulário
    setSelectedCategory('');
    setSelectedTask('');
    setSelectedTags([]);
    setNote('');
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent>
        <div className="space-y-4">
          {!isRunning ? (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Categoria
                </label>
                <Select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.path}
                    </option>
                  ))}
                </Select>
              </div>

              {selectedCategory && tasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-zinc-300">
                      Task (opcional)
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddTask && onAddTask()}
                    >
                      <Plus size={14} />
                      Nova
                    </Button>
                  </div>
                  <Select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                  >
                    <option value="">Nenhuma task específica</option>
                    {tasks.map(task => (
                      <option key={task.id} value={task.id}>
                        {task.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nota (opcional)
                </label>
                <Input
                  placeholder="O que você está fazendo?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleStart}
                disabled={!selectedCategory}
              >
                <Play size={20} />
                Iniciar Timer
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-felixo-purple/10 border border-felixo-purple/20 rounded-xl">
                <p className="text-sm text-zinc-300 mb-1">Trabalhando em:</p>
                <p className="font-medium text-white">{currentEntry?.category_name}</p>
                {currentEntry?.task_name && (
                  <p className="text-sm text-zinc-400">{currentEntry.task_name}</p>
                )}
                {currentEntry?.note && (
                  <p className="text-xs text-zinc-500 mt-2">{currentEntry.note}</p>
                )}
              </div>
              
              <Button
                variant="outline"
                size="lg"
                className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10"
                onClick={handleStop}
              >
                <Square size={20} />
                Parar Timer
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};