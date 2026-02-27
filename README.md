# Felixo Time Tracker

Aplicação full-stack para registrar tempo por categorias hierárquicas, acompanhar histórico de sessões e visualizar estatísticas de produtividade.

## Visão geral

O projeto combina:

- Backend em Django + Django REST Framework para modelagem, regras de negócio e API REST.
- Frontend em React + Vite para timer, gestão de categorias e visualização analítica.
- Banco SQLite em desenvolvimento (com estrutura pronta para evoluir para produção).

## Funcionalidades atuais

### Timer e sessões

- Início e parada de timer via API (`start_timer` e `stop_timer`).
- Recuperação de timer ativo (`running`) para restaurar estado ao recarregar a página.
- Cálculo automático de duração (`duration_seconds`) quando uma sessão é finalizada.
- Registro de nota por sessão.

### Categorias e organização

- Categorias aninhadas com suporte a multi-nível (categoria pai e filhas).
- Árvore de categorias para seleção rápida no fluxo de timer.
- Gerenciador de categorias com visualização de métricas por categoria.
- Expansão para listar sessões da categoria.
- Exclusão de categorias e sessões.
- Expansão/recolhimento por clique na linha da categoria (não apenas na seta).
- Filhas ocultas quando a categoria mãe está recolhida.
- Botão para recolher todas as categorias.

### Histórico e edição

- Histórico agrupado por dia.
- Total de tempo por dia.
- Edição de entrada com validações de horário.
- Suporte para virada de dia na edição manual (ex.: início 23:30 e fim 01:30 no dia seguinte).

### Dashboard e análise

- Resumo por período (`hoje`, `semana`, `mês`).
- Tempo total, total de sessões e média por sessão.
- Gráfico de pizza por categoria.
- Top tasks por tempo.
- Bloco de tempo por tag.
- Exportação de entradas em CSV.

### UX e UI

- Design system documentado em [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- Componentes reutilizáveis (`Button`, `Card`, `Badge`, `Input`, `Select`, `Modal`).
- Interface responsiva com Tailwind e animações via Framer Motion.

## Stack tecnológica

- Backend: `Django 4.2`, `Django REST Framework`, `django-cors-headers`.
- Frontend: `React 18`, `Vite`, `Tailwind CSS`, `Framer Motion`, `Recharts`, `Axios`, `date-fns`.
- Banco: `SQLite` (desenvolvimento).

## Estrutura do repositório

```text
Felixo-Time-Tracker/
├── backend/
│   ├── core/                    # Models, serializers, views e rotas da API
│   ├── timetracker/             # settings.py, urls.py, wsgi/asgi
│   ├── requirements.txt
│   ├── manage.py
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── tests/                   # scripts utilitários de validação manual
├── setup.bat                    # setup Windows
├── setup.sh                     # setup Linux/macOS
├── start.py                     # sobe backend + frontend
├── start.bat                    # atalho Windows para start.py
└── README.md
```

## Requisitos

- Python 3.11+
- Node.js 18+
- npm

## Instalação

### Opção A: setup automático

Windows:

```bat
setup.bat
```

Linux/macOS:

```bash
bash setup.sh
```

### Opção B: setup manual

Backend:

```bash
cd backend
python -m venv venv
```

Windows:

```bat
venv\Scripts\activate
```

Linux/macOS:

```bash
source venv/bin/activate
```

Instalar dependências e migrar:

```bash
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
```

Frontend:

```bash
cd ../frontend
npm install
```

## Variáveis de ambiente (backend)

Existe um exemplo em `backend/.env.example`:

```env
SECRET_KEY=django-insecure-dev-key-change-in-production-12345
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Se quiser usar arquivo `.env`, copie o exemplo e ajuste os valores.

## Executando o projeto

### Inicialização rápida (recomendado em Windows)

```bat
start.bat
```

Ou:

```bash
python start.py
```

### Inicialização manual

Terminal 1 (backend):

```bash
cd backend
python manage.py runserver
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

URLs padrão:

- Frontend: `http://localhost:5173`
- API: `http://localhost:8000/api`
- Admin Django: `http://localhost:8000/admin`

## API REST (resumo)

Base URL: `http://localhost:8000/api`

Recursos principais:

- `GET /categories/`
- `POST /categories/`
- `PUT /categories/{id}/`
- `DELETE /categories/{id}/`
- `GET /categories/tree/`
- `GET /categories/{id}/stats/`
- `GET /tasks/`
- `POST /tasks/`
- `GET /tags/`
- `POST /tags/`
- `GET /entries/`
- `POST /entries/`
- `PUT /entries/{id}/`
- `DELETE /entries/{id}/`
- `GET /entries/running/`
- `POST /entries/start_timer/`
- `POST /entries/stop_timer/`
- `GET /entries/stats_summary/`
- `GET /entries/top_tasks/`
- `GET /entries/export_csv/`

Exemplo rápido:

```bash
curl -X POST http://localhost:8000/api/categories/ \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Trabalho\",\"parent\":null}"
```

## Scripts úteis

Raiz do projeto:

- `setup.bat`: setup automático no Windows.
- `setup.sh`: setup automático no Linux/macOS.
- `start.py`: inicia backend + frontend e abre navegador.
- `start.bat`: atalho para executar `start.py`.
- `open-browser.bat`: abre `http://localhost:5173`.

Frontend:

- `npm run dev`: ambiente de desenvolvimento.
- `npm run build`: build de produção.
- `npm run preview`: preview da build.

## Testes e validações

O repositório inclui scripts utilitários em `frontend/tests` para validar cenários de horário e virada de dia.

- `frontend/tests/time-tests.js`
- `frontend/tests/day-transition-test.js`

Eles são focados em validação manual/diagnóstico e podem ser executados em ambiente de desenvolvimento.

## Próximas melhorias sugeridas

- WebSocket para atualização em tempo real.
- Sincronização offline/online robusta.
- Relatórios avançados (ex.: PDF).
- Metas de tempo por categoria/task.
- Notificações e alertas.

## Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE).

## Autor

Felix: [https://github.com/felixoakz](https://github.com/felixoakz)
