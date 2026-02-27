#!/usr/bin/env python3
import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

def run_command(cmd, cwd=None, shell=True):
    """Execute command and return process"""
    return subprocess.Popen(cmd, cwd=cwd, shell=shell)

def main():
    print("🚀 Iniciando Felixo Time Tracker...")
    
    # Get project root directory
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"
    
    # Check if directories exist
    if not backend_dir.exists():
        print("❌ Diretório backend não encontrado!")
        return
    
    if not frontend_dir.exists():
        print("❌ Diretório frontend não encontrado!")
        return
    
    processes = []
    
    try:
        # Start Django backend
        print("📦 Iniciando backend Django...")
        if os.name == 'nt':  # Windows
            venv_activate = backend_dir / "venv" / "Scripts" / "activate.bat"
            backend_cmd = f'"{venv_activate}" && python manage.py runserver'
        else:  # Linux/Mac
            backend_cmd = "source venv/bin/activate && python manage.py runserver"
        
        backend_process = run_command(backend_cmd, cwd=backend_dir)
        processes.append(backend_process)
        
        # Wait for backend to start
        print("⏳ Aguardando backend inicializar...")
        time.sleep(3)
        
        # Start React frontend
        print("🎨 Iniciando frontend React...")
        frontend_cmd = "npm run dev"
        frontend_process = run_command(frontend_cmd, cwd=frontend_dir)
        processes.append(frontend_process)
        
        # Wait for frontend to start
        print("⏳ Aguardando frontend inicializar...")
        time.sleep(5)
        
        # Open browser
        print("🌐 Abrindo navegador...")
        webbrowser.open("http://localhost:5173")
        
        print("✅ Felixo Time Tracker iniciado com sucesso!")
        print("📍 Frontend: http://localhost:5173")
        print("📍 Backend API: http://localhost:8000/api")
        print("📍 Admin Django: http://localhost:8000/admin")
        print("\n💡 Pressione Ctrl+C para parar todos os serviços")
        
        # Keep processes running
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Parando serviços...")
        for process in processes:
            process.terminate()
        print("✅ Todos os serviços foram parados!")
    
    except Exception as e:
        print(f"❌ Erro: {e}")
        for process in processes:
            process.terminate()

if __name__ == "__main__":
    main()