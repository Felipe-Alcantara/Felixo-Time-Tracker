#!/usr/bin/env python3
import hashlib
import os
import subprocess
import sys
import time
import webbrowser
from pathlib import Path


def print_step(message):
    print(f"[felixo-start] {message}")


def file_sha256(path):
    hasher = hashlib.sha256()
    with open(path, "rb") as file_obj:
        for chunk in iter(lambda: file_obj.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def read_text_or_none(path):
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8").strip()


def write_text(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def run_checked(cmd, cwd=None):
    cmd_display = " ".join(str(part) for part in cmd)
    print_step(f"Executando: {cmd_display}")
    subprocess.run(cmd, cwd=cwd, check=True)


def spawn_process(cmd, cwd=None):
    return subprocess.Popen(cmd, cwd=cwd)


def get_venv_python(backend_dir):
    if os.name == "nt":
        return backend_dir / "venv" / "Scripts" / "python.exe"
    return backend_dir / "venv" / "bin" / "python"


def get_npm_command():
    return "npm.cmd" if os.name == "nt" else "npm"


def ensure_backend_setup(backend_dir):
    venv_dir = backend_dir / "venv"
    venv_python = get_venv_python(backend_dir)
    requirements_file = backend_dir / "requirements.txt"
    requirements_hash_file = venv_dir / ".felixo_requirements.sha256"

    if not venv_python.exists():
        print_step("Criando ambiente virtual do backend...")
        run_checked([sys.executable, "-m", "venv", "venv"], cwd=backend_dir)

    current_requirements_hash = file_sha256(requirements_file)
    stored_requirements_hash = read_text_or_none(requirements_hash_file)
    should_install_requirements = stored_requirements_hash != current_requirements_hash

    if should_install_requirements:
        print_step("Instalando/atualizando dependências do backend...")
        run_checked([str(venv_python), "-m", "pip", "install", "--upgrade", "pip"], cwd=backend_dir)
        run_checked([str(venv_python), "-m", "pip", "install", "-r", "requirements.txt"], cwd=backend_dir)
        write_text(requirements_hash_file, current_requirements_hash)
    else:
        print_step("Dependências do backend já estão atualizadas.")

    print_step("Aplicando migrações do backend...")
    run_checked([str(venv_python), "manage.py", "migrate"], cwd=backend_dir)

    return venv_python


def ensure_frontend_setup(frontend_dir):
    npm_cmd = get_npm_command()
    node_modules_dir = frontend_dir / "node_modules"
    package_lock_file = frontend_dir / "package-lock.json"
    lock_hash_file = node_modules_dir / ".felixo_package_lock.sha256"

    current_lock_hash = file_sha256(package_lock_file) if package_lock_file.exists() else ""
    stored_lock_hash = read_text_or_none(lock_hash_file)
    should_install_node_modules = (not node_modules_dir.exists()) or (stored_lock_hash != current_lock_hash)

    if should_install_node_modules:
        print_step("Instalando/atualizando dependências do frontend...")
        run_checked([npm_cmd, "install"], cwd=frontend_dir)
        if current_lock_hash:
            write_text(lock_hash_file, current_lock_hash)
    else:
        print_step("Dependências do frontend já estão atualizadas.")

    return npm_cmd


def terminate_processes(processes):
    for process in processes:
        if process.poll() is None:
            process.terminate()
    for process in processes:
        if process.poll() is None:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


def main():
    print_step("Iniciando Felixo Time Tracker...")

    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"

    if not backend_dir.exists():
        print_step("Erro: diretório backend não encontrado.")
        sys.exit(1)
    if not frontend_dir.exists():
        print_step("Erro: diretório frontend não encontrado.")
        sys.exit(1)

    processes = []

    try:
        venv_python = ensure_backend_setup(backend_dir)
        npm_cmd = ensure_frontend_setup(frontend_dir)

        print_step("Iniciando backend Django...")
        backend_process = spawn_process([str(venv_python), "manage.py", "runserver"], cwd=backend_dir)
        processes.append(backend_process)

        print_step("Aguardando backend inicializar...")
        time.sleep(3)

        print_step("Iniciando frontend React...")
        frontend_process = spawn_process([npm_cmd, "run", "dev"], cwd=frontend_dir)
        processes.append(frontend_process)

        print_step("Aguardando frontend inicializar...")
        time.sleep(5)

        print_step("Abrindo navegador...")
        webbrowser.open("http://localhost:5173")

        print_step("Projeto iniciado com sucesso.")
        print_step("Frontend: http://localhost:5173")
        print_step("Backend API: http://localhost:8000/api")
        print_step("Admin Django: http://localhost:8000/admin")
        print_step("Pressione Ctrl+C para parar todos os serviços.")

        while True:
            if any(process.poll() is not None for process in processes):
                raise RuntimeError("Um dos serviços foi encerrado inesperadamente.")
            time.sleep(1)

    except KeyboardInterrupt:
        print_step("Interrupção detectada. Encerrando serviços...")
        terminate_processes(processes)
        print_step("Serviços encerrados.")
    except Exception as error:
        print_step(f"Erro: {error}")
        terminate_processes(processes)
        sys.exit(1)


if __name__ == "__main__":
    main()
