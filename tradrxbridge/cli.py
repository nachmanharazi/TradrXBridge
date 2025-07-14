import argparse
import json
import os

import requests


def _make_url(path: str) -> str:
    """Join API_URL with path without losing any base prefix."""
    return f"{API_URL.rstrip('/')}/{path.lstrip('/')}"


def _request_json(method: str, path: str, **kwargs):
    """Send an HTTP request and return the parsed JSON response."""
    resp = requests.request(method, _make_url(path), **kwargs)
    try:
        resp.raise_for_status()
    except requests.HTTPError as exc:
        raise SystemExit(f"Request failed: {exc}") from exc
    try:
        return resp.json()
    except requests.JSONDecodeError as exc:
        raise SystemExit(
            f"Invalid JSON response from server: {resp.text!r}"
        ) from exc


DEFAULT_API_URL = 'http://localhost:5001'
# The API URL can also be set via the API_URL environment variable
API_URL = os.environ.get('API_URL', DEFAULT_API_URL)


def place_trade(symbol, action, quantity, price):
    data = {
        'symbol': symbol,
        'action': action,
        'quantity': quantity,
        'price': price
    }
    return _request_json('post', '/trade', json=data)


def show_positions():
    return _request_json('get', '/positions')


def show_trades():
    return _request_json('get', '/trades')


def trade_info(trade_id):
    return _request_json('get', f'/trades/{trade_id}')


def cancel_trade(trade_id):
    return _request_json('delete', f'/trades/{trade_id}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description=(
            'TradrXBridge CLI. Overrides API_URL environment variable '
            'if --api is provided.'
        )
    )
    parser.add_argument('--api', default=API_URL, help='API base URL')
    subparsers = parser.add_subparsers(dest='command')

    trade_parser = subparsers.add_parser('trade')
    trade_parser.add_argument('symbol')
    trade_parser.add_argument('action', choices=['buy', 'sell'])
    trade_parser.add_argument('quantity', type=float)
    trade_parser.add_argument('price', type=float)

    subparsers.add_parser('positions')
    subparsers.add_parser('trades')
    trade_info_parser = subparsers.add_parser('trade-info')
    trade_info_parser.add_argument('id', type=int)
    cancel_parser = subparsers.add_parser('cancel')
    cancel_parser.add_argument('id', type=int)

    args = parser.parse_args()

    API_URL = args.api

    if args.command == 'trade':
        resp = place_trade(args.symbol, args.action, args.quantity, args.price)
        print(json.dumps(resp, indent=2))
    elif args.command == 'positions':
        print(json.dumps(show_positions(), indent=2))
    elif args.command == 'trades':
        print(json.dumps(show_trades(), indent=2))
    elif args.command == 'trade-info':
        print(json.dumps(trade_info(args.id), indent=2))
    elif args.command == 'cancel':
        print(json.dumps(cancel_trade(args.id), indent=2))
    else:
        parser.print_help()
