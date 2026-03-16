import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUserBids } from "../../Redux/Slices/bidSlice";
import { selectAllCrops } from "../../Redux/Slices/cropSlice";

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



  const [filteredCrops, setFilteredCrops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

const user = useSelector((state) => state.auth.user);
const allCrops = useSelector(selectAllCrops);


const myBids = useSelector((state) => selectUserBids(state, user?.id));





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
  if (!user) return null;


    const ended = Date.now() >= crop.auctionEndTime;
    if (!ended) return null;

    const bidders = [...(crop.bidders || [])].sort(
      (a, b) => b.price - a.price
    );

    if (!bidders.length) return null;

  return bidders[0].userId === user.id ? "WON" : "LOST";

  };

  const handleBid = (crop) => {
   navigate(`/bidportal/${crop.id}`);

  };

  return (
    <div className="bmain parent w-full min-h-screen px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-bold text-lg">Crops</h2>
      <div className="bmheader flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center justify-between p-4 sm:p-5 my-4 rounded-lg bg-amber-800">
      

        <input
          type="search"
          placeholder="      Search crop"
          onChange={(e) => setSearchTerm(e.target.value)} className="bg-white rounded-lg px-3 py-2 w-full sm:max-w-sm border border-transparent text-neutral-900 outline-none focus:ring-2 focus:ring-amber-300"
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white rounded-lg outline-none w-full sm:w-64 px-4 py-2 font-semibold text-neutral-900"
        >
          <option value="">&nbsp; &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;All categories</option>
          {CATEGORY_OPTIONS.filter(Boolean).map((opt) => (
            <option key={opt} value={opt}>
              {humanCategory(opt)}
            </option>
          ))}
        </select>
      </div>

      <div className="b-cards-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-6">
        {filteredCrops.length === 0 ? (
          <p className="col-span-full text-center py-10 font-semibold text-neutral-700">No crops available</p>
        ) : (
          filteredCrops.map((crop) => {
            const participated = hasParticipated(crop.id);
            const ended =
              crop.auctionEndTime &&
              Date.now() >= crop.auctionEndTime;
            const result = getAuctionResult(crop);

            return (
              <div key={crop.id} className="b-crop-card flex flex-col gap-3 bg-amber-200 shadow-lg p-4 sm:p-5 items-center justify-center text-center font-semibold rounded-lg w-full">
                <img src={crop.images?.[0] || ""} alt={crop.name}  className="rounded-lg w-full h-40 object-cover"/>

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
                  <strong className="text-amber-900">Base Price:</strong>{" "}
                  <span className="text-green-700">
                    {"\u20B9"}
                    {crop.basePrice}
                  </span>
                </p>

                {/* STATUS MESSAGE */}
                {!ended && participated && (
                  <p className="font-bold text-neutral-600">
                    You have already participated
                  </p>
                )}

                {ended && result === "WON" && (
                  <p className="font-bold text-green-700">
                    You won the auction
                  </p>
                )}

                {ended && result === "LOST" && (
                  <p className="font-bold text-red-600">
                    You lost the auction
                  </p>
                )}

                {/* BUTTON */}
                <button
                  disabled={ended || participated}
                  onClick={() => handleBid(crop)}
                  className={[
                    "rounded-lg px-4 py-2 w-full sm:w-auto text-white font-semibold transition",
                    ended || participated
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                  ].join(" ")}
                >
                  {ended ? "Bid" : participated ? "Participated" : "Bid"}
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


