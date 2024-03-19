import React, { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';

const Modify = ({ userId, onActionComplete }) => {
  const [actionType, setActionType] = useState('');
  const [formData, setFormData] = useState({
    ticker: '',
    quantity: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAction = async (e) => {
    e.preventDefault();
    const url = 'https://mcsbt-integration-416321.uc.r.appspot.com/edit_stock';
    let options = {
      method: actionType === 'delete' ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Necessary to include cookies with the request
    };
  
    // Add body only for POST and DELETE requests
    if (actionType !== 'delete') {
      options = { ...options, body: JSON.stringify({ ...formData, action: actionType, user_id: userId })
    };
    } else {
      options = { ...options, body: JSON.stringify({ action: actionType, ticker: formData.ticker, user_id: userId }) };
    }
  
    try {
      console.log("frontend")
      const response = await fetch(url, options);
      console.log(response.data)
  
      // Handle non-OK responses
      if (!response.ok) {
        let errorText = `Request failed with status ${response.status}`;
        if (response.headers.get('Content-Type')?.includes('application/json')) {
          const errorData = await response.json();
          errorText = errorData.message || errorText;
        }
        throw new Error(errorText);
      }
  
      // Process response for POST actions
      if (actionType !== 'delete') {
        const result = await response.json();
        onActionComplete(result);
      } else {
        // Assume delete was successful without needing to parse JSON
  onActionComplete();
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

     

  return (
    <div>
      <Form onSubmit={handleAction}>
        <h2>Edit Stock</h2>
        {/* Action Type Select */}
        <Form.Group>
          <Form.Label>Action Type</Form.Label>
          <Form.Control
            as="select"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            required
          >
            <option value="">Select Action</option>
            <option value="create">Create New Stock</option>
            <option value="modify">Modify Existing Stock</option>
            <option value="delete">Delete Stock</option>
          </Form.Control>
        </Form.Group>

        {/* Ticker Input */}
        <Form.Group>
          <Form.Label>Ticker Symbol</Form.Label>
          <Form.Control
            type="text"
            name="ticker"
            value={formData.ticker}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Quantity Input */}
        {actionType !== 'delete' && (
          <Form.Group>
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </Form.Group>
        )}

        <Button type="submit" variant="primary">
          {actionType.charAt(0).toUpperCase() + actionType.slice(1)} Stock
        </Button>
      </Form>
      {errorMessage && <Alert variant="danger" className="mt-3">{errorMessage}</Alert>}
    </div>
  );
};

export default Modify;
