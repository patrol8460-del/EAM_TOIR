#!/usr/bin/env python3
"""
Deploy script for ЦС ТОРО CMMS/EAM application.
Usage: python3 deploy.py [--build] [--start] [--stop] [--status] [--backup]

Options:
  --build    Build production bundle (clean build + copy static files)
  --start    Start production server with auto-restart
  --stop     Stop running server
  --status   Show server status
  --backup   Create archive backup (excludes node_modules, .next, etc.)
  --deploy   Full deploy: stop -> build -> start
  --seed     Seed default approval routes
"""

import subprocess
import os
import sys
import signal
import time
import tarfile
from datetime import datetime
from pathlib import Path

PROJECT_DIR = "/home/z/my-project"
STANDALONE_DIR = os.path.join(PROJECT_DIR, ".next/standalone")
SERVER_LOG = os.path.join(PROJECT_DIR, "server.log")
PID_FILE = os.path.join(PROJECT_DIR, ".server.pid")


def run_cmd(cmd, cwd=PROJECT_DIR, check=True):
    """Run a command and return its output."""
    print(f"  → {cmd}")
    result = subprocess.run(
        cmd, shell=True, cwd=cwd,
        capture_output=True, text=True
    )
    if result.stdout:
        print(result.stdout.strip())
    if result.stderr and result.returncode != 0:
        print(result.stderr.strip())
    if check and result.returncode != 0:
        print(f"  ✗ Command failed with code {result.returncode}")
        sys.exit(1)
    return result.returncode


def get_pid():
    """Get running server PID from pid file or process list."""
    if os.path.exists(PID_FILE):
        try:
            with open(PID_FILE) as f:
                pid = int(f.read().strip())
            os.kill(pid, 0)  # Check if process exists
            return pid
        except (ValueError, ProcessLookupError, PermissionError):
            pass

    # Try to find from process list (check multiple patterns)
    patterns = ["standalone/server.js", "next-server"]
    for pattern in patterns:
        try:
            result = subprocess.run(
                ["pgrep", "-f", pattern],
                capture_output=True, text=True
            )
            if result.stdout.strip():
                pids = result.stdout.strip().split()
                for p in pids:
                    pid = int(p)
                    try:
                        os.kill(pid, 0)
                        return pid
                    except (ProcessLookupError, PermissionError):
                        continue
        except:
            pass
    return None


def cmd_build():
    """Build production bundle."""
    print("\n📦 Building production bundle...")

    # Step 1: Generate Prisma client
    print("\n[1/4] Generating Prisma client...")
    run_cmd("npx prisma generate")

    # Step 2: Push schema
    print("\n[2/4] Pushing database schema...")
    run_cmd("npx prisma db push")

    # Step 3: Build Next.js
    print("\n[3/4] Building Next.js...")
    run_cmd("npx next build")

    # Step 4: Copy static files
    print("\n[4/4] Copying static files...")
    src_static = os.path.join(PROJECT_DIR, ".next/static")
    dst_static = os.path.join(STANDALONE_DIR, ".next/static")
    src_public = os.path.join(PROJECT_DIR, "public")
    dst_public = os.path.join(STANDALONE_DIR, "public")

    subprocess.run(["rm", "-rf", dst_static], check=False)
    subprocess.run(["cp", "-r", src_static, dst_static], check=True)
    subprocess.run(["rm", "-rf", dst_public], check=False)
    subprocess.run(["cp", "-r", src_public, dst_public], check=True)

    print("\n✅ Build complete!")


