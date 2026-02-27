import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, FolderTree, History, Settings } from 'lucide-react';
import { TimerDisplay, TimerControls } from './components/Timer';
import { CategoryTree } from './components/CategoryTree';
import { StatsDashboard } from './components/Dashboard';
import { TimeEntriesHistory } from './components/TimeHistory';
import { AddCategoryModal } from './components/AddCategoryModal';
import { AddTaskModal } from './components/AddTaskModal';
import { CategoryManager } from './components/CategoryManager';
import { SpeedrunModal } from './components/SpeedrunModal';
import { Button, Card, CardContent } from './components/UI';
import { useTimer } from './hooks/useTimer';
import { categoryAPI, taskAPI, tagAPI } from './services/api';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('timer');
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedManagerCategory, setSelectedManagerCategory] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [categoryToAddTo, setCategoryToAddTo] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const tasksRequestSeqRef = useRef(0);
  
  const { 
    currentEntry, 
    elapsedTime, 
    isRunning, 
    startTimer, 
    stopTimer, 
    refreshTimer 
  } = useTimer();

  // Carregar dados iniciais
  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  // Carregar tasks quando categoria é selecionada
  useEffect(() => {
    if (selectedCategory?.id) {
      const timeoutId = setTimeout(() => {
        fetchTasks(selectedCategory.id);
      }, 120);
      return () => {
        tasksRequestSeqRef.current += 1;
        clearTimeout(timeoutId);
      };
    } else {
      tasksRequestSeqRef.current += 1;
      setTasks([]);
    }
  }, [selectedCategory?.id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getTree();
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const fetchTasks = async (categoryId) => {
    const requestId = ++tasksRequestSeqRef.current;
    try {
      setTasks([]);
      const response = await taskAPI.getAll(categoryId);
      if (requestId !== tasksRequestSeqRef.current) return;
      setTasks(response.data.results || response.data);
    } catch (error) {
      if (requestId !== tasksRequestSeqRef.current) return;
      console.error('Erro ao carregar tasks:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await tagAPI.getAll();
      setTags(response.data.results || response.data);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    }
  };

  const handleCategorySelect = (category) => {
    if (!category?.id) {
      setSelectedCategory(null);
      return;
    }
    if (selectedCategory?.id === category.id) {
      setSelectedCategory(null);
      return;
    }
    setSelectedCategory(category);
  };

  const handleCategoryChange = (categoryId) => {
    const category = findCategoryById(categories, categoryId);
    const nextId = category?.id || null;
    const currentId = selectedCategory?.id || null;
    if (currentId === nextId) {
      return;
    }
    setSelectedCategory(category || null);
  };

  const findCategoryById = (cats, id) => {
    for (const cat of cats) {
      if (cat.id === parseInt(id)) return cat;
      if (cat.children) {
        const found = findCategoryById(cat.children, id);
        if (found) return found;
      }
    }
    return null;
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

  const handleStartTimer = async (data) => {
    try {
      await startTimer(data);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Erro ao iniciar timer:', error);
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer();
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Erro ao parar timer:', error);
    }
  };

  const handleAddCategory = (parentCategory) => {
    setCategoryToAddTo(parentCategory);
    setShowAddCategoryModal(true);
  };

  const handleCategoryAdded = () => {
    fetchCategories();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddTask = () => {
    setShowAddTaskModal(true);
  };

  const handleTaskAdded = () => {
    if (selectedCategory) {
      fetchTasks(selectedCategory.id);
    }
    setRefreshTrigger(prev => prev + 1);
  };

  const tabs = [
    { id: 'timer', label: 'Timer', icon: Clock },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'categories', label: 'Categorias', icon: FolderTree },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Felixo <span className="text-felixo-purple">Time Tracker</span>
          </h1>
          <p className="text-lg text-zinc-400">
            Gerencie seu tempo com categorias aninhadas e estatísticas detalhadas
          </p>
        </motion.header>

        {/* Timer Display - Sempre visível */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <TimerDisplay elapsedTime={elapsedTime} isRunning={isRunning} />
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-zinc-900/50 rounded-2xl p-1 border border-white/10">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'primary' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative"
                >
                  <Icon size={16} />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'timer' && (
            <div className="grid lg:grid-cols-[300px_1fr] gap-8">
              <div className="space-y-6">
                <TimerControls
                  categories={flattenCategories(categories)}
                  tasks={tasks}
                  tags={tags}
                  onCategoryChange={handleCategoryChange}
                  onStart={handleStartTimer}
                  onStop={handleStopTimer}
                  isRunning={isRunning}
                  currentEntry={currentEntry}
                  onAddTask={handleAddTask}
                />
                
                <CategoryTree
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategorySelect={handleCategorySelect}
                  onAddCategory={handleAddCategory}
                />
              </div>
              
              <TimeEntriesHistory 
                refreshTrigger={refreshTrigger} 
                categories={categories}
                selectedCategory={selectedCategory}
              />
            </div>
          )}

          {activeTab === 'dashboard' && <StatsDashboard />}

          {activeTab === 'history' && (
            <TimeEntriesHistory 
              refreshTrigger={refreshTrigger}
              categories={categories}
              selectedCategory={selectedCategory}
            />
          )}

          {activeTab === 'categories' && (
            <div className="grid lg:grid-cols-[1fr_300px] gap-8">
              <CategoryManager
                onAddCategory={handleAddCategory}
                selectedCategory={selectedManagerCategory}
                onSelectCategory={setSelectedManagerCategory}
              />
               
              <TimeEntriesHistory 
                refreshTrigger={refreshTrigger}
                categories={categories}
                selectedCategory={selectedManagerCategory}
              />
            </div>
          )}
        </motion.div>

        {/* Speedrun Modal - Aparece quando timer está ativo */}
        <SpeedrunModal
          isVisible={isRunning}
          currentEntry={currentEntry}
          elapsedTime={elapsedTime}
        />

        {/* Add Category Modal */}
        <AddCategoryModal
          isOpen={showAddCategoryModal}
          onClose={() => setShowAddCategoryModal(false)}
          parentCategory={categoryToAddTo}
          onSuccess={handleCategoryAdded}
        />
      </div>
    </div>
  );
}

export default App;
