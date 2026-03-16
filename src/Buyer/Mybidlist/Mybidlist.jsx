import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  markDeleted,
  selectDeletedBidCrops,
  selectUserBids,
} from "../../Redux/Slices/bidSlice";
import { selectAllCrops } from "../../Redux/Slices/cropSlice";

const Mybidlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const allCrops = useSelector(selectAllCrops);
  const myBidsFromStore = useSelector((state) =>
    selectUserBids(state, user?.id)
  );
  const deletedIds = useSelector((state) =>
    selectDeletedBidCrops(state, user?.id)
  );

  // Timer tick for "Time Remaining" without rebuilding state in effects.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const bids = useMemo(() => {
    if (!user?.id) return [];

    const myBids = myBidsFromStore || [];
    const deleted = deletedIds || [];

    return myBids
      .filter((b) => !deleted.includes(b.id))
      .map((bid) => {
        const crop = allCrops.find((c) => c.id === bid.id);
        if (!crop) return null;

        let status = "Running";

        if (!crop.auctionStartTime) {
          status = "Not Started";
        } else if (crop.auctionEndTime && now >= crop.auctionEndTime) {
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
  }, [user?.id, myBidsFromStore, deletedIds, allCrops, now]);

  const deleteBid = (cropId) => {
    if (!user?.id) return;
    dispatch(markDeleted({ userId: user.id, cropId }));
  };

  const updateBid = (bid) => {
    navigate(`/bidportal/${bid.id}`);
  };

  const formatTime = (bid) => {
    if (!bid.auctionStartTime) return "Not Started";
    if (!bid.auctionEndTime) return "Not Started";

    const diff = bid.auctionEndTime - now;
    if (diff <= 0) return "Ended";

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    return `${h}h ${m}m ${s}s`;
  };

  if (!user) return null;

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8">
      <h2 className="text-center p-4 text-xl font-bold ">My Bids</h2>
      <div className="mybidlist-page grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {bids.length === 0 ? (
          <p className="col-span-full text-center py-10 font-semibold text-neutral-700">
            No bids placed yet.
          </p>
        ) : (
          bids.map((bid) => {
            const ended = bid.bidStatus !== "Running";

            return (
              <div
                key={bid.id}
                className="relative w-full border font-semibold rounded-lg p-4 bg-amber-100 text-center border-gray-200 shadow-lg shadow-gray-400 flex flex-col gap-2 overflow-hidden"
              >
                {ended && bid.bidStatus === "Lost" && (
                  <button
                    onClick={() => deleteBid(bid.id)}
                    className="absolute top-2 right-2 border-0 bg-transparent cursor-pointer text-sm font-extrabold text-amber-900 hover:text-red-700"
                    title="Delete Lost Bid"
                  >
                    Remove
                  </button>
                )}

                {bid.images?.[0] && (
                  <img
                    src={bid.images[0]}
                    alt={bid.cropName}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}

                <h3 className="text-green-500 text-xl">{bid.cropName}</h3>
                <p className="text-amber-900">
                  Your Bid:{" "}
                  <span className="text-green-700">
                    {"\u20B9"}
                    {bid.bidPrice}
                  </span>
                </p>
                <p className="text-amber-900">
                  Status:{" "}
                  <span className="text-green-700"> {bid.bidStatus}</span>
                </p>
                <p className="text-amber-900">
                  Time Remaining:{" "}
                  <span className="text-green-700">{formatTime(bid)}</span>{" "}
                </p>

                {!ended && (
                  <button
                    onClick={() => updateBid(bid)}
                    className="mt-2 rounded-md bg-emerald-700 px-3 py-2 text-white font-bold hover:bg-emerald-800"
                  >
                    Update Bid
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Mybidlist;