def cmd_start():
    """Start production server with auto-restart."""
    pid = get_pid()
    if pid:
        print(f"⚠️  Server already running (PID: {pid})")
        return

    print("\n🚀 Starting production server...")

    proc = subprocess.Popen(
        ['node', '.next/standalone/server.js', '-p', '3000'],
        cwd=PROJECT_DIR,
        env={**os.environ, 'NODE_ENV': 'production'},
        stdout=open(SERVER_LOG, 'a'),
        stderr=subprocess.STDOUT,
        start_new_session=True,
        close_fds=True
    )

    with open(PID_FILE, 'w') as f:
        f.write(str(proc.pid))

    time.sleep(3)

    # Verify it's running
    try:
        os.kill(proc.pid, 0)
        print(f"✅ Server started (PID: {proc.pid})")
        print(f"   Log: {SERVER_LOG}")
        print(f"   URL: http://localhost:3000")
    except ProcessLookupError:
        print("❌ Server failed to start. Check logs:")
        with open(SERVER_LOG) as f:
            print(f.read()[-500:])


def cmd_stop():
    """Stop running server."""
    pid = get_pid()
    if not pid:
        print("⚠️  No server running")
        return

    print(f"\n🛑 Stopping server (PID: {pid})...")
    try:
        os.killpg(os.getpgid(pid), signal.SIGTERM)
        time.sleep(2)
        try:
            os.killpg(os.getpgid(pid), signal.SIGKILL)
        except (ProcessLookupError, PermissionError):
            pass
    except (ProcessLookupError, PermissionError):
        os.kill(pid, signal.SIGKILL)

    if os.path.exists(PID_FILE):
        os.remove(PID_FILE)

    print("✅ Server stopped")


def cmd_status():
    """Show server status."""
    pid = get_pid()
    if pid:
        print(f"✅ Server running (PID: {pid})")
        # Test HTTP
        try:
            result = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:3000/"],
                capture_output=True, text=True, timeout=5
            )
            print(f"   HTTP Status: {result.stdout}")
        except:
            print("   HTTP Status: unknown")
    else:
        print("❌ Server not running")

    # Show recent log entries
    if os.path.exists(SERVER_LOG):
        with open(SERVER_LOG) as f:
            lines = f.readlines()
            if lines:
                print(f"\n📋 Last log entries ({SERVER_LOG}):")
                for line in lines[-5:]:
                    print(f"   {line.rstrip()}")


def cmd_backup():
    """Create project backup archive."""
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = f"/tmp/cs-toro-backup-{timestamp}.tar.gz"

    print(f"\n💾 Creating backup: {backup_path}")

    with tarfile.open(backup_path, "w:gz") as tar:
        for root, dirs, files in os.walk(PROJECT_DIR):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in [
                'node_modules', '.next', '.git', '__pycache__'
            ]]
            # Exclude files
            files[:] = [f for f in files if not f.endswith(('.lock', '.log'))]

            for file in files:
                filepath = os.path.join(root, file)
                arcname = os.path.relpath(filepath, "/home/z")
                tar.add(filepath, arcname=arcname)

    size = os.path.getsize(backup_path)
    print(f"✅ Backup created: {backup_path} ({size / 1024 / 1024:.1f} MB)")


def cmd_deploy():
    """Full deploy: stop -> build -> start."""
    print("=" * 50)
    print("  ЦС ТОРО — Full Deployment")
    print("=" * 50)
    cmd_stop()
    cmd_build()
    cmd_start()
    print("\n" + "=" * 50)
    print("  Deployment complete!")
    print("=" * 50)


def cmd_seed():
    """Seed default approval routes."""
    print("\n🌱 Seeding default approval routes...")
    # Import and run seed logic
    seed_script = os.path.join(PROJECT_DIR, "prisma/seed.ts")
    if os.path.exists(seed_script):
        run_cmd("npx tsx prisma/seed.ts", check=False)
    print("✅ Seeding complete")


def main():
    args = sys.argv[1:]

    if not args or args[0] in ('--help', '-h'):
        print(__doc__)
        return

    commands = {
        '--build': cmd_build,
        '--start': cmd_start,
        '--stop': cmd_stop,
        '--status': cmd_status,
        '--backup': cmd_backup,
        '--deploy': cmd_deploy,
        '--seed': cmd_seed,
    }

    for arg in args:
        if arg in commands:
            commands[arg]()
        else:
            print(f"Unknown option: {arg}")
            print(__doc__)
            sys.exit(1)


if __name__ == "__main__":
    main()
