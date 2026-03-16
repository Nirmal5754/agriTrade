import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAllCrops } from "../../Redux/Slices/cropSlice";
import { markDeleted, selectDeletedBidCrops } from "../../Redux/Slices/bidSlice";

const BLeaderboard = () => {
  const [boards, setBoards] = useState([]);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const allCrops = useSelector(selectAllCrops);
  const deletedIds = useSelector((state) =>
    selectDeletedBidCrops(state, user?.id)
  );

  useEffect(() => {
    if (!user?.id) {
      setBoards([]);
      return;
    }

    const deleted = deletedIds || [];

    // Only crops where buyer placed a bid AND not deleted
    const myCrops = allCrops.filter(
      (c) =>
        !deleted.includes(c.id) &&
        c.bidders?.some((b) => b.userId === user.id)
    );

    const data = myCrops.map((crop) => {
      const bidders = [...(crop.bidders || [])].sort(
        (a, b) => b.price - a.price
      );

      const myIndex = bidders.findIndex((b) => b.userId === user.id);

      const ended = Date.now() >= crop.auctionEndTime;
      const status = ended && myIndex !== 0 ? "Lost" : ended ? "Won" : "Running";

      return { crop, bidders, myStatus: status };
    });

    setBoards(data);
  }, [user?.id, allCrops, deletedIds]);

  // Delete lost bid (visibility only)
  const deleteLostBid = (cropId) => {
    if (!user?.id) return;
    dispatch(markDeleted({ userId: user.id, cropId }));
  };

  if (boards.length === 0) {
    return <p className="p-5 font-semibold text-neutral-700">No bids placed yet.</p>;
  }

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6">
      <h2 className="font-extrabold text-3xl text-center text-amber-900 ">
        My Leaderboards
      </h2>

      {boards.map(({ crop, bidders, myStatus }) => {
        const ended = Date.now() >= crop.auctionEndTime;

        return (
          <div
            key={crop.id}
            className="relative flex flex-col justify-start gap-4 mt-6"
          >
            {/* DELETE BUTTON (ONLY IF LOST) */}
            {ended && myStatus === "Lost" && (
              <button
                onClick={() => deleteLostBid(crop.id)}
                className="absolute top-2 right-2 border-0 bg-transparent cursor-pointer text-lg leading-none"
                title="Remove"
              >
                🗑️
              </button>
            )}

            <strong className="text-xl font-bold text-green-500">
              {crop.name}
            </strong>
            <p className="text-amber-900 font-bold">
              Status:{" "}
              <strong className="text-green-700">
                {ended ? "Ended" : "Running"}
              </strong>
            </p>

            <div className="border border-gray-200 rounded-lg w-full overflow-x-auto">
              <table className="min-w-[640px] w-full">
                <thead className="bg-yellow-300">
                  <tr className="border border-green-300">
                    <th className="p-3">Rank</th>
                    <th className="p-3">Buyer</th>
                    <th className="p-3">Bid</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-amber-700 text-amber-100 font-semibold">
                  {bidders.map((b, i) => {
                    let statusText = "Losing";
                    if (!ended && i === 0) statusText = "Winning";
                    if (ended && i === 0) statusText = "Won";
                    if (ended && i !== 0) statusText = "Lost";

                    return (
                      <tr key={b.userId}>
                        <td className="p-3 border-gray-200">{i + 1}</td>
                        <td className="p-3 border-gray-200">{b.name}</td>
                        <td className="p-3 border-gray-200">
                          {"\u20B9"}
                          {b.price}
                        </td>
                        <td className="p-3 border-gray-200">{statusText}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BLeaderboard;


