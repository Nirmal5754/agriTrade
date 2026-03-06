import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORY_OPTIONS = [
  "",
  "vegetables",
  "fruits",
  "cereals",
  "pulses",
  "oilseeds",
  "spices",
  "leafy_greens",
  "nuts",
  "flowers",
  "others",
];

const humanCategory = (cat) =>
  cat ? cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

const BHome = () => {
  const navigate = useNavigate();

  const [allCrops, setAllCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const loggedInUser =
    JSON.parse(localStorage.getItem("loggedInUser")) || null;

  const myBids =
    loggedInUser
      ? JSON.parse(localStorage.getItem(`myBids_${loggedInUser.id}`)) || []
      : [];

  useEffect(() => {
    const load = () => {
      const stored = JSON.parse(localStorage.getItem("allCrops")) || [];
      setAllCrops(stored);
    };

    load();
    window.addEventListener("cropsUpdated", load);
    return () => window.removeEventListener("cropsUpdated", load);
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();

    const results = allCrops.filter((crop) => {
      const matchName = crop.name?.toLowerCase().includes(term);
      const matchCat = filterCategory ? crop.category === filterCategory : true;
      return matchName && matchCat;
    });

    setFilteredCrops(results);
  }, [allCrops, searchTerm, filterCategory]);

  const hasParticipated = (cropId) =>
    myBids.some((bid) => bid.id === cropId);

  const getAuctionResult = (crop) => {
    if (!loggedInUser) return null;

    const ended = Date.now() >= crop.auctionEndTime;
    if (!ended) return null;

    const bidders = [...(crop.bidders || [])].sort(
      (a, b) => b.price - a.price
    );

    if (!bidders.length) return null;

    return bidders[0].userId === loggedInUser.id ? "WON" : "LOST";
  };

  const handleBid = (crop) => {
    localStorage.setItem("bidOnCrop", JSON.stringify(crop));
    navigate("/bidportal");
  };

  return (
    <div className="bmain parent bottom-50 relative min-w-screen min-h-screen">
        <h2 className="text-center font-bold text-lg">Crops</h2>
      <div className="bmheader flex gap-20 justify-around p-5 m-5 bg-amber-800">
      

        <input
          type="search"
          placeholder="      Search crop"
          onChange={(e) => setSearchTerm(e.target.value)} className="bg-white rounded-lg p-2 w-200 border-none text-white-800 outline-none"
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white rounded-lg outline-none w-80 px-5 font-semibold"
        >
          <option value="">&nbsp; &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;All categories</option>
          {CATEGORY_OPTIONS.filter(Boolean).map((opt) => (
            <option key={opt} value={opt}>
              {humanCategory(opt)}
            </option>
          ))}
        </select>
      </div>

      <div className="b-cards-grid flex gap-20 ml-15 mt-10 justify-start">
        {filteredCrops.length === 0 ? (
          <p className="relative top-[50vh] left-[50vw]">No crops available</p>
        ) : (
          filteredCrops.map((crop) => {
            const participated = hasParticipated(crop.id);
            const ended =
              crop.auctionEndTime &&
              Date.now() >= crop.auctionEndTime;
            const result = getAuctionResult(crop);

            return (
              <div key={crop.id} className="b-crop-card flex flex-col gap-3 bg-amber-100 shadow-lg p-5 items-center justify-center text-center font-semibold rounded-lg">
                <img src={crop.images?.[0] || ""} alt={crop.name}  className="rounded-lg"/>

                <h3 className="text-xl font-bold text-green-500">{crop.name}</h3>

                <p>
                  <strong className="text-amber-900">Category:</strong>{" "}
                  <span className="text-green-700">{humanCategory(crop.category)}</span>
                </p>

                <p>
                  <strong className="text-amber-900">Quantity:</strong>{" "}
              <span className="text-green-700"> {crop.quantity} {crop.unit}</span>   
                </p>

                <p>
                  <strong className="text-amber-900">Base Price:</strong> <span className="text-green-700"> ₹{crop.basePrice}</span>
                </p>

                {/* ✅ STATUS MESSAGE */}
                {!ended && participated && (
                  <p style={{ fontWeight: "bold", color: "#555" }}>
                    You have already participated
                  </p>
                )}

                {ended && result === "WON" && (
                  <p style={{ fontWeight: "bold", color: "green" }}>
                    You won the auction
                  </p>
                )}

                {ended && result === "LOST" && (
                  <p style={{ fontWeight: "bold", color: "red" }}>
                    You lost the auction
                  </p>
                )}

                {/* ✅ BUTTON */}
                <button
                  disabled={ended || participated}
                  onClick={() => handleBid(crop)}
                  style={{
                    background:
                      ended || participated ? "#a3b2ab" : "#007bff",
                    cursor:
                      ended || participated
                        ? "not-allowed"
                        : "pointer",
                  }}  
                  className="rounded-lg px-4 py-1"
                >
                  {ended
                    ? "Bid"
                    : participated
                    ? "Participated"
                    : "Bid"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BHome;
