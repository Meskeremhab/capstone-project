import React from 'react';
import { Line } from 'react-chartjs-2';
// Removed duplicate imports and unused Chart import

const transformDataForChart = (data) => {
  const labels = [];
  const openData = [];

  data && data.map(item => {
    item.items.map(details => {
      Object.entries(details.details.daily_time_series["Time Series (Daily)"]).forEach(([date, values]) => {
        labels.push(date);
        openData.push(parseFloat(values["1. open"]));
      });
    });
  });

  return {
    labels,
    datasets: [{
      label: 'Stock Open Prices',
      data: openData,
      fill: false,
      borderColor: 'rgba(75,192,192,1)',
    }],
  };
};

const ChartComponent = ({ data }) => {
  const chartData = transformDataForChart(data);

  return (
    <div>
      {data && (
        <Line data={chartData} />
      )}
    </div>
  );
};

export default ChartComponent;
