import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Mybidlist = () => {
  const [bids, setBids] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return null;

  const MY_KEY = `myBids_${user.id}`;
  const DEL_KEY = `deletedBidCrops_${user.id}`;

  /* ================= LOAD BIDS ================= */
  const loadBids = () => {
    const myBids = JSON.parse(localStorage.getItem(MY_KEY)) || [];
    const deleted = JSON.parse(localStorage.getItem(DEL_KEY)) || [];
    const allCrops = JSON.parse(localStorage.getItem("allCrops")) || [];
    const now = Date.now();

    const updated = myBids
      .filter((b) => !deleted.includes(b.id))
      .map((bid) => {
        const crop = allCrops.find((c) => c.id === bid.id);
        if (!crop) return null;

        let status = "Running";

        if (!crop.auctionStartTime) {
          status = "Not Started";
        } else if (crop.auctionEndTime && now >= crop.auctionEndTime) {
          // Auction ended
          const sortedBidders = [...(crop.bidders || [])].sort(
            (a, b) => b.price - a.price
          );
          status = sortedBidders[0]?.userId === user.id ? "Won" : "Lost";
        } else if (crop.auctionStartTime && crop.auctionEndTime) {
          if (now >= crop.auctionStartTime && now < crop.auctionEndTime) {
            status = "Running";
          } else if (now < crop.auctionStartTime) {
            status = "Not Started";
          }
        }

        return {
          ...bid,
          cropName: crop.name,
          images: crop.images,
          auctionStartTime: crop.auctionStartTime,
          auctionEndTime: crop.auctionEndTime,
          bidStatus: status,
        };
      })
      .filter(Boolean);

    setBids(updated);
  };

  /* ================= EFFECTS ================= */
  useEffect(() => {
    loadBids();

    const interval = setInterval(loadBids, 1000); // ✅ real-time timer
    window.addEventListener("cropsUpdated", loadBids);

    return () => {
      clearInterval(interval);
      window.removeEventListener("cropsUpdated", loadBids);
    };
  }, []);

  /* ================= DELETE LOST BID ================= */
  const deleteBid = (cropId) => {
    const deleted = JSON.parse(localStorage.getItem(DEL_KEY)) || [];
    if (!deleted.includes(cropId)) {
      localStorage.setItem(DEL_KEY, JSON.stringify([...deleted, cropId]));
    }
    window.dispatchEvent(new Event("cropsUpdated"));
  };

  /* ================= UPDATE BID ================= */
  const updateBid = (bid) => {
    localStorage.setItem("bidOnCrop", JSON.stringify(bid));
    navigate("/bidportal");
  };

  /* ================= TIMER ================= */
  const formatTime = (bid) => {
    if (!bid.auctionStartTime) return "Not Started";
    if (!bid.auctionEndTime) return "Not Started";

    const diff = bid.auctionEndTime - Date.now();
    if (diff <= 0) return "Ended";

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    return `${h}h ${m}m ${s}s`;
  };

  /* ================= UI ================= */
  return (
    <div className="mybidlist-page">
      <h2>My Bids</h2>

      {bids.length === 0 ? (
        <p>No bids placed yet.</p>
      ) : (
        bids.map((bid) => {
          const ended = bid.bidStatus !== "Running";

          return (
            <div
              key={bid.id}
              style={{
                border: "1px solid #ccc",
                padding: 12,
                marginBottom: 12,
                position: "relative",
                borderRadius: 6,
              }}
            >
              {/* 🗑️ DELETE LOST BID */}
              {ended && bid.bidStatus === "Lost" && (
                <button
                  onClick={() => deleteBid(bid.id)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                  title="Delete Lost Bid"
                >
                  🗑️
                </button>
              )}

              {/* IMAGE */}
              {bid.images?.[0] && (
                <img
                  src={bid.images[0]}
                  alt={bid.cropName}
                  style={{
                    width: "100%",
                    height: "160px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginBottom: "10px",
                  }}
                />
              )}

              <h3>{bid.cropName}</h3>
              <p>Your Bid: ₹{bid.bidPrice}</p>
              <p>Status: {bid.bidStatus}</p>
              <p>Time Remaining: {formatTime(bid)}</p>

              {!ended && (
                <button onClick={() => updateBid(bid)}>Update Bid</button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Mybidlist;
