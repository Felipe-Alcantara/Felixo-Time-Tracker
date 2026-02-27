@echo off
echo 🚀 Configurando Felixo Time Tracker...

REM Backend setup
echo 📦 Configurando backend...
cd backend

REM Criar ambiente virtual se não existir
if not exist "venv" (
    echo Criando ambiente virtual...
    python -m venv venv
)

REM Ativar ambiente virtual
call venv\Scripts\activate

REM Instalar dependências
echo Instalando dependências Python...
pip install -r requirements.txt

REM Configurar banco de dados
echo Configurando banco de dados...
python manage.py makemigrations
python manage.py migrate

echo ✅ Backend configurado!
echo.
echo Para criar um superusuário (opcional):
echo python manage.py createsuperuser
echo.

cd ..

REM Frontend setup
echo 📦 Configurando frontend...
cd frontend

REM Instalar dependências
echo Instalando dependências Node.js...
npm install

cd ..

echo ✅ Configuração concluída!
echo.
echo 🚀 Para iniciar o projeto:
echo 1. Backend: cd backend ^&^& venv\Scripts\activate ^&^& python manage.py runserver
echo 2. Frontend: cd frontend ^&^& npm run dev
echo.
echo 🌐 URLs:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000/api
echo - Admin Django: http://localhost:8000/admin

pause