import os
import click
from rich.console import Console
from scripts.utils.fabric_cli import run

console = Console()
ROOT = os.path.dirname(os.path.dirname(__file__))


@click.group()
def cli():
    """Channel operations"""


@cli.command('create-all')
def create_all():
    """Create all HerbChain channels (stubs)."""
    console.rule("Create channels (tx generation assumed)")
    for channel in [
        ('farmer-lab', 'FarmerLabChannel'),
        ('lab-processor', 'LabProcessorChannel'),
        ('processor-ayush', 'ProcessorAyushChannel'),
        ('consumer-read', 'ConsumerReadChannel'),
    ]:
        name, profile = channel
        run(['configtxgen', '-profile', profile, '-channelID', name, '-outputCreateChannelTx', f'./backend/blockchain/channel-artifacts/{name}.tx', '-configPath', './backend/blockchain/config'])
        console.log(f"Prepared create tx for {name}")
    console.print("[green]Channel create TX files are generated under channel-artifacts/")


if __name__ == '__main__':
    cli()
