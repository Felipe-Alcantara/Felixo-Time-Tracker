# Felixo Time Tracker

**Tagline:** Ferramenta modular para marcar e analisar o tempo por categorias aninhadas, tasks e tags.

**O que é:** Aplicação full-stack (backend Python, frontend React) para registrar sessões de trabalho/estudo/lazer, com suporte para categorias dentro de categorias, tags, exportação CSV e visualizações de estatísticas.

## 🚀 Principais Features

- ⏱️ **Timer com start/stop** por task com suporte a edição manual de entradas
- 🌳 **Árvore de categorias** (multi-nível) com propriedades por categoria
- 🏷️ **Tags por entry** com filtros por dia/semana/mês
- 📊 **Dashboard completo**: tempo por categoria, por tag, heatmap, média de sessão
- 💾 **Offline-first** (SQLite local) + opção sync via API
- 📤 **Export CSV** para análise externa
- 🎨 **Interface moderna** seguindo o design system Felixoverse

## 🛠️ Stack Tecnológica

- **Backend**: Django + Django REST Framework
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Database**: SQLite (desenvolvimento) / PostgreSQL (produção)
- **Charts**: Recharts
- **Icons**: Lucide React

## 📁 Estrutura do Projeto

```
Felixo-Time-Tracker/
├── backend/                 # Django API
│   ├── timetracker/        # Configurações do projeto
│   ├── core/               # App principal
│   │   ├── models.py       # Modelos de dados
│   │   ├── serializers.py  # Serializers DRF
│   │   ├── views.py        # Views da API
│   │   └── urls.py         # URLs da API
│   ├── requirements.txt    # Dependências Python
│   └── manage.py          # Django CLI
├── frontend/               # React App
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── utils/          # Utilitários
│   │   └── App.jsx         # Componente principal
│   ├── package.json        # Dependências Node
│   └── tailwind.config.js  # Configuração Tailwind
└── README.md              # Este arquivo
```

## 🔧 Instalação e Configuração

### Pré-requisitos

- Python 3.11+
- Node.js 18+
- npm ou yarn

### 1. Backend (Django)

```bash
# Navegar para o diretório backend
cd backend

# Criar ambiente virtual (recomendado)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Instalar dependências
pip install -r requirements.txt

# Executar migrações
python manage.py makemigrations
python manage.py migrate

# Criar superusuário (opcional)
python manage.py createsuperuser

# Iniciar servidor de desenvolvimento
python manage.py runserver
```

O backend estará disponível em `http://localhost:8000`

### 2. Frontend (React)

```bash
# Navegar para o diretório frontend
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

## 📊 Modelo de Dados

### Categories (Categorias)
- Estrutura hierárquica com `parent_id`
- Materialized path para consultas eficientes
- Propriedades customizáveis (JSON)

### Tasks (Tarefas)
- Vinculadas a categorias
- Tags padrão configuráveis
- Propriedades como prioridade e status

### TimeEntry (Registros de Tempo)
- Start/end timestamps com timezone
- Duração calculada automaticamente
- Suporte a tags múltiplas
- Notas e metadados

### Tags
- Sistema flexível de etiquetas
- Cores customizáveis
- Reutilizáveis entre entries

## 🔌 API Endpoints

### Categorias
- `GET /api/categories/` - Listar categorias
- `GET /api/categories/tree/` - Árvore completa
- `POST /api/categories/` - Criar categoria
- `PUT /api/categories/{id}/` - Atualizar categoria

### Timer
- `POST /api/entries/start_timer/` - Iniciar timer
- `POST /api/entries/stop_timer/` - Parar timer
- `GET /api/entries/running/` - Timer ativo

### Estatísticas
- `GET /api/entries/stats_summary/` - Resumo estatístico
- `GET /api/entries/top_tasks/` - Top tasks por tempo
- `GET /api/entries/export_csv/` - Export CSV

## 🎨 Design System

O projeto segue o design system **Felixoverse** com:

- **Paleta**: Roxo Felixo (#C084FC) + tons de zinc
- **Tipografia**: Space Grotesk
- **Componentes**: Cards com glow effects, botões com animações
- **Layout**: Grid responsivo com breakpoints mobile-first

## 🧪 Testes Rápidos

### 1. Teste do Timer
```bash
# Backend rodando em localhost:8000
# Frontend rodando em localhost:5173

# 1. Criar uma categoria via admin ou API
# 2. Iniciar timer no frontend
# 3. Verificar se aparece no histórico
```

### 2. Teste da API
```bash
# Criar categoria
curl -X POST http://localhost:8000/api/categories/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Trabalho", "parent": null}'

# Iniciar timer
curl -X POST http://localhost:8000/api/entries/start_timer/ \
  -H "Content-Type: application/json" \
  -d '{"category_id": 1, "note": "Teste"}'
```

### 3. Teste das Estatísticas
```bash
# Obter estatísticas
curl "http://localhost:8000/api/entries/stats_summary/?from=2024-01-01&to=2024-12-31"
```

## 🚀 Deploy e Produção

### Backend
1. Configurar PostgreSQL
2. Definir variáveis de ambiente
3. Executar `python manage.py collectstatic`
4. Deploy via Heroku, Railway ou VPS

### Frontend
1. Build: `npm run build`
2. Deploy via Vercel, Netlify ou servir estático

### Desktop (Tauri - Opcional)
```bash
# Instalar Tauri CLI
npm install -g @tauri-apps/cli

# Configurar Tauri no frontend
npm install @tauri-apps/api

# Build desktop app
npm run tauri build
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Sugestões de Melhorias

- [ ] WebSocket para sincronização em tempo real
- [ ] Modo offline com sincronização
- [ ] Relatórios avançados (PDF)
- [ ] Integração com calendários
- [ ] Notificações de lembrete
- [ ] Metas e objetivos de tempo
- [ ] Integração com ferramentas de produtividade

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Felix** - [GitHub](https://github.com/felixoakz)

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!