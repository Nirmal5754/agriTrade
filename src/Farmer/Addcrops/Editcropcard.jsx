import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAllCrops } from "../../Redux/Slices/cropSlice";
import Addcropform from "./Addcropform";

const EditCropCard = () => {
  const navigate = useNavigate();
  const { cropId } = useParams();

  const user = useSelector((state) => state.auth.user);
  const allCrops = useSelector(selectAllCrops);

  const cropData = allCrops.find((c) => String(c.id) === String(cropId));

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    // If crop is missing (or not owned by this farmer), go back.
    if (!cropData || (cropData.ownerId && cropData.ownerId !== user.id)) {
      navigate("/addcrop");
    }
  }, [user?.id, cropData, navigate]);

  if (!cropData) {
    return <p>Loading...</p>;
  }

  return (
    <div className="edit-crop-page">
      <h2>Edit Crop</h2>
      <Addcropform editCrop={cropData} />
    </div>
  );
};

export default EditCropCard;
