import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BChats = () => {
  const [chatCrops, setChatCrops] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return null;

  useEffect(() => {
    const loadChats = () => {
      const myBids =
        JSON.parse(localStorage.getItem(`myBids_${user.id}`)) || [];
      const allCrops =
        JSON.parse(localStorage.getItem("allCrops")) || [];

      const now = Date.now();

      const eligible = myBids
        .map((bid) => {
          const crop = allCrops.find((c) => c.id === bid.id);
          if (!crop) return null;

          const auctionEnded = now >= crop.auctionEndTime;

          // 🔓 RUNNING AUCTION → SHOW CARD
          if (!auctionEnded) {
            return crop;
          }

          // 🔐 ENDED AUCTION → SHOW ONLY IF BUYER WON
          const sorted = [...(crop.bidders || [])].sort(
            (a, b) => (b.price || b.bidPrice) - (a.price || a.bidPrice)
          );

          if (sorted[0]?.userId === user.id) {
            return crop;
          }

          return null;
        })
        .filter(Boolean);

      setChatCrops(eligible);
    };

    loadChats();
    window.addEventListener("cropsUpdated", loadChats);
    return () =>
      window.removeEventListener("cropsUpdated", loadChats);
  }, [user.id]);

  const getFarmerName = (crop) =>
    crop.farmerName || crop.farmer || crop.ownerName || "Farmer";

  if (chatCrops.length === 0) {
    return <p style={{ padding: 20 }}>No chats available.</p>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <h2>Chats</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {chatCrops.map((crop) => (
          <div
            key={crop.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <p>
              <strong>Farmer:</strong> {getFarmerName(crop)}
            </p>

            <p>
              <strong>Crop:</strong> {crop.name}
            </p>

            <button
              onClick={() => navigate(`/bmessage/${crop.id}`)}
              style={{ marginTop: 10 }}
            >
              Chat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BChats;
