import React, { useState, useEffect, useRef } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import "./App.css";

function App() {
  const [checked, setChecked] = useState(new Array(1000000).fill(0));
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const itemCount = 1000000;
  const itemSize = 30;
  const wsRef = useRef(null);
  const [itemsChecked, setItemsChecked] = useState(0);

  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight * 0.8,
      });
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    function connectWebSocket() {
      wsRef.current = new WebSocket("ws://localhost:4000/ws");

      wsRef.current.onopen = () => {
        console.log("WebSocket connection established");
      };

      wsRef.current.onmessage = (event) => {
        const updatedArray = JSON.parse(event.data).flagArray;
        setChecked(updatedArray);
        setItemsChecked(JSON.parse(event.data).itemsChecked);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket connection closed, attempting to reconnect...");
        setTimeout(connectWebSocket, 1000); // Attempt to reconnect after 1 second
      };
    }

    connectWebSocket();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index =
      rowIndex * Math.floor(dimensions.width / itemSize) + columnIndex;
    if (index >= itemCount) return null;
    return (
      <div style={style}>
        <input
          type="checkbox"
          id={`checkbox-${index}`}
          style={{ margin: 0, padding: 0, width: 30, height: 30 }}
          checked={checked[index] === 1}
          disabled={checked[index] === 1}
          onChange={() => {
            // Send the updated index to the backend
            if (
              wsRef.current &&
              wsRef.current.readyState === WebSocket.OPEN &&
              checked[index] === 0
            ) {
              wsRef.current.send(index.toString());
            }
          }}
        />
      </div>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>1 Million Checkboxes</h1>
        <p>Items Checked: {itemsChecked}</p>
        <div style={{ height: "80vh", width: "100%", margin: "auto" }}>
          <AutoSizer>
            {({ width, height }) => (
              <Grid
                columnCount={Math.floor(width / itemSize)}
                columnWidth={itemSize}
                height={height}
                rowCount={Math.ceil(itemCount / Math.floor(width / itemSize))}
                rowHeight={itemSize}
                width={width}
              >
                {Cell}
              </Grid>
            )}
          </AutoSizer>
        </div>
      </header>
    </div>
  );
}

export default App;
