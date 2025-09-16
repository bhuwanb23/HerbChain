import os
import sys
from rich.console import Console

console = Console()


def ping():
    console.print("[green]HerbChain client reachable. Configure Fabric Gateway to proceed.")


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'ping':
        ping()
    else:
        console.print("Usage: python herbchain_client.py ping")
