import requests
from flask import Flask, jsonify, request, make_response, session, redirect
from flask_cors import CORS, cross_origin
import oracledb
from models import db, users, portfolioitem
from sqlalchemy.pool import NullPool
from hashlib import sha1
import logging

# Initialize the Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["https://stockstrackerbucket.storage.googleapis.com/"], allow_headers=["Content-Type"])
app.secret_key = "It_is_my_secret"
app.config["SESSION_COOKIE_SAMESITE"]='None'
app.config["SESSION_COOKIE_SECURE"]='True'
api_key = "PZNQSKBY7F4YB4E8"

un = 'Portfolio'
pw = 'Userpass12#$'
dsn = '(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1521)(host=adb.eu-madrid-1.oraclecloud.com))(connect_data=(service_name=gbe27b698b06820_stocks_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))'

pool = oracledb.create_pool(user=un, password=pw, dsn=dsn)
app.config['SQLALCHEMY_DATABASE_URI'] = 'oracle+oracledb://'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'creator': pool.acquire,
    'poolclass': NullPool
}
app.config['SQLALCHEMY_ECHO'] = True
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


db.init_app(app)
def hash_value(string):
    hash_obj = sha1()
    hash_obj.update(string.encode())
    return hash_obj.hexdigest()
# Log session data before request
@app.before_request
def log_session_data():
    logger.debug(f"Session before request: {session}")

# Log session data after request
@app.after_request
def log_session_data(response):
    logger.debug(f"Session after request: {session}")
    return response
# Add CORS headers to every response
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# Route to set a cookie
@app.route('/set-cookie')
def set_cookie():
    response = make_response("Cookie is set")
    response.set_cookie(
        'cookie_name',
        value='cookie_value',
        secure=True,
        httponly=True,
        samesite='None'
    )
    return response

# Route to handle OPTIONS requests for login
@app.route('/login', methods=["OPTIONS"])
def login_options():
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Route to handle OPTIONS requests for signup
@app.route('/signup', methods=["OPTIONS"])
def signup_options():
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

def user_info_by_id(user_id):
    try:
        user = users.query.filter_by(user_id=user_id).first()
        if user:
            user_id = user.user_id
            items = portfolioitem.query.filter_by(user_id=user_id).all()
            if items:
                portfolio_items = [{
                    "item_id": item.item_id,
                    "quantity": item.quantity,
                    "ticker": item.ticker,
                    "user_id": item.user_id
                } for item in items]
                return portfolio_items
            else:
                print(f"No portfolio items found for user {user.user_id}.")
                return []
        else:
            print(f"User not found: {user_id}")
            return []
    except Exception as e:
        print(f"Error while fetching user info by id: {str(e)}")
        return []

def generate_item_id():
    last_item = portfolioitem.query.order_by(portfolioitem.item_id.desc()).first()
    if last_item:
        last_id_num = int(last_item.item_id.replace("item", ""))
        new_id_num = last_id_num + 1
        new_item_id = f"item{new_id_num:03d}"
    else:
        new_item_id = "item001"
    return new_item_id

def get_daily_time_series(ticker):
    ticker_exists = portfolioitem.query.filter_by(ticker=ticker).first()
    if not ticker_exists:
        print(f"No data found for ticker {ticker} in the database.")
        return None

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

# Function to get the user ID from the session
def get_user_id():
    return session['user_id']

# Function to validate portfolio item data
def is_valid_portfolio_data(data):
    ticker = data.get('ticker')
    quantity = data.get('quantity')
    if not ticker or not quantity:
        return False
    if not isinstance(ticker, str):
        return False
    if not isinstance(quantity, int):
        try:
            quantity = int(quantity)
        except ValueError:
            return False
    if quantity <= 0:
        return False
    return True
