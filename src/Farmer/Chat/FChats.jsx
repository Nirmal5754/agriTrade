import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FChats = () => {
  const navigate = useNavigate();
  const [endedWinnerCrops, setEndedWinnerCrops] = useState([]);

  const farmer =
    JSON.parse(localStorage.getItem("loggedInUser")) || null;

  useEffect(() => {
  if (!farmer) return;

  const loadEndedWinners = () => {
    const allCrops =
      JSON.parse(localStorage.getItem("allCrops")) || [];

    const now = Date.now();

    const endedWithWinner = allCrops
      .filter((crop) => {
        const ownerMatch =
          crop.farmerId === farmer.id ||
          crop.ownerId === farmer.id;

        return (
          ownerMatch &&
          crop.auctionEndTime &&
          now >= crop.auctionEndTime &&
          Array.isArray(crop.bidders) &&
          crop.bidders.length > 0
        );
      })
      .map((crop) => {
        const sorted = [...crop.bidders].sort(
          (a, b) =>
            (b.price || b.bidPrice) -
            (a.price || a.bidPrice)
        );

        const winner = sorted[0];

        return {
          cropId: crop.id,
          cropName: crop.name,
          winner,
          winningPrice:
            winner?.price || winner?.bidPrice,
        };
      });

    setEndedWinnerCrops(endedWithWinner);
  };

  loadEndedWinners();
  window.addEventListener("cropsUpdated", loadEndedWinners);

  return () => {
    window.removeEventListener(
      "cropsUpdated",
      loadEndedWinners
    );
  };
}, [farmer]);


  return (
    <div className="fchats">
      <h2 className="text-center font-bold relative bottom-50 text-xl">Chats</h2>
<div className="bg-green-50 min-w-screen min-h-screen flex gap-4 p-20 mx-10 my-10 rounded relative bottom-50">
    {endedWinnerCrops.length === 0 ? (
        <p>No chats available yet</p>
      ) : (
        endedWinnerCrops.map((item) => (

          <div key={item.cropId} className="chat-card bg-amber-100 shadow-lg shadow-gray-250 rounded-lg h-50 w-70 flex flex-col justify-center items-center gap-3">
            <h4>{item.cropName}</h4>

            <p>
              <strong>Buyer:</strong>{" "}
              {item.winner?.userName ||
                item.winner?.name ||
                "Winner"}
            </p>

            <p>
              <strong>Winning Bid:</strong>{" "}
              {item.winningPrice}
            </p>

      <button
              onClick={() =>
                navigate(`/fmessage/${item.cropId}`, {
                  state: {
                    winner: item.winner
                  }
                })
              }
              className="bg-red-200 rounded-md p-2 font-semibold shadow-md"
            >
              Open Chat
            </button>




          </div>
        ))
      )}
</div>
  
    </div>
  );
};

export default FChats;
