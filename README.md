# TradrXBridge

A minimal demo trading application.

## Requirements

- Python 3
- Flask
- Requests

Install dependencies:

```bash
pip install Flask requests
```

## Running the server

```bash
flask run -p 5001 --app tradrxbridge.app
```

## Using the CLI

In a separate terminal, you can place trades or view positions:

```bash
python tradrxbridge/cli.py --api http://localhost:5001 trade BTC buy 1 30000
python tradrxbridge/cli.py --api http://localhost:5001 positions
python tradrxbridge/cli.py --api http://localhost:5001 trades
```
