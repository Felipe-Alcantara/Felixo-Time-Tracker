// Teste específico para troca de dias e persistência no banco
const testDayTransitions = async () => {
  console.log('🌅 Testando trocas de dia e persistência...\n');

  const API_BASE = 'http://localhost:8000/api';

  // Helper para fazer requisições
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return response.json();
  };

  // Test 1: Criar entrada que atravessa meia-noite
  const testMidnightCrossing = async () => {
    console.log('📋 Teste 1: Entrada atravessando meia-noite');
    
    try {
      // Buscar uma categoria existente
      const categories = await apiCall('/categories/tree/');
      const flatCategories = [];
      
      // Achatar árvore de categorias
      const flatten = (cats) => {
        cats.forEach(cat => {
          flatCategories.push(cat);
          if (cat.children) flatten(cat.children);
        });
      };
      
      flatten(categories);
      
      if (!flatCategories.length) {
        console.log('  ❌ Nenhuma categoria encontrada. Crie uma primeiro.');
        return;
      }
      
      const category = flatCategories[0];
      
      // Criar entrada manual que atravessa meia-noite
      const today = new Date();
      const startTime = new Date(today);
      startTime.setHours(23, 30, 0, 0); // 23:30
      
      const endTime = new Date(today);
      endTime.setDate(today.getDate() + 1); // Próximo dia
      endTime.setHours(1, 30, 0, 0); // 01:30
      
      const entryData = {
        category: category.id,
        start_at: startTime.toISOString(),
        end_at: endTime.toISOString(),
        note: 'Teste atravessando meia-noite'
      };
      
      console.log(`  📤 Enviando: ${startTime.toLocaleTimeString()} → ${endTime.toLocaleTimeString()}`);
      
      const result = await apiCall('/entries/', 'POST', entryData);
      
      if (result.id) {
        const duration = result.duration_seconds;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        
        console.log(`  ✅ Criado: ID ${result.id}`);
        console.log(`  ⏱️  Duração calculada: ${hours}h ${minutes}m (${duration}s)`);
        console.log(`  📅 Data início: ${new Date(result.start_at).toLocaleString()}`);
        console.log(`  📅 Data fim: ${new Date(result.end_at).toLocaleString()}`);
        
        // Verificar se a duração está correta (2 horas = 7200 segundos)
        if (duration === 7200) {
          console.log('  ✅ Duração correta: 2 horas');
        } else {
          console.log(`  ❌ Duração incorreta: esperado 7200s, obtido ${duration}s`);
        }
        
        return result.id;
      } else {
        console.log('  ❌ Erro ao criar entrada:', result);
      }
    } catch (error) {
      console.log('  ❌ Erro:', error.message);
    }
  };

  // Test 2: Testar diferentes cenários de troca de dia
  const testVariousDayTransitions = async () => {
    console.log('\n📋 Teste 2: Vários cenários de troca de dia');
    
    const scenarios = [
      { start: '23:59', end: '00:01', expectedHours: 0, expectedMinutes: 2 },
      { start: '22:00', end: '02:00', expectedHours: 4, expectedMinutes: 0 },
      { start: '20:30', end: '08:15', expectedHours: 11, expectedMinutes: 45 },
    ];

    for (const scenario of scenarios) {
      try {
        const categories = await apiCall('/categories/tree/');
        const flatCategories = [];
        
        const flatten = (cats) => {
          cats.forEach(cat => {
            flatCategories.push(cat);
            if (cat.children) flatten(cat.children);
          });
        };
        
        flatten(categories);
        
        if (!flatCategories.length) continue;
        
        const today = new Date();
        const startTime = new Date(today);
        const [startHour, startMinute] = scenario.start.split(':');
        startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
        
        const endTime = new Date(today);
        const [endHour, endMinute] = scenario.end.split(':');
        endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
        
        // Se hora final é menor, é no próximo dia
        if (endTime <= startTime) {
          endTime.setDate(endTime.getDate() + 1);
        }
        
        const entryData = {
          category: flatCategories[0].id,
          start_at: startTime.toISOString(),
          end_at: endTime.toISOString(),
          note: `Teste ${scenario.start} → ${scenario.end}`
        };
        
        const result = await apiCall('/entries/', 'POST', entryData);
        
        if (result.id) {
          const duration = result.duration_seconds;
          const hours = Math.floor(duration / 3600);
          const minutes = Math.floor((duration % 3600) / 60);
          
          const expectedDuration = scenario.expectedHours * 3600 + scenario.expectedMinutes * 60;
          const isCorrect = duration === expectedDuration;
          
          console.log(`  ${isCorrect ? '✅' : '❌'} ${scenario.start} → ${scenario.end}: ${hours}h ${minutes}m`);
          if (!isCorrect) {
            console.log(`    Esperado: ${scenario.expectedHours}h ${scenario.expectedMinutes}m`);
          }
        }
      } catch (error) {
        console.log(`  ❌ Erro no cenário ${scenario.start} → ${scenario.end}:`, error.message);
      }
    }
  };

  // Test 3: Verificar persistência no banco
  const testDatabasePersistence = async (entryId) => {
    console.log('\n📋 Teste 3: Verificando persistência no banco');
    
    try {
      // Buscar a entrada criada
      const entry = await apiCall(`/entries/${entryId}/`);
      
      if (entry.id) {
        console.log('  ✅ Entrada encontrada no banco');
        console.log(`  📊 Duração persistida: ${entry.duration_seconds}s`);
        console.log(`  📝 Nota: ${entry.note}`);
        
        // Verificar se as datas estão corretas
        const startDate = new Date(entry.start_at);
        const endDate = new Date(entry.end_at);
        const calculatedDuration = Math.floor((endDate - startDate) / 1000);
        
        if (calculatedDuration === entry.duration_seconds) {
          console.log('  ✅ Duração calculada confere com a persistida');
        } else {
          console.log('  ❌ Duração não confere:');
          console.log(`    Calculada: ${calculatedDuration}s`);
          console.log(`    Persistida: ${entry.duration_seconds}s`);
        }
      }
    } catch (error) {
      console.log('  ❌ Erro ao verificar persistência:', error.message);
    }
  };

  // Executar todos os testes
  console.log('🚀 Iniciando testes de troca de dia...\n');
  
  const entryId = await testMidnightCrossing();
  await testVariousDayTransitions();
  
  if (entryId) {
    await testDatabasePersistence(entryId);
  }
  
  console.log('\n🎉 Testes de troca de dia concluídos!');
  console.log('\n💡 Verifique também no admin Django: http://localhost:8000/admin');
};

// Executar teste
testDayTransitions();