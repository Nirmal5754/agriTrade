import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { removeCrop, selectUserCropsWithStatus } from "../../Redux/Slices/cropSlice";
import { toast } from "../../ui/toast";

const Addcrop = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const crops = useSelector((state) =>
    selectUserCropsWithStatus(state, user?.id)
  );

  const dispatch = useDispatch();

  const handleEdit = (crop) => {
    navigate(`/editcropcard/${crop.id}`);
  };

  // GLOBAL REMOVE
  const handleRemove = (id) => {
    const crop = crops.find((c) => c.id === id);

    if (crop?.auctionStatus === "Ended") {
      toast.error("Auction has ended. This crop cannot be removed.");
      return;
    }

    dispatch(removeCrop(id));
  };

  return (
    <div className="addcrop-page bg-neutral-50 min-h-screen px-4 sm:px-6 lg:px-8 py-6">
      <div className="header mb-5 w-full flex flex-wrap items-center justify-between gap-4 ">
        <h2 className="font-extrabold text-green-500 mx-auto text-3xl mt-7 mb-4">My Crops</h2>
        <button
          onClick={() => navigate("/addcropform")}
          className="bg-amber-800 text-yellow-500 rounded-3xl px-6 py-5 font-8xl font-semibold fixed mt-200 ml-370"
        >
       <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#fbf475"><path d="M440-120v-320H120v-80h320v-320h80v320h320v80H520v320h-80Z"/></svg>
        </button>
      </div>

      {crops.length === 0 ? (
        <p className="text-center py-10 font-semibold text-neutral-700">
          No crops added yet.
        </p>
      ) : (
        <div className="crop-card-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {crops.map((crop) => (
            <div
              className="crop-card rounded-lg p-4 sm:p-5 flex flex-col gap-3 shadow-lg items-center border border-1 border-green-100 justify-center text-center font-semibold w-full overflow-hidden"
              key={crop.id}
            >
              <img
                className="rounded-lg w-full h-40 object-cover"
                src={crop.images?.[0] || ""}
                alt={crop.name}
              />
              <h2 className="text-xl font-bold text-green-500">{crop.name}</h2>
              <p className="text-amber-900">
                <span className="text-green-700">Category:</span> {crop.category}
              </p>
              <p className="text-amber-900">
                <span className="text-green-700"> Quantity:</span> {crop.quantity}{" "}
                {crop.unit}
              </p>
              <p className="text-amber-900">
                <span className="text-green-700">Base Price: </span> {"\u20B9"}
                {crop.basePrice}
              </p>
              <p className="text-amber-900">
                <span className="text-green-700">Status:</span> {crop.auctionStatus}
              </p>

              <div className="card-buttons flex gap-4 mt-3">
                <button
                  onClick={() => handleEdit(crop)}
                  className="  px-2 rounded bg-yellow-400 text-white "
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemove(crop.id)}
                  disabled={crop.auctionStatus === "Ended"}
                  className="rounded border border-red-800 px-3 py-1 text-red-800 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
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


