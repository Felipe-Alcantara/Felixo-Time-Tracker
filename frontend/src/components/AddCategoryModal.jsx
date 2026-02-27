import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Button, Input, Select, Modal } from './UI';
import { categoryAPI } from '../services/api';

export const AddCategoryModal = ({ isOpen, onClose, parentCategory, onSuccess }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        parent: parentCategory?.id || null,
        icon: icon.trim() || '',
        properties: {}
      };

      console.log('Enviando dados:', data); // Debug
      await categoryAPI.create(data);
      
      // Reset form
      setName('');
      setIcon('');
      
      // Callback success
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      alert('Erro ao criar categoria. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setIcon('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Nova Categoria
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
        >
          <X size={16} />
        </Button>
      </div>

      {parentCategory && (
        <div className="mb-4 p-3 bg-felixo-purple/10 border border-felixo-purple/20 rounded-lg">
          <p className="text-sm text-zinc-300">
            Categoria pai: <span className="text-felixo-purple font-medium">{parentCategory.path}</span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Nome da Categoria *
          </label>
          <Input
            placeholder="Ex: Trabalho, Estudo, Projetos..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Ícone (opcional)
          </label>
          <Input
            placeholder="Ex: 💼, 📚, 🎯..."
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
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
            disabled={!name.trim() || loading}
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