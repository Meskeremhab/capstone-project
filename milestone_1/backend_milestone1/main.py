import requests
from flask import Flask, jsonify, request, make_response, session , redirect
from flask_cors import CORS, cross_origin
import oracledb
from models import db, users, portfolioitem
from sqlalchemy.pool import NullPool
from hashlib import sha1

app = Flask(__name__)
CORS(app)
app.secret_key = "VFVETDZPXW4IOBLDKK"

def hash_value(string):
    hash_obj = sha1()
    hash_obj.update(string.encode())
    return hash_obj.hexdigest()

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


def user_info_by_name(user_name):
    try:
        # First, find the user by user_name to get the user_id
        user = users.query.filter_by(user_name=user_name).first()

        print("")
        print("")
        print(dir(user))
        print("")
        print("")

        
        if user:
            # Get user_id
            user_id = user.user_id
            
            # Retrieve portfolio items associated with the user_id
            items = portfolioitem.query.filter_by(user_id=user_id).all()
            
            # Check if items were found
            if items:
                # Preparing the portfolio items as a list of dictionaries
                portfolio_items = [{
                    "item_id": item.item_id,
                    "quantity": item.quantity,
                    "ticker": item.ticker,
                    "user_id": item.user_id
                } for item in items]
                
                return portfolio_items
            else:
                print(f"No portfolio items found for user {user.user_name}.")
                return []
        else:
            print(f"User not found: {user_name}")
            return []
    except Exception as e:
        print(f"Error while fetching user info by name: {str(e)}")
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

def items_info(data):

    try:
        with app.app_context():
        # Try to find an existing record
            users_response = portfolioitem.query.filter_by(
                                        item=data["stock_id"],
                                        user_id=data["user_id"],
                                        ).first()

        if users_response and users_response.item_id:
            if data["stock_id"] == users_response.item_id:
                response_dict = {
                    "stock_id": users_response.item_id,
                    "ticker": users_response.ticker,
                    "user_id":users_response.user_id,
                    "quantity":users_response.quantity,
                    "action":data["action"]
                }
                return response_dict
            else:
                raise Exception(f"Error in the modify the stock, error_code: {users_response.status_code}")  
        else:
            raise Exception("Stock doenst found in DB")
    
    except Exception as e:
        print("Error:", str(e))
    
    return []

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
    
    
def modify_existing(data):
        try:
            # Ensure that action is 'modify'
            if data.get("action") != "modify":
                return {"error_code": 400, "message": "Invalid action. Must be 'modify'."}

            # Extract necessary data from the input
            item_id = data.get("item_id")
            user_id = data.get("user_id")
            ticker = data.get("ticker")
            quantity = data.get("quantity")

            # Check if all required data is provided
            if not all([item_id, user_id, ticker, quantity]):
                return {"error_code": 400, "message": "Incomplete data provided."}

            # Retrieve the item to be modified
            item = portfolioitem.query.filter_by(item_id=item_id, user_id=user_id).first()

            # If item is found, update its quantity and commit the changes
            if item:
                item.quantity = int(quantity)
                db.session.commit()
                return {"error_code": 200, "message": f"Portfolio item with ID {item_id} updated successfully."}
            else:
                return {"error_code": 404, "message": f"No portfolio item found with ID {item_id}"}

        except Exception as e:
            db.session.rollback()
            print({"error": str(e)})
            return {"error_code": 500, "message": "Internal Server Error"}
        
       
