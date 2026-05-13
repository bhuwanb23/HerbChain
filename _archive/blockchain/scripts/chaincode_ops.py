import os
import click
from rich.console import Console
from scripts.utils.fabric_cli import run

console = Console()
ROOT = os.path.dirname(os.path.dirname(__file__))
CHAINCODE_DIR = os.path.join(ROOT, 'chaincode', 'herbchain_stub')


@click.command()
@click.option('--name', default='herbchain', help='Chaincode name')
@click.option('--version', default='0.1.0', help='Chaincode version')
@click.option('--lang', default='node', type=click.Choice(['node', 'golang']), help='Chaincode language')
def deploy(name: str, version: str, lang: str):
    """Deploy chaincode (stub) - generates package only (illustrative)."""
    console.rule("Package chaincode (stub)")
    if not os.path.exists(CHAINCODE_DIR):
        console.print("[red]Chaincode directory not found")
        raise SystemExit(1)
    tgz = os.path.join(ROOT, f'{name}-{version}.tgz')
    run(['tar', 'czf', tgz, '-C', CHAINCODE_DIR, '.'])
    console.print(f"[green]Packaged chaincode -> {tgz}")


if __name__ == '__main__':
    deploy()
