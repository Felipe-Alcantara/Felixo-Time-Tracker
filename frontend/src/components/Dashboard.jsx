import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, TrendingUp, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Select } from './UI';
import { formatDurationShort, getTodayDateString, getWeekDateRange, getMonthDateRange } from '../utils/helpers';
import { timeEntryAPI } from '../services/api';

const COLORS = ['#C084FC', '#A855F7', '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'];

export const StatsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [topTasks, setTopTasks] = useState([]);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);

  const getPeriodDates = () => {
    switch (period) {
      case 'today':
        const today = getTodayDateString();
        return { from: today, to: today };
      case 'week':
        return getWeekDateRange();
      case 'month':
        return getMonthDateRange();
      default:
        return { from: getTodayDateString(), to: getTodayDateString() };
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const dates = getPeriodDates();
      const [statsResponse, tasksResponse] = await Promise.all([
        timeEntryAPI.getStats(dates),
        timeEntryAPI.getTopTasks({ ...dates, limit: 5 })
      ]);
      
      setStats(statsResponse.data);
      setTopTasks(tasksResponse.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const handleExport = async () => {
    try {
      const dates = getPeriodDates();
      const response = await timeEntryAPI.exportCSV(dates);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `time_entries_${period}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent>
              <div className="h-32 bg-zinc-800/50 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const categoryData = stats?.total_seconds_by_category?.map((item, index) => ({
    name: item.category__path?.split('/').pop() || 'Sem categoria',
    value: item.total_seconds,
    duration: formatDurationShort(item.total_seconds),
    color: COLORS[index % COLORS.length]
  })) || [];

  const tagData = stats?.total_seconds_by_tag?.map((item, index) => ({
    name: item.tags__name,
    value: item.total_seconds,
    duration: formatDurationShort(item.total_seconds),
    color: COLORS[index % COLORS.length]
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-zinc-400">Estatísticas do seu tempo</p>
        </div>
        
        <div className="flex gap-3">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-auto"
            wrapperClassName="w-auto"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
          </Select>
          
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download size={16} />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-felixo-purple/20 rounded-lg">
              <Clock className="text-felixo-purple" size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Tempo Total</p>
              <p className="text-2xl font-bold text-white">
                {formatDurationShort(stats?.total_seconds || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Calendar className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Sessões</p>
              <p className="text-2xl font-bold text-white">
                {stats?.total_entries || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Média por Sessão</p>
              <p className="text-2xl font-bold text-white">
                {formatDurationShort(stats?.avg_session_seconds || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tempo por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Tempo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, duration }) => `${name}: ${duration}`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatDurationShort(value)}
                    labelStyle={{ color: '#000' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-zinc-400">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Top Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {topTasks.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTasks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="task__name" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => formatDurationShort(value)}
                  />
                  <Tooltip 
                    formatter={(value) => formatDurationShort(value)}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar dataKey="total_seconds" fill="#C084FC" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-zinc-400">
                Nenhuma task registrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tempo por Tag */}
      {tagData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tempo por Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tagData.map((tag, index) => (
                <motion.div
                  key={tag.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-zinc-800/50 rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm font-medium text-white">{tag.name}</span>
                  </div>
                  <p className="text-lg font-bold text-felixo-purple">{tag.duration}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
