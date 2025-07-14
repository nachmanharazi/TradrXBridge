# TradrXBridge

A minimal demo trading application with simple persistent storage.

## Requirements

- Python 3
- Flask
- Requests

Install dependencies:

```bash
pip install Flask requests
```

By default, data is saved to `tradrx_data.json` in the current
directory. You can set the `TRADRX_DATA_FILE` environment variable to
change the storage path.

## Running the server

```bash
flask run -p 5001 --app tradrxbridge.app
```

Trades and positions will persist between restarts using the JSON file
described above.

Each trade receives an auto-incrementing ID and timestamp. You can
retrieve or cancel a trade by ID using the CLI.

## Using the CLI

In a separate terminal, you can place trades or view positions:

The CLI uses the `API_URL` environment variable to locate the server.
You can also override it with the `--api` flag.

```bash
python tradrxbridge/cli.py --api http://localhost:5001 trade BTC buy 1 30000
python tradrxbridge/cli.py --api http://localhost:5001 positions
python tradrxbridge/cli.py --api http://localhost:5001 trades
python tradrxbridge/cli.py --api http://localhost:5001 trade-info 1
python tradrxbridge/cli.py --api http://localhost:5001 cancel 1
```
