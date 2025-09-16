import subprocess
from typing import List
from rich.console import Console

console = Console()


def run(cmd: List[str], check: bool = True) -> int:
    console.log(f"[bold blue]$ {' '.join(cmd)}")
    proc = subprocess.run(cmd)
    if check and proc.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}")
    return proc.returncode
