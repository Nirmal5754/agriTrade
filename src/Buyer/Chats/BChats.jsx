import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectUserBids } from "../../Redux/Slices/bidSlice";
import { selectAllCrops } from "../../Redux/Slices/cropSlice";

const BChats = () => {
  const user = useSelector((state) => state.auth.user);
  const myBids = useSelector((state) => selectUserBids(state, user?.id));
  const allCrops = useSelector(selectAllCrops);

  const chatCrops = useMemo(() => {
    if (!user?.id) return [];

    const now = Date.now();

    return (myBids || [])
      .map((bid) => {
        const crop = allCrops.find((c) => c.id === bid.id);
        if (!crop) return null;

        const auctionEnded = now >= crop.auctionEndTime;

        // Running auction -> show card
        if (!auctionEnded) return crop;

        // Ended auction -> show only if buyer won
        const sorted = [...(crop.bidders || [])].sort(
          (a, b) => (b.price || b.bidPrice) - (a.price || a.bidPrice)
        );

        if (sorted[0]?.userId === user.id) return crop;

        return null;
      })
      .filter(Boolean);
  }, [user?.id, myBids, allCrops]);

  const getFarmerName = (crop) =>
    crop.farmerName || crop.farmer || crop.ownerName || "Farmer";

  if (!user) return null;
  if (chatCrops.length === 0) {
    return <p className="p-5 font-semibold text-neutral-700">No chats available.</p>;
  }

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8">
      <h2 className="my-6 font-extrabold text-2xl sm:text-3xl text-amber-900 text-center">
        Chats
      </h2>

      <div className="flex flex-col gap-4 mt-6 max-w-3xl mx-auto">
        {chatCrops.map((crop) => (
          <div
            key={crop.id}
            className="gap-3 flex flex-col sm:flex-row sm:items-center justify-between w-full border bg-yellow-200 border-white rounded p-4"
          >
            <p>
              <strong className="text-amber-900 font-extrabold">
                Farmer:
              </strong>{" "}
              <span className="text-green-700 font-bold">
                {getFarmerName(crop)}
              </span>
            </p>

            <p>
              <strong className="text-amber-900 font-extrabold">Crop:</strong>{" "}
              <span className="text-green-700 font-bold">{crop.name}</span>
            </p>

            <Link
              to={`/bmessage/${crop.id}`}
              className="text-center rounded-lg bg-green-500 hover:bg-green-600 shadow-md px-4 py-2 text-amber-900 font-extrabold w-full sm:w-auto no-underline"
            >
              Chat now
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BChats;
