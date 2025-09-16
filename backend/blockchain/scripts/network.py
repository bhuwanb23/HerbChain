import os
import click
from rich.console import Console
from scripts.utils.fabric_cli import run

console = Console()
ROOT = os.path.dirname(os.path.dirname(__file__))
CONFIG_DIR = os.path.join(ROOT, 'config')
DOCKER_DIR = os.path.join(ROOT, 'docker')


@click.group()
def cli():
    """HerbChain Network Orchestrator"""


def _bin(name: str) -> str:
    return name  # assumes binaries are on PATH


@cli.command()
@click.option('--generate', is_flag=True, help='Generate crypto and channel artifacts')
def up(generate: bool):
    """Start network containers."""
    if generate:
        console.rule("Generate crypto and channel artifacts")
        run([_bin('cryptogen'), 'generate', '--config=./backend/blockchain/config/crypto-config.yaml'])
        run([_bin('configtxgen'), '-profile', 'HerbChainGenesis', '-channelID', 'system-channel', '-outputBlock', './backend/blockchain/genesis.block', '-configPath', './backend/blockchain/config'])

    console.rule("Docker Compose Up")
    env_path = os.path.join(DOCKER_DIR, '.env')
    if not os.path.exists(env_path):
        console.print("[yellow]No docker/.env found, using defaults from env.example")
    run(['docker', 'compose', '-f', './backend/blockchain/docker/docker-compose.yaml', '--env-file', env_path if os.path.exists(env_path) else './backend/blockchain/docker/env.example', 'up', '-d'])


@cli.command()
def down():
    """Stop and remove network containers."""
    console.rule("Docker Compose Down")
    env_path = os.path.join(DOCKER_DIR, '.env')
    run(['docker', 'compose', '-f', './backend/blockchain/docker/docker-compose.yaml', '--env-file', env_path if os.path.exists(env_path) else './backend/blockchain/docker/env.example', 'down', '-v'])


if __name__ == '__main__':
    cli()