def create_portfolio_item(data):
    try:
        user_id = data.get("user_id")
        if not user_id:
            return {"error_code": 400, "message": "No user_id provided."}

        # Check if user exists
        user_exists = users.query.filter_by(user_id=user_id).first()
        if not user_exists:
            return {"error_code": 404, "message": f"No such user with ID {user_id}."}

        action = data.get("action")
        if action != "create":
            return {"error_code": 400, "message": "Invalid action. Must be 'create'."}

        ticker = data.get("ticker")
        if not ticker:
            return {"error_code": 400, "message": "No ticker provided."}

        # Check if portfolio item already exists
        existing_item = portfolioitem.query.filter_by(user_id=user_id, ticker=ticker.upper().strip()).first()
        if existing_item:
            return {"error_code": 409, "message": f"Portfolio item for {ticker} already exists for user ID {user_id}."}

        quantity = int(data.get("quantity", 0))  # default to 0 if quantity is not provided

        # Generate unique item ID
        item_id = generate_item_id()

        # Create new portfolio item
        new_item = portfolioitem(
            item_id=item_id,
            user_id=user_id,
            ticker=ticker.upper().strip(),
            quantity=quantity
        )

        # Add new item to session and commit changes
        db.session.add(new_item)
        db.session.commit()

        return {"error_code": 200, "message": f"Portfolio item {ticker} for user ID {user_id} inserted successfully."}

    except Exception as e:
        db.session.rollback()  # Rollback changes in case of error
        return {"error_code": 500, "message": f"Error creating portfolio item: {str(e)}"}
                
                
def delete_portfolio_item(data):
    try:
        # Extract necessary data from the input
        item_id = data.get("item_id")
        user_id = data.get("user_id")
        ticker = data.get("ticker")
        quantity = data.get("quantity")

        # Check if all required data is provided
        if not all([item_id, user_id, ticker, quantity]):
            return {"error_code": 400, "message": "Incomplete data provided."}

        # Retrieve the item to be deleted
        item = portfolioitem.query.filter_by(
            item_id=item_id,
            user_id=user_id,
            ticker=ticker,
            quantity=int(quantity)
        ).first()

        # If item is found, delete it and commit the changes
        if item:
            db.session.delete(item)
            db.session.commit()
            return {"error_code": 200, "message": f"Portfolio item with ID {item_id} deleted successfully."}
        else:
            return {"error_code": 404, "message": f"No portfolio item found with ID {item_id}."}

    except Exception as e:
        print(f"Error: {str(e)}")
        return {"error_code": 500, "message": "Internal Server Error"}

#routes used for display

@app.route('/<user_name>', methods=['GET'])
@cross_origin()
def index(user_name):
    try:
        # Fetch portfolio items for the given user_name
        client_stocks = user_info_by_name(user_name)
        
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
                    "latest_close_price": latest_close_price,
                    "latest_trading_day": latest_date,
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

    
@app.route('/modify_portfolio', methods=["POST"])
@cross_origin()
def modify_portfolio():
    data = request.get_json()
    if data and "action" in data:
        if data["action"] != "modify":
            return jsonify({"error_code": 400, "message": "Invalid action. Must be 'modify'."})
        response = modify_existing(data)
        return jsonify(response)
    else:
        return jsonify({"error_code": 400, "message": "Empty data or invalid action."})

@app.route('/create_portfolio', methods=["POST"])
@cross_origin()
def create_portfolio():
    data = request.get_json()
    if data and "action" in data:
        if data["action"] != "create":
            return jsonify({"error_code": 400, "message": "Invalid action. Must be 'create'."}), 400
        response = create_portfolio_item(data)
        return jsonify(response), response["error_code"]
    else:
        return jsonify({"error_code": 400, "message": "Empty data or invalid action."}), 400


@app.route('/delete_portfolio', methods=["DELETE"])
@cross_origin()
def delete_portfolio():
    data = request.get_json()
    if data and "action" in data:
        if data["action"] != "delete":
            return jsonify({"error_code": 400, "message": "Invalid action. Must be 'delete'."})
        response = delete_portfolio_item(data)
        return jsonify(response)
    else:
        return jsonify({"error_code": 400, "message": "Empty data or invalid action."})


@app.route('/login', methods=["POST", "OPTIONS"])
@cross_origin()
def login():
    user_dict = request.get_json()

    user_name = user_dict.get("user_name")
    input_password = user_dict.get("password")

    # Hash the password
    input_password_hash = hash_value(input_password)

    # Query database to find user and check password
    user = users.query.filter_by(user_name=user_name).first()
    if user and user.password_hash == input_password_hash:
        return jsonify({"error_code": 200, "message": "Login successful"}), 200
    else:
        return jsonify({"error_code": 400, "message": "Invalid username or password"}), 400



if __name__ == "__main__":
    app.run(debug=True)