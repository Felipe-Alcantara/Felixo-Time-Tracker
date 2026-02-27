import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Button, Input, Select, Modal } from './UI';
import { taskAPI } from '../services/api';

export const AddTaskModal = ({ isOpen, onClose, categories, selectedCategory, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(selectedCategory?.id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        category: parseInt(categoryId),
        properties: {}
      };

      await taskAPI.create(data);
      
      // Reset form
      setName('');
      setDescription('');
      setCategoryId(selectedCategory?.id || '');
      
      // Callback success
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar task:', error);
      alert('Erro ao criar task. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setCategoryId(selectedCategory?.id || '');
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Nova Task
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
        >
          <X size={16} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Nome da Task *
          </label>
          <Input
            placeholder="Ex: Desenvolver feature, Estudar React..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Categoria *
          </label>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Selecione uma categoria</option>
            {flattenCategories(categories).map(category => (
              <option key={category.id} value={category.id}>
                {category.path}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Descrição (opcional)
          </label>
          <Input
            placeholder="Detalhes sobre a task..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            disabled={!name.trim() || !categoryId || loading}
            className="flex-1"
          >
            <Plus size={16} />
            {loading ? 'Criando...' : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};