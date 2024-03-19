import React, { useState, useEffect } from "react";

const Ticker = ({ ticker }) => {
  const [tickerData, setTickerData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        const response = await fetch(`https://mcsbt-integration-416321.uc.r.appspot.com/stock/${ticker}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch info for ticker: ${ticker}`);
        }
        const data = await response.json();
        setTickerData(data);
      } catch (err) {
        setError(err.message);
      }
    };

    if (ticker) {
      fetchTickerData();
    }
  }, [ticker]);

  const transformTimeSeriesData = (timeSeriesData) => {
    return Object.entries(timeSeriesData).map(([date, values]) => ({
      date,
      open: values["1. open"],
      high: values["2. high"],
      low: values["3. low"],
      close: values["4. close"],
      volume: values["5. volume"],
    }));
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {tickerData && (
        <div>
          <h1>Ticker: {ticker}</h1>
          {tickerData.daily_time_series && (
            <div>
              <h2>Stock Details</h2>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Close</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {transformTimeSeriesData(tickerData.daily_time_series).map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.date}</td>
                      <td>{entry.open}</td>
                      <td>{entry.high}</td>
                      <td>{entry.low}</td>
                      <td>{entry.close}</td>
                      <td>{entry.volume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Ticker;
