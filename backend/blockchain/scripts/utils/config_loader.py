import os
from typing import Any, Dict
import yaml


def load_yaml(path: str) -> Dict[str, Any]:
    with open(path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f) or {}


def get_env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)
