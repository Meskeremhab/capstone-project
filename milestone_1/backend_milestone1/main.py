from flask import Flask, jsonify
import json
import requests

app = Flask(__name__)

# Load the user data from the JSON file
with open('stock.json') as file:
    user_data = json.load(file)

api_key = "KABTICZOTHQMZ7GP"


    
def get_daily_time_series(ticker):
    try:
        url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={ticker}&apikey={api_key}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        time_series = data.get("Time Series (Daily)", {})
        return time_series
    except requests.exceptions.RequestException as e:
        print(f"Request for ticker {ticker} failed: {e}")
    
        return None
@app.route('/')
def index():
    response = "Welcome to the API!", 200
    response.headers.add("Access-Control-Allow-Origin", "*")  # Add CORS header here
    return response

    
@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    try:
        with open('stock.json') as file:
            stocks_data = json.load(file)
            response = jsonify(stocks_data)
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response
    except FileNotFoundError:
        return jsonify({"error": "Stock data file not found."}), 404

    
@app.route('/api/portfolios', methods=['GET'])
def api_portfolios():
    total_value = 0
    for portfolio in user_data.get('portfolios', []):
        for item in portfolio['items']:
            time_series = get_daily_time_series(item['ticker'])
            if time_series:
                latest_date = next(iter(time_series))
                latest_close_price = float(time_series[latest_date]["4. close"])
                total_value += item['quantity'] * latest_close_price
    response = jsonify({"total_portfolio_value": total_value})
    response.headers.add("Access-Control-Allow-Origin", "*")  # Add CORS header here
    return response

@app.route('/api/stock/<ticker>', methods=['GET'])
def api_stock(ticker):
    time_series = get_daily_time_series(ticker)
    if time_series:
        latest_date = next(iter(time_series))
        latest_data = time_series[latest_date]
        response = jsonify({
            "ticker": ticker,
            "latest_close_price": latest_data["4. close"],
            "time_series_daily": time_series
        })
        response.headers.add("Access-Control-Allow-Origin", "*")  # Add CORS header here
        return response
    else:
        response = jsonify({"error": "Details not found for the given ticker"})
        response.headers.add("Access-Control-Allow-Origin", "*")  # Add CORS header here
        return response, 404

if __name__ == '__main__':
    app.run(debug=True)
