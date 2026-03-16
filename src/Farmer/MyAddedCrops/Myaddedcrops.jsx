import React from "react";
import { useSelector } from "react-redux";
import { selectUserCropsWithStatus } from "../../Redux/Slices/cropSlice";



const Myaddedcrops = () => {
const user = useSelector((state) => state.auth.user);
const crops = useSelector((state) =>
  selectUserCropsWithStatus(state, user?.id)
);


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
    <div className="w-full my-added-crops px-4 sm:px-6 lg:px-8 py-6"><h2 className="">My Added Crops</h2> 
      <div className="bg-gray-100 w-full rounded-lg p-4 sm:p-6 overflow-x-auto">
  

      {crops.length === 0 ? (
        <p>No crops added yet.</p>
      ) : (
        <table className="border border-gray-300 min-w-[640px] w-full mx-auto text-sm">
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
                <td className="border border-gray-300 p-2">
                  {crop.images?.[0] ? (
                    <img
                      src={crop.images[0]}
                      alt={crop.name}
                     className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg mx-auto"
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



