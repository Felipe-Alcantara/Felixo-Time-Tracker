#!/bin/bash

echo "🚀 Configurando Felixo Time Tracker..."

# Backend setup
echo "📦 Configurando backend..."
cd backend

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual..."
    python -m venv venv
fi

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
echo "Instalando dependências Python..."
pip install -r requirements.txt

# Configurar banco de dados
echo "Configurando banco de dados..."
python manage.py makemigrations
python manage.py migrate

# Criar dados de exemplo
echo "Criando dados de exemplo..."
python manage.py shell << EOF
from core.models import Category, Task, Tag

# Criar categorias de exemplo
trabalho = Category.objects.create(name="Trabalho")
programacao = Category.objects.create(name="Programação", parent=trabalho)
reunioes = Category.objects.create(name="Reuniões", parent=trabalho)

estudo = Category.objects.create(name="Estudo")
faculdade = Category.objects.create(name="Faculdade", parent=estudo)
autodidata = Category.objects.create(name="Autodidata", parent=estudo)

# Criar tags
Tag.objects.create(name="urgente", color="#EF4444")
Tag.objects.create(name="importante", color="#F59E0B")
Tag.objects.create(name="reunião", color="#3B82F6")
Tag.objects.create(name="desenvolvimento", color="#10B981")

# Criar tasks de exemplo
Task.objects.create(name="Desenvolver nova feature", category=programacao)
Task.objects.create(name="Code review", category=programacao)
Task.objects.create(name="Daily standup", category=reunioes)
Task.objects.create(name="Estudar Django", category=autodidata)

print("✅ Dados de exemplo criados!")
EOF

cd ..

# Frontend setup
echo "📦 Configurando frontend..."
cd frontend

# Instalar dependências
echo "Instalando dependências Node.js..."
npm install

cd ..

echo "✅ Configuração concluída!"
echo ""
echo "🚀 Para iniciar o projeto:"
echo "1. Backend: cd backend && python manage.py runserver"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "🌐 URLs:"
echo "- Frontend: http://localhost:5173"
echo "- Backend API: http://localhost:8000/api"
echo "- Admin Django: http://localhost:8000/admin"