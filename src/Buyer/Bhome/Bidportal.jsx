import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import "./Bidportal.css";

const Bidportal = () => {
  const navigate = useNavigate();
  const [crop, setCrop] = useState(null);
  const [bidPrice, setBidPrice] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  /* -------- LOAD CROP -------- */
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("bidOnCrop"));
    if (!stored) {
      navigate("/bhome");
      return;
    }
    setCrop(stored);
  }, [navigate]);

  /* -------- TIMER -------- */
  useEffect(() => {
    if (!crop) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const endTime = crop.auctionEndTime;

      if (!endTime) {
        setTimeRemaining("Not Started");
        return;
      }

      const diff = endTime - now;
      if (diff <= 0) {
        setTimeRemaining("Ended");
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [crop]);

  /* -------- PLACE / UPDATE BID -------- */
  const handleBidSubmit = () => {
    if (!bidPrice || Number(bidPrice) <= crop.basePrice) {
      alert("Bid must be greater than base price");
      return;
    }

    const now = Date.now();

    // ✅ Auction start logic: start on first bid
    const auctionStartTime = crop.auctionStartTime || now;
    const auctionDurationMs = crop.auctionDurationMs || 10 * 60 * 1000;
    const auctionEndTime = auctionStartTime + auctionDurationMs;

    const newBid = {
      userId: loggedInUser.id,
      name: `${loggedInUser.fname} ${loggedInUser.lname}`,
      price: Number(bidPrice),
      time: now,
    };

    /* -------- UPDATE allCrops -------- */
    const allCrops = JSON.parse(localStorage.getItem("allCrops")) || [];

    const updatedAllCrops = allCrops.map((c) => {
      if (c.id !== crop.id) return c;

      const filteredBidders = (c.bidders || []).filter(
        (b) => b.userId !== loggedInUser.id
      );

      const updatedCrop = {
        ...c,
        auctionStartTime,
        auctionDurationMs,
        auctionEndTime,
        bidders: [...filteredBidders, newBid].sort((a, b) => b.price - a.price),
        auctionStatus:
          now >= auctionEndTime
            ? "Ended"
            : now >= auctionStartTime
            ? "Active"
            : "Not Started",
      };

      // Update local bidOnCrop for immediate UI update
      if (c.id === crop.id) setCrop(updatedCrop);

      return updatedCrop;
    });

    localStorage.setItem("allCrops", JSON.stringify(updatedAllCrops));

    /* -------- UPDATE myBids -------- */
    const myBidKey = `myBids_${loggedInUser.id}`;
    const myBids = JSON.parse(localStorage.getItem(myBidKey)) || [];

    const index = myBids.findIndex((b) => b.id === crop.id);

    const entry = {
      id: crop.id,
      cropName: crop.name,
      bidPrice: Number(bidPrice),
      basePrice: crop.basePrice,
      images: crop.images,
      auctionEndTime,
    };

    index >= 0 ? (myBids[index] = entry) : myBids.push(entry);
    localStorage.setItem(myBidKey, JSON.stringify(myBids));

    window.dispatchEvent(new Event("cropsUpdated"));
    navigate("/mybidlist");
  };

  if (!crop) return null;

  return (
    <div className="bidportal-container">
      <div className="bidportal-header">
        <img src={crop.images?.[0]} alt={crop.name} />
        <div>
          <h2>{crop.name}</h2>
          <p>Condition: {crop.cropCondition}</p>
          <p>Address: {crop.address}</p>
          <p>Harvest Date: {crop.harvestDate}</p>
        </div>
      </div>

      <p>
        <strong>Base Price:</strong> ₹{crop.basePrice}
      </p>
      <p>
        <strong>Time Remaining:</strong> {timeRemaining}
      </p>

      <input
        type="number"
        value={bidPrice}
        onChange={(e) => setBidPrice(e.target.value)}
        placeholder="Enter bid"
      />
      <button onClick={handleBidSubmit}>Place Bid</button>

      {/* Optional: show current bidders */}
      {crop.bidders?.length > 0 && (
        <div>
          <h3>Current Bids</h3>
          <ul>
            {crop.bidders.map((b, i) => (
              <li key={i}>
                {b.name}: ₹{b.price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Bidportal;
