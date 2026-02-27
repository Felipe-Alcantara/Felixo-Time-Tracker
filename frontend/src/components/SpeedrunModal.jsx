import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, TrendingUp, Clock, Zap, Award } from 'lucide-react';
import { Card, CardContent } from './UI';
import { formatDuration, formatDurationShort } from '../utils/helpers';
import { categoryAPI } from '../services/api';

export const SpeedrunModal = ({ isVisible, currentEntry, elapsedTime }) => {
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState('normal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentEntry && isVisible) {
      fetchCategoryStats();
    }
  }, [currentEntry, isVisible]);

  useEffect(() => {
    if (stats && elapsedTime > 0) {
      calculatePerformance();
    }
  }, [stats, elapsedTime]);

  const fetchCategoryStats = async () => {
    if (!currentEntry?.category) return;
    
    setLoading(true);
    try {
      const response = await categoryAPI.getStats(currentEntry.category);
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformance = () => {
    if (!stats || stats.total_entries === 0) return;

    const currentSeconds = elapsedTime;
    const avgSeconds = stats.avg_duration;
    const minSeconds = stats.min_duration;
    
    if (currentSeconds < minSeconds) {
      setPerformance('record'); // Novo recorde!
    } else if (currentSeconds < avgSeconds * 0.8) {
      setPerformance('fast'); // Muito rápido
    } else if (currentSeconds < avgSeconds * 1.2) {
      setPerformance('normal'); // Normal
    } else if (currentSeconds < avgSeconds * 1.5) {
      setPerformance('slow'); // Lento
    } else {
      setPerformance('very_slow'); // Muito lento
    }
  };

  const getPerformanceConfig = () => {
    const configs = {
      record: {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/40',
        icon: Trophy,
        title: '🏆 NOVO RECORDE!',
        message: 'Você está batendo seu melhor tempo!'
      },
      fast: {
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/40',
        icon: Zap,
        title: '⚡ MUITO RÁPIDO',
        message: 'Acima da média! Continue assim!'
      },
      normal: {
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/40',
        icon: Target,
        title: '🎯 NO RITMO',
        message: 'Tempo dentro da média esperada'
      },
      slow: {
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/40',
        icon: Clock,
        title: '🐌 MAIS DEVAGAR',
        message: 'Acima da média, mas tudo bem!'
      },
      very_slow: {
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/40',
        icon: TrendingUp,
        title: '🔥 SESSÃO LONGA',
        message: 'Focado na qualidade!'
      }
    };
    return configs[performance];
  };

  if (!isVisible || !currentEntry) return null;

  const config = getPerformanceConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed top-4 right-4 z-40 w-80"
      >
        <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
          <CardContent className="p-4">
            {/* Header com performance */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`${config.color}`} size={20} />
              </div>
              <div>
                <h3 className={`font-bold ${config.color}`}>{config.title}</h3>
                <p className="text-xs text-zinc-400">{config.message}</p>
              </div>
            </div>

            {/* Tempo atual */}
            <div className="text-center mb-4">
              <div className="text-2xl font-mono font-bold text-white mb-1">
                {formatDuration(elapsedTime)}
              </div>
              <p className="text-sm text-zinc-400">Tempo atual</p>
            </div>

            {/* Métricas */}
            {!loading && stats && stats.total_entries > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-green-400 font-bold">
                      {formatDurationShort(stats.min_duration)}
                    </div>
                    <div className="text-zinc-500">🏆 Recorde</div>
                  </div>
                  
                  <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-blue-400 font-bold">
                      {formatDurationShort(stats.avg_duration)}
                    </div>
                    <div className="text-zinc-500">📊 Média</div>
                  </div>
                </div>

                {/* Barra de progresso vs média */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">vs Média</span>
                    <span className={config.color}>
                      {elapsedTime > 0 && stats.avg_duration > 0 
                        ? `${((elapsedTime / stats.avg_duration) * 100).toFixed(0)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${
                        performance === 'record' ? 'bg-yellow-500' :
                        performance === 'fast' ? 'bg-green-500' :
                        performance === 'normal' ? 'bg-blue-500' :
                        performance === 'slow' ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ 
                        width: stats.avg_duration > 0 
                          ? `${Math.min((elapsedTime / stats.avg_duration) * 100, 200)}%`
                          : '0%'
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Estatísticas adicionais */}
                <div className="flex justify-between text-xs text-zinc-400 pt-2 border-t border-white/10">
                  <span>📈 {stats.total_entries} sessões</span>
                  <span>⏱️ {formatDurationShort(stats.total_time)} total</span>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-felixo-purple border-t-transparent rounded-full mx-auto"></div>
                <p className="text-xs text-zinc-400 mt-2">Carregando métricas...</p>
              </div>
            )}

            {!loading && stats && stats.total_entries === 0 && (
              <div className="text-center py-4">
                <Award className="w-8 h-8 text-felixo-purple mx-auto mb-2" />
                <p className="text-sm text-zinc-300 font-medium">Primeira sessão!</p>
                <p className="text-xs text-zinc-400">Estabelecendo seu recorde</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};