def create_portfolio_item(data):
    try:
        print("hello")
        user_id = get_user_id()
        print(user_id,"here")
        if user_id is None:
            return jsonify({'error_code': 401, 'message': 'User not logged in or session expired'}), 401

        ticker = data.get("ticker").upper().strip()
        quantity = int(data.get("quantity", 0))

        if not ticker or quantity <= 0:
            return jsonify({"error_code": 400, "message": "Missing or invalid data provided."}), 400

        existing_item = portfolioitem.query.filter_by(user_id=user_id, ticker=ticker).first()
        if existing_item:
            return jsonify({"error_code": 409, "message": "Item already exists."}), 409

        item_id = generate_item_id()

        new_item = portfolioitem(
            item_id=item_id,
            user_id=user_id,
            ticker=ticker,
            quantity=quantity
        )
        db.session.add(new_item)
        db.session.commit()

        return jsonify({"error_code": 200, "message": "Portfolio item created successfully."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error_code": 500, "message": f"Error creating portfolio item: {str(e)}"}), 500

def delete_portfolio_item(data):
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error_code': 401, 'message': 'User not logged in or session expired'}), 401
        
        ticker = data.get("ticker", "").upper().strip()
        
        if not ticker:
            return jsonify({'error_code': 400, 'message': 'Ticker symbol is required.'}), 400

        item = portfolioitem.query.filter_by(user_id=user_id, ticker=ticker).first()
        if not item:
            return jsonify({'error_code': 404, 'message': 'Portfolio item not found.'}), 404

        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'error_code': 200, 'message': 'Portfolio item deleted successfully.'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error_code': 500, 'message': 'Error deleting portfolio item.'}), 500

def modify_existing(data):
    try:
        user_id = get_user_id()
        if user_id is None:
            return jsonify({'error_code': 401, 'message': 'User not logged in or session expired'}), 401

        ticker = data.get("ticker", "").upper().strip()
        quantity = data.get("quantity")

        if not ticker or quantity is None:
            return jsonify({"error_code": 400, "message": "Missing ticker or quantity"}), 400
        
        try:
            quantity = int(quantity)
            if quantity <= 0:
                raise ValueError("Quantity must be greater than 0")
        except ValueError as e:
            return jsonify({"error_code": 400, "message": str(e)}), 400

        item = portfolioitem.query.filter_by(user_id=user_id, ticker=ticker).first()
        if not item:
            print(f"No portfolio item found for user_id: {user_id}, ticker: {ticker}")
            return jsonify({"error_code": 404, "message": "Portfolio item not found."}), 404

        item.quantity = quantity
        db.session.commit()

        return jsonify({"error_code": 200, "message": "Portfolio item modified successfully."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error_code": 500, "message": f"Error modifying portfolio item: {str(e)}"}), 500

@app.route('/<user_id>', methods=['GET'])
def index(user_id):
    try:
        client_stocks = user_info_by_id(user_id)
        if client_stocks:
            item_dict = {}
            total_value = 0
            for item in client_stocks:
                stock = item["ticker"]
                url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={stock}&apikey={api_key}"
                response = requests.get(url)
                if response.status_code != 200:
                    print(f"Failed to fetch data for stock {stock}")
                    continue

                data = response.json()
               # latest_date = data["Global Quote"]["07. latest trading day"]
                latest_close_price = float(data["Global Quote"]["05. price"])

                item_dict[stock] = {
                    "quantity": item["quantity"],
                    "price": latest_close_price,
                    "total_value": round(latest_close_price * item["quantity"], 2)
                }

                total_value += item_dict[stock]["total_value"]

            for stock, value in item_dict.items():
                item_dict[stock]["weighted_value"] = round((value["total_value"] / total_value) * 100, 2)

            item_dict["portfolio_value"] = total_value

            return jsonify(item_dict)
        else:
            return jsonify({"error": "User not found or has no portfolio items."}), 404
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500

# Route to handle user login
@app.route('/login', methods=["POST"])
def login():
    user_dict = request.get_json()
    user_id = user_dict.get("user_id")
    input_password = user_dict.get("password")
    input_password_hash = hash_value(input_password)
    user = users.query.filter_by(user_id=user_id).first()
    
    if user and user.password_hash == input_password_hash:
      
        session['user_id'] = user.user_id
        
        app.logger.debug('Session data after login: %s', session)  # Log session data here
        return jsonify({"error_code": 200, "message": "Login successful"}), 200
    else:
        return jsonify({"error_code": 400, "message": "Invalid user ID or password"}), 400


# Route to handle user signup (not included in the document)
@app.route('/signup', methods=['POST'])
def signup():
    user_dict = request.get_json()
    user_id = user_dict.get("user_id")
    user_name = user_dict.get("user_name")
    input_password = user_dict.get("password")
    user_mail = user_dict.get("user_mail")
    input_password_hash = hash_value(input_password)
    existing_user = users.query.filter((users.user_id == user_id) | (users.user_mail == user_mail)).first()
    if existing_user:
        return jsonify({"error_code": 400, "message": "User ID or Email already exists"}), 400

    new_user = users(user_id=user_id, user_name=user_name, password_hash=input_password_hash, user_mail=user_mail)
    db.session.add(new_user)
    db.session.commit()
    session['user_id'] = new_user.user_id
    return jsonify({"message": "Signup successful"}), 200


# Route to handle stock details
@app.route('/stock/<ticker>', methods=["GET"])
def api_stock(ticker):
    try:
        url_weekly = f"https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol={ticker}&apikey={api_key}"
        response_weekly = requests.get(url_weekly)
        data_weekly = response_weekly.json()
        weekly_time_series = data_weekly.get("Weekly Time Series", {})
        weekly_items = list(weekly_time_series.items())[:10]
        weekly_time_series = dict(weekly_items)

        daily_time_series = get_daily_time_series(ticker)
        if daily_time_series:
            latest_date = next(iter(daily_time_series))
            latest_data = daily_time_series[latest_date]

            response = jsonify({
                "ticker": ticker,
                "weekly_time_series": weekly_time_series,
                "daily_time_series": daily_time_series,
                "latest_close_price": latest_data.get("4. close"),
                "latest_trading_day": latest_date
            })
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response
        else:
            return jsonify({"error": "Details not found for the given ticker"}), 404

    except Exception as e:
        print(str(e))
        return jsonify({"error": "Internal Server Error"}), 500

# Route to handle portfolio item creation, modification, and deletion
# Route to handle GET requests for user portfolio
@app.route('/edit_stock', methods=["OPTIONS"])
def edit_stock_options():
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response
@app.route('/edit_stock', methods=["POST", "PUT", "DELETE"])
def edit_portfolio():
    print("here ?")
    data = request.get_json()
    action = data.get("action")

    print(data)
    if request.method == "POST" or request.method == "PUT":
        if action == "create":
            return create_portfolio_item(data)
        elif action == "modify":
            return modify_existing(data)
        else:
            return jsonify({"error_code": 400, "message": "Invalid or missing action parameter."}), 400

    elif request.method == "DELETE":
        if action == "delete":
            return delete_portfolio_item(data)
        else:
            return jsonify({"error_code": 400, "message": "Invalid action for DELETE method."}), 400

    return jsonify({"error_code": 405, "message": "Method Not Allowed"}), 405

# Route to handle user logout
@app.route("/logout", methods=["POST"])
def logout():
    
    if "user_id" in session:
        session.pop("user_id")
    return jsonify({"message": "logged user out"}), 200

# Route to handle OPTIONS requests for chart
@app.route('/api/time_series', methods=["OPTIONS"])
def chart_options():
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Route to handle POST requests for chart


if __name__ == "__main__":
    app.run(debug=True)
