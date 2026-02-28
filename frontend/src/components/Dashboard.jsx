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
      case 'all':
        return {};
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
      <div className="space-y-6">
        {/* Header com controles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-8 w-48 bg-zinc-800/50 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-zinc-800/50 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-zinc-800/50 rounded-xl animate-pulse"></div>
            <div className="h-10 w-32 bg-zinc-800/50 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 bg-zinc-800/50 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-zinc-800/50 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-40 bg-zinc-800/50 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-zinc-800/50 rounded-xl"></div>
              </CardContent>
            </Card>
          ))}
        </div>
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
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Estatísticas do seu tempo.</p>
        </div>
        
        <div className="flex gap-3">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-auto"
            wrapperClassName="w-auto"
          >
            <option value="all">Todo período</option>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-400">
              <Clock size={18} />
              Tempo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {formatDurationShort(stats?.total_seconds || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-400">
              <Calendar size={18} />
              Sessões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {stats?.total_entries || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-400">
              <TrendingUp size={18} />
              Média por Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {formatDurationShort(stats?.avg_session_seconds || 0)}
            </p>
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
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={5}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="focus:outline-none transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [formatDurationShort(value), props.payload.name]}
                    labelStyle={{ color: '#FFF' }}
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.8)',
                      borderColor: '#555',
                      borderRadius: '10px',
                      color: '#FFF'
                    }}
                    itemStyle={{ color: '#FFF' }}
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
                <BarChart data={topTasks} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis 
                    type="number"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => formatDurationShort(value)}
                    axisLine={false}
                  />
                  <YAxis 
                    type="category"
                    dataKey="task__name"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    width={100}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [formatDurationShort(value), 'Duração']}
                    labelStyle={{ color: '#FFF' }}
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.8)',
                      borderColor: '#555',
                      borderRadius: '10px',
                      color: '#FFF'
                    }}
                    itemStyle={{ color: '#FFF' }}
                    cursor={{ fill: 'rgba(192, 132, 252, 0.1)' }}
                  />
                  <Bar dataKey="total_seconds" fill="#A855F7" radius={[0, 10, 10, 0]} />
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
            <div className="flex flex-wrap gap-3">
              {tagData.map((tag) => (
                <Badge key={tag.name} color="purple" className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-semibold">{tag.name}</span>
                  <span className="text-zinc-400">{tag.duration}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
