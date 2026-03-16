import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectAllCrops } from "../../Redux/Slices/cropSlice";

const FChats = () => {
  const navigate = useNavigate();
  const [endedWinnerCrops, setEndedWinnerCrops] = useState([]);

const farmer = useSelector((state) => state.auth.user);
const allCrops = useSelector(selectAllCrops);


  useEffect(() => {
  if (!farmer) return;

  const loadEndedWinners = () => {
   

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

}, [farmer, allCrops]);



  return (
    <div className="fchats w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6">
      <h2 className="text-center font-bold text-2xl sm:text-3xl">Chats</h2>
<div className="bg-green-50 w-full rounded-lg p-4 sm:p-6 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {endedWinnerCrops.length === 0 ? (
        <p>No chats available yet</p>
      ) : (
        endedWinnerCrops.map((item) => (

          <div key={item.cropId} className="chat-card bg-amber-100 shadow-lg rounded-lg w-full flex flex-col justify-center items-start gap-3 p-4">
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
              className="bg-red-200 rounded-lg px-3 py-2 font-semibold shadow-md w-full sm:w-auto"
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


