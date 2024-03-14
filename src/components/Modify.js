import React, { useState } from "react";

const ModifyPortfolio = ({ userId, onActionComplete }) => {
  const [formData, setFormData] = useState({
    ticker: "",
    quantity: "",
  });

  // Add a state for selected item ID for modify/delete operations
  const [selectedItemId, setSelectedItemId] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleItemSelect = (e) => {
    setSelectedItemId(e.target.value);
  };

  const handleAction = async (actionType) => {
    const urlMap = {
      modify: "/modify_portfolio",
      create: "/create_portfolio",
      delete: "/delete_portfolio",
    };

    const methodMap = {
      modify: "POST",
      create: "POST",
      delete: "DELETE",
    };

    const bodyData =
      actionType === "create"
        ? { action: actionType, user_id: userId, ...formData }
        : {
            action: actionType,
            item_id: selectedItemId,
            user_id: userId,
            ...formData,
          };

    try {
      const response = await fetch(urlMap[actionType], {
        method: methodMap[actionType],
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.message || `HTTP error! status: ${response.status}`
        );
      }
      console.log(result);
      onActionComplete(result); // Pass the result up for any UI updates
    } catch (error) {
      console.error("Error with action:", actionType, error);
    }
  };

  return (
    <div>
      <h2>Modify Portfolio</h2>
      {/* Remove the item_id input field for create operation */}
      {/* Include it for modify/delete operations along with a way to select the item to be modified/deleted */}
      {selectedItemId && (
        <>
          <label>
            Selected Item ID:
            <select value={selectedItemId} onChange={handleItemSelect}>
              {/* Options should be dynamically generated based on user's portfolio */}
            </select>
          </label>
        </>
      )}
      <input
        name="ticker"
        value={formData.ticker}
        onChange={handleChange}
        placeholder="Ticker Symbol"
      />
      <input
        type="number"
        name="quantity"
        value={formData.quantity}
        onChange={handleChange}
        placeholder="Quantity"
      />
      {selectedItemId && (
        <>
          <button onClick={() => handleAction("modify")}>Modify</button>
          <button onClick={() => handleAction("delete")}>Delete</button>
        </>
      )}
      {!selectedItemId && (
        <button onClick={() => handleAction("create")}>Create</button>
      )}
    </div>
  );
};

export default ModifyPortfolio;
