import React, { useEffect, useState } from "react";

const BiddersList = () => {
  const [crops, setCrops] = useState([]);

  const loadData = () => {
    const farmer = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!farmer?.id) return;

    const allCrops = JSON.parse(localStorage.getItem("allCrops")) || [];
    const now = Date.now();

    // ✅ Show all crops whose auction has started or is active
    const visibleCrops = allCrops
      .filter(
        (crop) =>
          crop.ownerId === farmer.id &&
          crop.auctionStartTime &&
          now >= crop.auctionStartTime
      )
      .map((crop) => {
        // Determine auction status
        let status = "Running";
        if (crop.auctionEndTime && now >= crop.auctionEndTime) status = "Ended";
        return { ...crop, auctionStatus: status };
      });

    setCrops(visibleCrops);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000);
    window.addEventListener("cropsUpdated", loadData);

    return () => {
      clearInterval(interval);
      window.removeEventListener("cropsUpdated", loadData);
    };
  }, []);

  const getStatus = (rank, ended) => {
    if (ended) return rank === 1 ? "Won" : "Lost";
    if (rank <= 3) return "Winning";
    if (rank <= 6) return "Mid";
    return "Losing";
  };

  return (
    <div className="relative bottom-50">
      <h2 className="text-center font-bold text-xl relative bottom-3 p-3">Bidders List</h2>

      {crops.length === 0 && (
        <p>No auctions have started yet.</p>
      )}

      {crops.map((crop) => {
        const ended =
          crop.auctionEndTime && Date.now() >= crop.auctionEndTime;

        const bidders = [...(crop.bidders || [])].sort(
          (a, b) => b.price - a.price
        );

        return (
          <div
            key={crop.id}
            style={{
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "25px",
            }}

          >
            <div>
            <h3 className="font-semibold">{crop.name}</h3>
            <p className="font-semibold">Base Price: ₹{crop.basePrice}</p>
            <p className="font-semibold">
              Auction Status: <strong className={`${ended ? "text-gray-500" : "text-green-200" }`}>{ended ? "Ended" : "Running"}</strong>
            </p></div> <br />
 <div>
            <table width="100%" border="1" className="border w-200 border-gray-300 rounded-lg">
              <thead>
                <tr className="border-gray-400">
                  <th className="border bg-green-700  border-gray-300 text-center text-yellow-100">Rank</th>
                  <th className="border  bg-green-700 border-gray-300 text-center text-yellow-100">Buyer</th>
                  <th className="border  bg-green-700 border-gray-300 text-center text-yellow-100" >Bid Price</th>
                  <th className="border  bg-green-700 border-gray-300 text-center text-yellow-100">Status</th>
                </tr>
              </thead>

              <tbody>
                {bidders.length === 0 ? (
                  <tr className="border  border-gray-300 ">
                    <td colSpan="4" className="border  border-gray-300 text-center">
                      No bids placed yet
                    </td>
                  </tr>
                ) : (
                  bidders.map((b, i) => (
                    <tr key={b.userId} className="border  border-gray-300 ">
                      <td className="border  border-gray-300 text-center font-semibold" >{i + 1}</td>
                      <td className="border  border-gray-300 text-center font-semibold">{b.name}</td>
                      <td className="border  border-gray-300 text-center font-semibold">₹{b.price}</td>
                      <td className={`border  border-gray-300 text-center font-semibold ${getStatus(i + 1, ended) === 'Won' ?'text-green-400':getStatus(i + 1, ended) === 'Lost' ? 'text-red-700':'text-orange-100'} font-semibold`}>{getStatus(i + 1, ended)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
 </div>
          </div>
        );
      })}
    </div>
  );
};

export default BiddersList;
