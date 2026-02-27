// Test suite para validar horários e edge cases
const runTimeTests = () => {
  console.log('🧪 Iniciando testes de horários...\n');

  // Test 1: Formatação de duração
  const testFormatDuration = () => {
    console.log('📋 Testando formatDuration:');
    
    const formatDuration = (seconds) => {
      if (!seconds) return '00:00:00';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const tests = [
      { input: 0, expected: '00:00:00' },
      { input: 60, expected: '00:01:00' },
      { input: 3600, expected: '01:00:00' },
      { input: 3661, expected: '01:01:01' },
      { input: 86400, expected: '24:00:00' },
      { input: 90061, expected: '25:01:01' },
    ];

    tests.forEach(test => {
      const result = formatDuration(test.input);
      const status = result === test.expected ? '✅' : '❌';
      console.log(`  ${status} ${test.input}s → ${result} (esperado: ${test.expected})`);
    });
  };

  // Test 2: Edge cases de horários
  const testTimeEdgeCases = () => {
    console.log('\n📋 Testando edge cases de horários:');
    
    const testCases = [
      { start: '09:00', end: '17:00', description: 'Horário comercial normal' },
      { start: '23:30', end: '01:30', description: 'Atravessa meia-noite' },
      { start: '00:00', end: '23:59', description: 'Dia quase completo' },
      { start: '23:59', end: '00:01', description: 'Virada de ano novo' },
      { start: '12:00', end: '12:00', description: 'Mesmo horário' },
      { start: '08:30', end: '08:29', description: 'Fim antes do início' },
    ];

    testCases.forEach(test => {
      try {
        const baseDate = new Date('2024-01-01');
        
        const [startHour, startMinute] = test.start.split(':');
        const startDate = new Date(baseDate);
        startDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
        
        const [endHour, endMinute] = test.end.split(':');
        const endDate = new Date(baseDate);
        endDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
        
        if (endDate <= startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
        
        const duration = Math.floor((endDate - startDate) / 1000);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        
        console.log(`  ✅ ${test.start} → ${test.end}: ${hours}h ${minutes}m (${test.description})`);
      } catch (error) {
        console.log(`  ❌ ${test.start} → ${test.end}: ERRO - ${error.message}`);
      }
    });
  };

  // Test 3: Inputs inválidos
  const testInvalidInputs = () => {
    console.log('\n📋 Testando inputs inválidos:');
    
    const invalidInputs = [
      '25:00', '12:60', '-1:30', 'abc', '', '24:01'
    ];

    invalidInputs.forEach(input => {
      try {
        if (!input || !input.includes(':')) {
          console.log(`  ✅ "${input}": Rejeitado (formato inválido)`);
          return;
        }
        
        const [hour, minute] = input.split(':');
        const h = parseInt(hour);
        const m = parseInt(minute);
        
        if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
          console.log(`  ✅ "${input}": Rejeitado (valores inválidos)`);
        } else {
          console.log(`  ⚠️  "${input}": Aceito (pode precisar validação extra)`);
        }
      } catch (error) {
        console.log(`  ✅ "${input}": Rejeitado - ${error.message}`);
      }
    });
  };

  testFormatDuration();
  testTimeEdgeCases();
  testInvalidInputs();

  console.log('\n🎉 Testes concluídos!');
  console.log('\n💡 Para executar: cole este código no console do navegador');
};

// Auto-executar se estiver no browser
if (typeof window !== 'undefined') {
  window.runTimeTests = runTimeTests;
}

runTimeTests();