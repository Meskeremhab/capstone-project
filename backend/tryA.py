from flask import Flask, jsonify, request, session, redirect
import requests
from sqlalchemy.pool import NullPool
import oracledb
from sqlalchemy import create_engine, text
from hashlib import sha1
import os
import logging

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

oracledb.init_oracle_client(lib_dir=r'C:\Users\Usuario\Downloads\capestone\instantclient-basic-windows.x64-21.13.0.0.0dbru\instantclient_21_13')
#print(os.environ['PATH'])


app = Flask(__name__)
app.config["SECRET_KEY"] = "this is not secret, remember, change it!"

un = 'Portfolio_user'
pw = 'Capstone12#$'
dsn = '(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1521)(host=adb.eu-madrid-1.oraclecloud.com))(connect_data=(service_name=gbe27b698b06820_stocks_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))'

pool = pool = oracledb.create_pool(user=un, password=pw,
                            dsn=dsn)


engine = create_engine("oracle+oracledb://", creator=pool.acquire, poolclass=NullPool, future=True, echo=True)

def hash_value(string):
    hash_obj = sha1()
    hash_obj.update(string.encode())
    return hash_obj.hexdigest()

api_key = "api_key"

def insert_user(user_name, password, user_id):
    hashed_password = hash_value(password)
    # Check if the user already exists
    check_user_query = text("SELECT COUNT(*) FROM USERS WHERE USER_ID = :USER_ID")
    insert_user_query = text(
        """
        INSERT INTO USERS (USER_ID, USER_NAME, PASSWORD)
        VALUES (:USER_ID, :USER_NAME, :PASSWORD)
        """
    )
    params = {'USER_ID': user_id, 'USER_NAME': user_name, 'PASSWORD': hashed_password}

    with engine.connect() as connection:
        existing_users = connection.execute(check_user_query, {'USER_ID': user_id}).scalar()
        if existing_users > 0:
            print(f"User {user_name} with ID {user_id} already exists.")
            return

        try:
            connection.execute(insert_user_query, params)
            connection.commit()
            print(f"User {user_name} with ID {user_id} inserted successfully.")
        except Exception as e:
            print(f"Error inserting user: {e}")
            connection.rollback()

def insert_portfolio_item(user_id, ticker, quantity, purchase_price):
    # Ensure user_id exists in Users table
    user_exists_query = text("SELECT COUNT(*) FROM USERS WHERE USER_ID = :USER_ID")
    
    # Check if the portfolio item already exists
    check_item_query = text(
        """
        SELECT COUNT(*) FROM PORTFOLIOITEMS 
        WHERE USER_ID = :USER_ID AND TICKER = :TICKER
        """
    )
    insert_item_query = text(
        """
        INSERT INTO PORTFOLIOITEMS (USER_ID, TICKER, QUANTITY, PURCHASE_PRICE)
        VALUES (:USER_ID, :TICKER, :QUANTITY, :PURCHASE_PRICE)
        """
    )
    
    with engine.begin() as connection:  # This ensures transactions are managed with commit or rollback
        # First, ensure the user exists
        if connection.execute(user_exists_query, {'USER_ID': user_id}).scalar() == 0:
            print(f"No such user with ID {user_id}.")
            return
        
        existing_items = connection.execute(check_item_query, {'USER_ID': user_id, 'TICKER': ticker}).scalar()
        if existing_items > 0:
            print(f"Portfolio item for {ticker} already exists for user ID {user_id}.")
            return

        try:
            connection.execute(insert_item_query, 
                               USER_ID=user_id, 
                               TICKER=ticker,
                               QUANTITY=quantity, 
                               PURCHASE_PRICE=purchase_price)
            print(f"Portfolio item {ticker} for user ID {user_id} inserted successfully.")
        except Exception as e:
            print(f"Error inserting portfolio item: {e}")






# Insert a new user
user_id = "21"  # Ensure this matches the data type and format of your USER_ID column
user_name = "mesk"
password = "1234"

insert_user(user_name, password, user_id)

# Insert portfolio items for the user
# Make sure the user_id matches an existing user in the Users table
ticker = "AAPL"
quantity = 10
purchase_price = 150.50

insert_portfolio_item(user_id, ticker, quantity, purchase_price)

ticker = "GOOGL"
quantity = 5
purchase_price = 2500.75

insert_portfolio_item(user_id, ticker, quantity, purchase_price)





if __name__ == "__main__":
    app.run(debug=True)






