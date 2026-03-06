import React, { useEffect, useState } from "react";

const BLeaderboard = () => {
  const [boards, setBoards] = useState([]);
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  const DEL_KEY = user ? `deletedBidCrops_${user.id}` : null;

  const loadLeaderboard = () => {
    if (!user?.id) return;

    const deleted =
      JSON.parse(localStorage.getItem(DEL_KEY)) || [];

    const allCrops =
      JSON.parse(localStorage.getItem("allCrops")) || [];

    // only crops where buyer placed a bid AND not deleted
    const myCrops = allCrops.filter(
      (c) =>
        !deleted.includes(c.id) &&
        c.bidders?.some((b) => b.userId === user.id)
    );

    const data = myCrops.map((crop) => {
      const bidders = [...(crop.bidders || [])].sort(
        (a, b) => b.price - a.price
      );

      const myIndex = bidders.findIndex(
        (b) => b.userId === user.id
      );

      const ended = Date.now() >= crop.auctionEndTime;
      const status =
        ended && myIndex !== 0 ? "Lost" : ended ? "Won" : "Running";

      return { crop, bidders, myStatus: status };
    });

    setBoards(data);
  };

  useEffect(() => {
    loadLeaderboard();
    window.addEventListener("cropsUpdated", loadLeaderboard);
    return () =>
      window.removeEventListener("cropsUpdated", loadLeaderboard);
  }, []);

  /* 🗑️ DELETE LOST BID (VISIBILITY ONLY) */
  const deleteLostBid = (cropId) => {
    const deleted =
      JSON.parse(localStorage.getItem(DEL_KEY)) || [];

    if (!deleted.includes(cropId)) {
      localStorage.setItem(
        DEL_KEY,
        JSON.stringify([...deleted, cropId])
      );
    }

    window.dispatchEvent(new Event("cropsUpdated"));
  };

  if (boards.length === 0) {
    return <p style={{ padding: 20 }}>No bids placed yet.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Leaderboards</h2>

      {boards.map(({ crop, bidders, myStatus }) => {
        const ended = Date.now() >= crop.auctionEndTime;

        return (
          <div
            key={crop.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "25px",
              position: "relative",
            }}
          >
            {/* 🗑️ DELETE BUTTON (ONLY IF LOST) */}
            {ended && myStatus === "Lost" && (
              <button
                onClick={() => deleteLostBid(crop.id)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
                title="Remove"
              >
                🗑️
              </button>
            )}

            <h3>{crop.name}</h3>
            <p>
              Status:{" "}
              <strong>{ended ? "Ended" : "Running"}</strong>
            </p>

            <table width="100%" border="1">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Buyer</th>
                  <th>Bid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bidders.map((b, i) => {
                  let statusText = "Losing";
                  if (!ended && i === 0) statusText = "Winning";
                  if (ended && i === 0) statusText = "Won";
                  if (ended && i !== 0) statusText = "Lost";

                  return (
                    <tr
                      key={b.userId}
                      style={{
                        background:
                          b.userId === user.id
                            ? "#e6ffe6"
                            : "transparent",
                      }}
                    >
                      <td>{i + 1}</td>
                      <td>{b.name}</td>
                      <td>₹{b.price}</td>
                      <td>{statusText}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default BLeaderboard;
