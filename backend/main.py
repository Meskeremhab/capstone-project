import requests
from flask import Flask, jsonify, request, make_response, session , redirect
from flask_cors import CORS, cross_origin
import oracledb
from models import db, users, portfolioitem
from sqlalchemy.pool import NullPool
from hashlib import sha1

app = Flask(__name__)
CORS(app)
#CORS(app, supports_credentials=True) 
#(this way is not working for me so i configured for each route manually, i used the code from chatgpt)
app.secret_key = "It_is_my_secret"
api_key = "PZNQSKBY7F4YB4E8"

un = 'Portfolio'
pw = 'Userpass12#$'
dsn = '(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1521)(host=adb.eu-madrid-1.oraclecloud.com))(connect_data=(service_name=gbe27b698b06820_stocks_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))'

pool = oracledb.create_pool(user=un, password=pw,
                            dsn=dsn)

app.config['SQLALCHEMY_DATABASE_URI'] = 'oracle+oracledb://'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'creator': pool.acquire,
    'poolclass': NullPool
}
app.config['SQLALCHEMY_ECHO'] = True
db.init_app(app)

def hash_value(string):
    hash_obj = sha1()
    hash_obj.update(string.encode())
    return hash_obj.hexdigest()
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response
@app.route('/login', methods=["OPTIONS"])
def login_options():
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:3000')
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response
@app.route('/signup', methods=["OPTIONS"])
def signup_options():
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:3000')
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.route('/edit_stock', methods=["OPTIONS"])
def edit_portfolio_options():
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:3000')
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response
def user_info_by_id(user_id):
    try:
        user = users.query.filter_by(user_id=user_id).first()       
        if user:
            
            user_id= user.user_id            
            # Retrieve portfolio items associated with the user_id
            items = portfolioitem.query.filter_by(user_id=user_id).all()           
            # Check if items were found
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
    # a function an item id when ever new item is added
    last_item = portfolioitem.query.order_by(portfolioitem.item_id.desc()).first()
    if last_item:
        last_id_num = int(last_item.item_id.replace("item", ""))
        new_id_num = last_id_num + 1
        new_item_id = f"item{new_id_num:03d}"  
    else:
        new_item_id = "item001"
    return new_item_id

def get_daily_time_series(ticker):
        # Check if the ticker exists in the database
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
    
def get_user_id():
    return session.get('user_id')

def is_valid_portfolio_data(data):
    ticker = data.get('ticker')
    quantity = data.get('quantity')
    if not ticker or not quantity:
        return False
    if not isinstance(ticker, str):
        return False
    if not isinstance(quantity, int):  # Check if quantity is an integer
        try:
            quantity = int(quantity)  # Convert quantity to an integer if it's not
        except ValueError:
            return False
    if quantity <= 0:
        return False
    return True

def create_portfolio_item(data):
    try:
        user_id = get_user_id()
        if user_id is None:
            return jsonify({'error_code': 401, 'message': 'User not logged in or session expired'}), 401

        ticker = data.get("ticker").upper().strip()
        quantity = int(data.get("quantity", 0))

        if not ticker or quantity <= 0:
            return jsonify({"error_code": 400, "message": "Missing or invalid data provided."}), 400

        # Check if the portfolio item already exists
        existing_item = portfolioitem.query.filter_by(user_id=user_id, ticker=ticker).first()
        if existing_item:
            return jsonify({"error_code": 409, "message": "Item already exists."}), 409

        # Generate a unique item_id
        item_id = generate_item_id()

        # Create a new portfolio item
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
        # Ensure we're using the correct function to retrieve the user ID
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error_code': 401, 'message': 'User not logged in or session expired'}), 401
        
        ticker = data.get("ticker", "").upper().strip()
        
        # Ensure the ticker is provided
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

        # Ensure both 'ticker' and 'quantity' are provided in the request.
        ticker = data.get("ticker", "").upper().strip()
        quantity = data.get("quantity")

        # Validate 'ticker' and 'quantity'
        if not ticker or quantity is None:
            return jsonify({"error_code": 400, "message": "Missing ticker or quantity"}), 400
        
        # Ensure 'quantity' is an integer and greater than 0
        try:
            quantity = int(quantity)
            if quantity <= 0:
                raise ValueError("Quantity must be greater than 0")
        except ValueError as e:
            return jsonify({"error_code": 400, "message": str(e)}), 400

        # Find the portfolio item to modify
        item = portfolioitem.query.filter_by(user_id=user_id, ticker=ticker).first()
        if not item:
            return jsonify({"error_code": 404, "message": "Portfolio item not found."}), 404

        # Modify the item's quantity
        item.quantity = quantity
        db.session.commit()

        return jsonify({"error_code": 200, "message": "Portfolio item modified successfully."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error_code": 500, "message": f"Error modifying portfolio item: {str(e)}"}), 500

@app.route('/<user_id>', methods=['GET'])
def index(user_id):
    try:
        # Fetch portfolio items for the given user_name
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
                latest_date = data["Global Quote"]["07. latest trading day"]
                latest_close_price = float(data["Global Quote"]["05. price"])

                item_dict[stock] = {
                    "item_id": item["item_id"],
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

@app.route('/login', methods=["POST"])
def login():
    user_dict = request.get_json()

    user_id = user_dict.get("user_id")
    input_password = user_dict.get("password")

    # Hash the password
    input_password_hash = hash_value(input_password)

    # Query database to find user by user_id and check password
    user = users.query.filter_by(user_id=user_id).first()
    if user and user.password_hash == input_password_hash:
        # Login success
        session['user_id'] = user_id
        return jsonify({"error_code": 200, "message": "Login successful"}), 200
    else:
        # Login failed
        return jsonify({"error_code": 400, "message": "Invalid user ID or password"}), 400
@app.route('/signup', methods=['POST'])
def signup():
    user_dict = request.get_json()

    user_id = user_dict.get("user_id")
    user_name = user_dict.get("user_name")
    input_password = user_dict.get("password")
    user_mail = user_dict.get("user_mail")

    # Hash the password
    input_password_hash = hash_value(input_password)

    # Check if user ID or email already exists
    existing_user = users.query.filter((users.user_id == user_id) | (users.user_mail == user_mail)).first()
    if existing_user:
        return jsonify({"error_code": 400, "message": "User ID or Email already exists"}), 400

    # Insert new user into the database
    new_user = users(user_id=user_id, user_name=user_name, password_hash=input_password_hash, user_mail=user_mail)
    db.session.add(new_user)
    db.session.commit()

    # Start session or return success
    session['user_id'] = user_id
    return jsonify({"error_code": 200, "message": "Signup successful"}), 200
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

@app.route('/edit_stock', methods=["POST", "PUT", "DELETE"])
def edit_portfolio():
    if 'user_id' not in session:
        return jsonify({"error_code": 401, "message": "Unauthorized"}), 401

    data = request.get_json()
    action = data.get("action")

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
@app.route("/logout", methods=["POST"])
def logout():
    if "user_id" in session:
        session.pop("user_id")

    return jsonify({"message": "logged user out"}), 200

if __name__ == "__main__":
    app.run(debug=True)