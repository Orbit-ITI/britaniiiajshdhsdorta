#!/usr/bin/env python3
"""
start.py — Запускает портал Британской Империи через Cloudflare Tunnel
Использование:
  python start.py            — собрать фронт + запустить сервер + туннель
  python start.py --no-build — пропустить npm build (если уже собрано)
  python start.py --dev      — режим разработки (vite + сервер параллельно)
"""

import os, sys, re, time, platform, subprocess, threading, urllib.request, shutil, signal
from pathlib import Path

IS_WIN      = platform.system() == "Windows"
PORT        = 3001
SCRIPT_DIR  = Path(__file__).parent.resolve()
CLOUDFLARED = SCRIPT_DIR / ("cloudflared.exe" if IS_WIN else "cloudflared")

# На Windows npm это npm.cmd — иначе FileNotFoundError
NPM  = "npm.cmd"  if IS_WIN else "npm"
NODE = "node.exe" if IS_WIN else "node"

CLOUDFLARED_URLS = {
    "Windows": "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe",
    "Linux":   "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64",
    "Darwin":  "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz",
}

def c(text, code): return f"\033[{code}m{text}\033[0m" if sys.stdout.isatty() else text
GREEN  = lambda t: c(t, "32")
YELLOW = lambda t: c(t, "33")
CYAN   = lambda t: c(t, "36")
BOLD   = lambda t: c(t, "1")
RED    = lambda t: c(t, "31")

def banner(): print(f"\n{BOLD('  🏰  Британская Империя — Государственный Портал')}\n{CYAN('  ─────────────────────────────────────────────────')}\n")
def step(m): print(YELLOW(f"  ⏳ {m}..."))
def ok(m):   print(GREEN (f"  ✓  {m}"))
def info(m): print(CYAN  (f"  ℹ  {m}"))
def err(m):  print(RED   (f"  ✗  {m}"))

def run_cmd(args, **kw):
    """subprocess.run — shell=True на Windows чтобы найти .cmd файлы"""
    return subprocess.run(args, shell=IS_WIN, **kw)

def popen_cmd(args, **kw):
    """subprocess.Popen — shell=True на Windows"""
    return subprocess.Popen(args, shell=IS_WIN, **kw)

# ─── cloudflared ─────────────────────────────────────────────
def ensure_cloudflared():
    if shutil.which("cloudflared"):
        ok("cloudflared найден в PATH")
        return shutil.which("cloudflared")
    if CLOUDFLARED.exists():
        ok(f"cloudflared найден: {CLOUDFLARED}")
        return str(CLOUDFLARED)

    system = platform.system()
    url = CLOUDFLARED_URLS.get(system)
    if not url:
        err(f"Неизвестная ОС: {system}. Скачайте вручную: https://github.com/cloudflare/cloudflared/releases")
        sys.exit(1)

    step(f"Скачиваю cloudflared для {system}")
    try:
        if system == "Darwin":
            tgz = SCRIPT_DIR / "cloudflared.tgz"
            urllib.request.urlretrieve(url, str(tgz))
            subprocess.run(["tar", "-xzf", str(tgz), "-C", str(SCRIPT_DIR)], check=True)
            tgz.unlink(missing_ok=True)
        else:
            urllib.request.urlretrieve(url, str(CLOUDFLARED))
        if system != "Windows":
            CLOUDFLARED.chmod(0o755)
        ok("cloudflared скачан")
        return str(CLOUDFLARED)
    except Exception as e:
        err(f"Ошибка скачивания: {e}")
        err("Скачайте вручную: https://github.com/cloudflare/cloudflared/releases")
        sys.exit(1)

# ─── npm install ─────────────────────────────────────────────
def ensure_deps():
    if not (SCRIPT_DIR / "node_modules").exists():
        step("Устанавливаю зависимости (npm install)")
        r = run_cmd([NPM, "install"], cwd=str(SCRIPT_DIR), capture_output=True, text=True)
        if r.returncode != 0:
            err("npm install завершился с ошибкой")
            print(r.stderr[-1000:])
            sys.exit(1)
        ok("Зависимости установлены")

# ─── npm run build ───────────────────────────────────────────
def build_frontend():
    step("Сборка фронтенда (npm run build)")
    r = run_cmd([NPM, "run", "build"], cwd=str(SCRIPT_DIR), capture_output=True, text=True)
    if r.returncode != 0:
        err("Ошибка сборки!")
        print(r.stdout[-3000:])
        print(r.stderr[-1000:])
        sys.exit(1)
    ok("Фронтенд собран")

