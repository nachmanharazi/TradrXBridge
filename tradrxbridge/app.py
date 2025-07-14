from flask import Flask, request, jsonify
from datetime import datetime
from . import storage

app = Flask(__name__)

# Persistent storage for trades and positions
data = storage.load_data()
positions = data.get('positions', {})
trades = data.get('trades', [])
next_id = data.get('next_id', len(trades) + 1)


@app.route('/trade', methods=['POST'])
def trade():
    global next_id
    data = request.get_json()
    symbol = data.get('symbol')
    action = data.get('action')  # 'buy' or 'sell'
    qty = data.get('quantity', 0)
    price = data.get('price', 0)

    if not symbol or action not in {'buy', 'sell'}:
        return jsonify({'error': 'Invalid trade data'}), 400

    trade = {
        'id': next_id,
        'symbol': symbol,
        'action': action,
        'quantity': qty,
        'price': price,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    next_id += 1
    trades.append(trade)

    if action == 'buy':
        positions[symbol] = positions.get(symbol, 0) + qty
    else:
        positions[symbol] = positions.get(symbol, 0) - qty

    storage.save_data({
        'positions': positions,
        'trades': trades,
        'next_id': next_id,
    })

    return jsonify({'status': 'success', 'trade': trade})


@app.route('/positions', methods=['GET'])
def get_positions():
    return jsonify(positions)


@app.route('/trades', methods=['GET'])
def get_trades():
    return jsonify(trades)


@app.route('/trades/<int:trade_id>', methods=['GET'])
def get_trade(trade_id):
    for trade in trades:
        if trade.get('id') == trade_id:
            return jsonify(trade)
    return jsonify({'error': 'Trade not found'}), 404


@app.route('/trades/<int:trade_id>', methods=['DELETE'])
def delete_trade(trade_id):
    for i, trade in enumerate(trades):
        if trade.get('id') == trade_id:
            # Reverse trade from positions
            qty = trade['quantity']
            if trade['action'] == 'buy':
                positions[trade['symbol']] = (
                    positions.get(trade['symbol'], 0) - qty
                )
            else:
                positions[trade['symbol']] = (
                    positions.get(trade['symbol'], 0) + qty
                )
            trades.pop(i)
            storage.save_data({
                'positions': positions,
                'trades': trades,
                'next_id': next_id,
            })
            return jsonify({'status': 'deleted'})
    return jsonify({'error': 'Trade not found'}), 404


if __name__ == '__main__':
    app.run(debug=True)
