from flask import Flask, request, jsonify

app = Flask(__name__)

# In-memory storage for trades and positions
positions = {}
trades = []

@app.route('/trade', methods=['POST'])
def trade():
    data = request.get_json()
    symbol = data.get('symbol')
    action = data.get('action')  # 'buy' or 'sell'
    qty = data.get('quantity', 0)
    price = data.get('price', 0)

    if not symbol or action not in {'buy', 'sell'}:
        return jsonify({'error': 'Invalid trade data'}), 400

    trade = {
        'symbol': symbol,
        'action': action,
        'quantity': qty,
        'price': price
    }
    trades.append(trade)

    if action == 'buy':
        positions[symbol] = positions.get(symbol, 0) + qty
    else:
        positions[symbol] = positions.get(symbol, 0) - qty

    return jsonify({'status': 'success', 'trade': trade})

@app.route('/positions', methods=['GET'])
def get_positions():
    return jsonify(positions)

@app.route('/trades', methods=['GET'])
def get_trades():
    return jsonify(trades)

if __name__ == '__main__':
    app.run(debug=True)