# ─── Node server ─────────────────────────────────────────────
def start_server():
    step(f"Запускаю сервер на порту {PORT}")
    env = os.environ.copy()
    env["PORT"] = str(PORT)

    proc = popen_cmd(
        [NODE, "--experimental-sqlite", "server/index.js"],
        cwd=str(SCRIPT_DIR), env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, bufsize=1,
    )

    started = threading.Event()
    lines   = []

    def reader():
        for line in proc.stdout:
            lines.append(line.rstrip())
            print(f"    [server] {line.rstrip()}")
            if "Сервер запущен" in line or "listening" in line.lower() or f":{PORT}" in line:
                started.set()

    threading.Thread(target=reader, daemon=True).start()

    if not started.wait(timeout=20):
        time.sleep(2)
        if proc.poll() is not None:
            err("Сервер не запустился:")
            for l in lines[-10:]: print(f"    {l}")
            sys.exit(1)

    ok(f"Сервер запущен → http://localhost:{PORT}")
    return proc

# ─── cloudflared tunnel ──────────────────────────────────────
def start_tunnel(cf_path):
    step("Открываю Cloudflare Tunnel")
    proc = subprocess.Popen(
        [cf_path, "tunnel", "--url", f"http://localhost:{PORT}"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, bufsize=1,
    )

    tunnel_url = None
    url_event  = threading.Event()
    all_lines  = []
    url_re     = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")

    def reader():
        nonlocal tunnel_url
        for line in proc.stdout:
            all_lines.append(line.rstrip())
            m = url_re.search(line)
            if m:
                tunnel_url = m.group(0)
                url_event.set()

    threading.Thread(target=reader, daemon=True).start()

    if not url_event.wait(timeout=40):
        err("Не удалось получить URL туннеля за 40 секунд")
        for l in all_lines[-15:]: print(f"    {l}")
        proc.terminate()
        return None, proc

    return tunnel_url, proc

# ─── Main ────────────────────────────────────────────────────
def main():
    banner()

    no_build = "--no-build" in sys.argv
    dev_mode = "--dev"      in sys.argv

    ensure_deps()
    cf_path   = ensure_cloudflared()
    processes = []

    if dev_mode:
        info("Режим разработки: vite + node параллельно")
        processes.append(start_server())
        step("Запускаю Vite dev server")
        vite = popen_cmd([NPM, "run", "dev"], cwd=str(SCRIPT_DIR))
        processes.append(vite)
        info("Фронт → http://localhost:5173")
        info(f"API   → http://localhost:{PORT}/api")
        info("Нажмите Ctrl+C для остановки\n")
        try:
            vite.wait()
        except KeyboardInterrupt:
            pass
    else:
        if not no_build:
            build_frontend()
        else:
            info("Пропуск сборки (--no-build)")

        if not (SCRIPT_DIR / "dist").exists():
            err("Папка dist/ не найдена. Запустите без --no-build")
            sys.exit(1)

        processes.append(start_server())

        tunnel_url, tunnel_proc = start_tunnel(cf_path)
        processes.append(tunnel_proc)

        if tunnel_url:
            print()
            print(BOLD("  ┌─────────────────────────────────────────────────────┐"))
            print(BOLD("  │                                                     │"))
            print(BOLD("  │  ") + GREEN("🌐 Ваш сайт доступен по адресу:                 ") + BOLD("│"))
            print(BOLD("  │                                                     │"))
            print(BOLD("  │  ") + CYAN(f"  {tunnel_url:<49}") + BOLD("│"))
            print(BOLD("  │                                                     │"))
            print(BOLD("  └─────────────────────────────────────────────────────┘"))
            print()
            info(f"Локально: http://localhost:{PORT}")
            info("Нажмите Ctrl+C для остановки\n")

    def cleanup(sig=None, frame=None):
        print()
        step("Останавливаю процессы")
        for p in processes:
            try: p.terminate()
            except: pass
        ok("Остановлено")
        sys.exit(0)

    signal.signal(signal.SIGINT,  cleanup)
    if not IS_WIN:
        signal.signal(signal.SIGTERM, cleanup)

    try:
        while all(p.poll() is None for p in processes):
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

    cleanup()

if __name__ == "__main__":
    main()
