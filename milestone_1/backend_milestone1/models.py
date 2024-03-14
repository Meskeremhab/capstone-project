from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Sequence
from sqlalchemy.schema import Identity
from sqlalchemy.orm import relationship

db = SQLAlchemy()

class users(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.String(255), primary_key=True)
    user_name = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    user_mail = db.Column(db.String(255), nullable=False)

    #Relationship to link users to portfolio items
    items = relationship('portfolioitem', backref='users', lazy=True)
    
    def dict(self):
        return {
            'user_id': self.user_id,
            'user_name': self.user_name,
            'password_hash': self.password_hash,
            'user_mail': self.user_mail
            
        }


class portfolioitem(db.Model):
    __tablename__ = 'portfolioitem'
    item_id = db.Column(db.String(255), primary_key=True)
    user_id = db.Column(db.String(255), db.ForeignKey('users.user_id'), nullable=False)
    ticker = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    #user = relationship('Users', backref='user')
   

    def dict(self):
        return {
            'item_id': self.item_id,
            'user_id': self.user_id,
            'ticker': self.ticker,
            'quantity': self.quantity,
            
        }

