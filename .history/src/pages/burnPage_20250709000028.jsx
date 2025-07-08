import React from "react";
import WatchlistHeader from "@components/WatchlistHeader";
import WatchlistChart from "@components/WatchlistChart";
import TimeframeSelector from "@components/TimeframeSelector";
import TickerTable from "@components/TickerTable";

const BurnPage = () => {
  return (
    <div style={{ backgroundColor: "#000000", minHeight: "100vh", color: "#ffffff" }}>
      <WatchlistHeader />
      <WatchlistChart />
      <TimeframeSelector />
      <TickerTable />
    </div>
  );
};

export default BurnPage;