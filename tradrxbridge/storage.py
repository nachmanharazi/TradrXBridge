import json
import os

DATA_FILE = os.environ.get('TRADRX_DATA_FILE', 'tradrx_data.json')


def load_data():
    """Load trading data from disk."""
    if not os.path.exists(DATA_FILE):
        return {'positions': {}, 'trades': [], 'next_id': 1}
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if 'next_id' not in data:
        data['next_id'] = len(data.get('trades', [])) + 1
    return data


def save_data(data):
    """Persist trading data to disk."""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f)
