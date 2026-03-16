import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUserBids, setUserBids } from "../../Redux/Slices/bidSlice";
import { selectAllCrops, setCrops } from "../../Redux/Slices/cropSlice";
import { useParams } from "react-router-dom";
import { toast } from "../../ui/toast";



const Bidportal = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
const { cropId } = useParams();

  const [crop, setCrop] = useState(null);
  const [bidPrice, setBidPrice] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");

const loggedInUser = useSelector((state) => state.auth.user);
const allCrops = useSelector(selectAllCrops);
const myBidsFromStore = useSelector((state) => selectUserBids(state, loggedInUser?.id));



  /* -------- LOAD CROP -------- */
  useEffect(() => {
  if (!loggedInUser) {
    navigate("/login");
    return;
  }

  const found = allCrops.find((c) => String(c.id) === String(cropId));
  if (!found) {
    navigate("/bhome");
    return;
  }

  setCrop(found);
}, [navigate, loggedInUser, allCrops, cropId]);


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
      toast.error("Bid must be greater than base price");
      return;
    }

    const now = Date.now();

    // Auction start logic: start on first bid
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

      // Update local crop state for immediate UI update
      if (c.id === crop.id) setCrop(updatedCrop);

      return updatedCrop;
    });

    dispatch(setCrops(updatedAllCrops));


    /* -------- UPDATE myBids -------- */
const myBids = [...(myBidsFromStore || [])];


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
   
    dispatch(setUserBids({ userId: loggedInUser.id, bids: myBids }));


 
    navigate("/mybidlist");
  };

  if (!crop) return null;

  return (
    <div className="bidportal-container w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bidportal-header flex flex-col sm:flex-row gap-4 items-start">
        <img src={crop.images?.[0]} alt={crop.name} className="w-full sm:w-64 h-40 sm:h-48 object-cover rounded-lg" />
        <div>
          <h2>{crop.name}</h2>
          <p>Condition: {crop.cropCondition}</p>
          <p>Address: {crop.address}</p>
          <p>Harvest Date: {crop.harvestDate}</p>
        </div>
      </div>

      <p>
        <strong>Base Price:</strong> {"\u20B9"}
        {crop.basePrice}
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
      <button onClick={handleBidSubmit} className="mt-3 w-full sm:w-auto rounded-md bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800">Place Bid</button>

      {/* Optional: show current bidders */}
      {crop.bidders?.length > 0 && (
        <div>
          <h3>Current Bids</h3>
          <ul>
            {crop.bidders.map((b, i) => (
              <li key={i}>
                {b.name}: {"\u20B9"}
                {b.price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Bidportal;



