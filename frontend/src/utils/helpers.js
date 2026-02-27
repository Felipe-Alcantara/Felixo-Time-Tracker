import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDuration = (seconds) => {
  if (!seconds) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDurationShort = (seconds) => {
  if (!seconds) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const formatDate = (date) => {
  const dateObj = new Date(date);
  
  if (isToday(dateObj)) {
    return 'Hoje';
  }
  
  if (isYesterday(dateObj)) {
    return 'Ontem';
  }
  
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
};

export const formatTime = (date) => {
  return format(new Date(date), 'HH:mm');
};

export const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true, 
    locale: ptBR 
  });
};

export const getTodayDateString = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getWeekDateRange = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  
  const monday = new Date(today.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    from: format(monday, 'yyyy-MM-dd'),
    to: format(sunday, 'yyyy-MM-dd')
  };
};

export const getMonthDateRange = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return {
    from: format(firstDay, 'yyyy-MM-dd'),
    to: format(lastDay, 'yyyy-MM-dd')
  };
};

export const getTagColor = (tagName) => {
  const colors = {
    'trabalho': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'estudo': 'bg-green-500/10 text-green-400 border-green-500/20',
    'pessoal': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'urgente': 'bg-red-500/10 text-red-400 border-red-500/20',
    'importante': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'reunião': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'desenvolvimento': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'design': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  };
  
  const normalizedTag = tagName.toLowerCase();
  return colors[normalizedTag] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
};