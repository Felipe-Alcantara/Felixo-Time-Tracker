import { useState, useEffect, useCallback } from 'react';
import { timeEntryAPI } from '../services/api';

export const useTimer = () => {
  const [currentEntry, setCurrentEntry] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const fetchRunningEntry = useCallback(async () => {
    try {
      const response = await timeEntryAPI.getRunning();
      if (response.data) {
        setCurrentEntry(response.data);
        setIsRunning(true);
        
        // Calcular tempo decorrido
        const startTime = new Date(response.data.start_at);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      } else {
        setCurrentEntry(null);
        setIsRunning(false);
        setElapsedTime(0);
      }
    } catch (error) {
      console.error('Erro ao buscar timer ativo:', error);
    }
  }, []);

  const startTimer = async (data) => {
    try {
      const response = await timeEntryAPI.startTimer(data);
      setCurrentEntry(response.data);
      setIsRunning(true);
      setElapsedTime(0);
      return response.data;
    } catch (error) {
      console.error('Erro ao iniciar timer:', error);
      throw error;
    }
  };

  const stopTimer = async () => {
    if (!currentEntry) return;
    
    try {
      const response = await timeEntryAPI.stopTimer({ entry_id: currentEntry.id });
      setCurrentEntry(null);
      setIsRunning(false);
      setElapsedTime(0);
      return response.data;
    } catch (error) {
      console.error('Erro ao parar timer:', error);
      throw error;
    }
  };

  // Atualizar tempo decorrido a cada segundo
  useEffect(() => {
    let interval;
    
    if (isRunning && currentEntry) {
      interval = setInterval(() => {
        const startTime = new Date(currentEntry.start_at);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentEntry]);

  // Verificar timer ativo ao montar o componente
  useEffect(() => {
    fetchRunningEntry();
  }, [fetchRunningEntry]);

  return {
    currentEntry,
    elapsedTime,
    isRunning,
    startTimer,
    stopTimer,
    refreshTimer: fetchRunningEntry
  };
};