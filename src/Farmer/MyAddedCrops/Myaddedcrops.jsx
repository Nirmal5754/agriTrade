import React, { useEffect, useState } from "react";

const Myaddedcrops = () => {
  const [crops, setCrops] = useState([]);

  const loadCrops = () => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user?.id) return;

    const farmerKey = `farmerCrops_${user.id}`;
    const farmerCrops = JSON.parse(localStorage.getItem(farmerKey)) || [];
    const allCrops = JSON.parse(localStorage.getItem("allCrops")) || [];
    const now = Date.now();

    const updated = farmerCrops.map((crop) => {
      const globalCrop = allCrops.find((c) => c.id === crop.id);

      let status = "Not Started";

      if (globalCrop?.auctionStartTime && globalCrop?.auctionEndTime) {
        if (now >= globalCrop.auctionStartTime && now < globalCrop.auctionEndTime) {
          status = "Active";
        } else if (now >= globalCrop.auctionEndTime) {
          status = "Ended";
        }
      }

      return { ...crop, auctionStatus: status };
    });

    setCrops(updated);
  };

  useEffect(() => {
    loadCrops();
    const interval = setInterval(loadCrops, 1000);
    window.addEventListener("cropsUpdated", loadCrops);

    return () => {
      clearInterval(interval);
      window.removeEventListener("cropsUpdated", loadCrops);
    };
  }, []);

  const getBadgeClass = (status) => {
    switch (status) {
      case "Active":
        return "badge active";
      case "Ended":
        return "badge ended";
      default:
        return "badge not-started";
    }
  };

  return (
    <div className="mx-8 my-added-crops px-8 relative bottom-33 bg-white-500  min-w-screen min-h-screen"><h2 className="">My Added Crops</h2> 
      <div className="bg-gray-100 flex justify-center relative bottom-27 p-8 rounded-lg min-h-screen">
  

      {crops.length === 0 ? (
        <p>No crops added yet.</p>
      ) : (
        <table className="border border-gray-300 w-200 mx-9">
          <thead>
            <tr>
              <th className="border py-3  border-gray-300 p-1 bg-green-700 text-lg text-yellow-100">Crop Image</th>
              <th className="border  border-gray-300 p-1 bg-green-700 text-lg  text-yellow-100">Crop Name</th>
              <th className="border  border-gray-300 p-1 bg-green-700 text-lg  text-yellow-100">Status</th>
            </tr>
          </thead>
          <tbody>
            {crops.map((crop) => (
              <tr key={crop.id}>
                <td className="border  border-gray-300 w-70 justify-center items-center">
                  {crop.images?.[0] ? (
                    <img
                      src={crop.images[0]}
                      alt={crop.name}
                     className="h-30 w-30 justify-center relative left-20 rounded-lg"
                    />
                  ) : (
                    "No Image"
                  )}
                </td>
                <td className="border  border-gray-300 text-center">{crop.name}</td>
                <td className="border  border-gray-300 text-center">
                  <span className={`${getBadgeClass(crop.auctionStatus)} ${crop.auctionStatus === 'Active' ?'text-green-400': crop.auctionStatus === 'Ended' ? 'text-red-700':'text-gray-300'} font-semibold`}>
                    {crop.auctionStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    
    </div>
  );
};

export default Myaddedcrops;

