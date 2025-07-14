import argparse
import json
import os
from urllib.parse import urljoin

import requests

DEFAULT_API_URL = 'http://localhost:5000'
API_URL = os.environ.get('API_URL', DEFAULT_API_URL)


def place_trade(symbol, action, quantity, price):
    data = {
        'symbol': symbol,
        'action': action,
        'quantity': quantity,
        'price': price
    }
    r = requests.post(urljoin(API_URL, '/trade'), json=data)
    return r.json()


def show_positions():
    r = requests.get(urljoin(API_URL, '/positions'))
    return r.json()


def show_trades():
    r = requests.get(urljoin(API_URL, '/trades'))
    return r.json()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='TradrXBridge CLI')
    parser.add_argument('--api', default=API_URL, help='API base URL')
    subparsers = parser.add_subparsers(dest='command')

    trade_parser = subparsers.add_parser('trade')
    trade_parser.add_argument('symbol')
    trade_parser.add_argument('action', choices=['buy', 'sell'])
    trade_parser.add_argument('quantity', type=float)
    trade_parser.add_argument('price', type=float)

    subparsers.add_parser('positions')
    subparsers.add_parser('trades')

    args = parser.parse_args()

    API_URL = args.api

    if args.command == 'trade':
        resp = place_trade(args.symbol, args.action, args.quantity, args.price)
        print(json.dumps(resp, indent=2))
    elif args.command == 'positions':
        print(json.dumps(show_positions(), indent=2))
    elif args.command == 'trades':
        print(json.dumps(show_trades(), indent=2))
    else:
        parser.print_help()
