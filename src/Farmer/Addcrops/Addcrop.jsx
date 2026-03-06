import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Addcrop = () => {
  const [crops, setCrops] = useState([]);
  const navigate = useNavigate();
  const STORAGE_KEY_PREFIX = "farmerCrops_";

  const getUser = () => JSON.parse(localStorage.getItem("loggedInUser"));

const loadFarmerCrops = () => {
  const user = getUser();
  if (!user?.id) return;

  const farmerKey = `${STORAGE_KEY_PREFIX}${user.id}`;
  const farmerCrops = JSON.parse(localStorage.getItem(farmerKey)) || [];
  const allCrops = JSON.parse(localStorage.getItem("allCrops")) || [];
  const now = Date.now();

  const updated = farmerCrops.map((crop) => {
    const globalCrop = allCrops.find((c) => c.id === crop.id);

    let status = "Not Started";
    let auctionEndTime = globalCrop?.auctionEndTime || null;

    if (globalCrop?.auctionStartTime && globalCrop?.auctionEndTime) {
      if (now >= globalCrop.auctionStartTime && now < globalCrop.auctionEndTime) {
        status = "Active";
        // ✅ Recalculate remaining time if duration changed
        const timePassed = now - globalCrop.auctionStartTime;
        const remainingMs = (globalCrop.auctionDurationMs || 0) - timePassed;
        auctionEndTime = now + (remainingMs > 0 ? remainingMs : 0);
      } else if (now >= globalCrop.auctionEndTime) {
        status = "Ended";
      }
    }

    return {
      ...crop,
      auctionStatus: status,
      auctionEndTime,
    };
  });

  setCrops(updated);
};



  useEffect(() => {
    loadFarmerCrops();
    window.addEventListener("cropsUpdated", loadFarmerCrops);

    const interval = setInterval(loadFarmerCrops, 1000);

    return () => {
      window.removeEventListener("cropsUpdated", loadFarmerCrops);
      clearInterval(interval);
    };
  }, []);

  const handleEdit = (crop) => {
    localStorage.setItem("editCropData", JSON.stringify(crop));
    navigate("/editcropcard");
  };

  // ✅ GLOBAL REMOVE (unchanged logic)
  const handleRemove = (id) => {
  const user = getUser();
  if (!user?.id) return;

  const allCrops = JSON.parse(localStorage.getItem("allCrops")) || [];
  const crop = allCrops.find((c) => c.id === id);

  // 🔐 SAFETY CHECK — DO NOT REMOVE ENDED AUCTIONS
  if (crop?.auctionEndTime && Date.now() >= crop.auctionEndTime) {
    alert("Auction has ended. This crop cannot be removed.");
    return;
  }

  const farmerKey = `${STORAGE_KEY_PREFIX}${user.id}`;
  const farmerCrops = JSON.parse(localStorage.getItem(farmerKey)) || [];

  localStorage.setItem(
    farmerKey,
    JSON.stringify(farmerCrops.filter((c) => c.id !== id))
  );

  localStorage.setItem(
    "allCrops",
    JSON.stringify(allCrops.filter((c) => c.id !== id))
  );

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("myBids_")) {
      const bids = JSON.parse(localStorage.getItem(key)) || [];
      localStorage.setItem(
        key,
        JSON.stringify(bids.filter((b) => b.id !== id))
      );
    }
  });

  window.dispatchEvent(new Event("cropsUpdated"));
};


  return (
    <div className="addcrop-page relative bottom-65 bg-white-100 min-h-screen px-8 py-8 ">
      <div className="header mb-5 min-w-screen flex items-center ">
        <h2 className="font-bold text-green-300">My Crops</h2>
        <button onClick={() => navigate("/addcropform")} className="bg-amber-800 text-white rounded-lg p-2 font-semibold">Add +</button>
      </div>

      {crops.length === 0 ? (
        <p>No crops added yet.</p>
      ) : (
        <div className="crop-card-container flex gap-20 px-8 py-8 bg-white-500">
          {crops.map((crop) => (
            <div className="crop-card rounded-lg p-5  flex flex-col gap-3 bg-amber-100 shadow-lg items-center justify-center text-center font-semibold" key={crop.id}>
              <img className=" rounded-lg" src={crop.images?.[0] || ""} alt={crop.name} />
              <h2 className="text-xl font-bold text-green-500">{crop.name}</h2>
              <p className="text-amber-900"> <span className="text-green-700">Category:</span> {crop.category}</p>
              <p className="text-amber-900">
               <span className="text-green-700"> Quantity:</span> {crop.quantity} {crop.unit}
              </p>
              <p className="text-amber-900"><span className="text-green-700">Base Price: </span>  ₹{crop.basePrice}</p>
              <p className="text-amber-900"> <span className="text-green-700">Status:</span>  {crop.auctionStatus}</p>

              <div className="card-buttons flex gap-4 mt-3">
                <button onClick={() => handleEdit(crop)} className="  px-2 rounded bg-yellow-400 text-white ">Edit</button>
               <button
  onClick={() => handleRemove(crop.id)}
  disabled={crop.auctionStatus === "Ended"}
  style={{
    opacity: crop.auctionStatus === "Ended" ? 0.5 : 1,
    cursor: crop.auctionStatus === "Ended" ? "not-allowed" : "pointer",
  }}
  className="rounded text-red-800 border border-red-800 px-3 py-1"
>
  Remove
</button>


              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Addcrop;
