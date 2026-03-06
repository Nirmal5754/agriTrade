import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Addcropform from "./addcropform";

const EditCropCard = () => {
  const navigate = useNavigate();
  const [cropData, setCropData] = useState(null);

  useEffect(() => {
    const storedData = localStorage.getItem("editCropData");

    if (storedData) {
      const parsed = JSON.parse(storedData);
      setCropData(parsed);
    } else {
      navigate("/addcrop");
    }
  }, [navigate]);

  const handleUpdate = (formUpdatedCrop) => {
    // ✅ Preserve old ID and ownerId
    const updatedCrop = {
      ...formUpdatedCrop,
      id: cropData.id,
      ownerId: cropData.ownerId,
    };

    // ✅ update global crops
    const allCrops = JSON.parse(localStorage.getItem("allCrops")) || [];
    const index = allCrops.findIndex((c) => c.id === updatedCrop.id);

    if (index !== -1) {
      allCrops[index] = updatedCrop;
      localStorage.setItem("allCrops", JSON.stringify(allCrops));
    }

    // ✅ update farmer crops storage
    if (updatedCrop.ownerId) {
      const farmerKey = `farmerCrops_${updatedCrop.ownerId}`;
      const farmerCrops = JSON.parse(localStorage.getItem(farmerKey)) || [];
      const fIndex = farmerCrops.findIndex((c) => c.id === updatedCrop.id);

      if (fIndex !== -1) {
        farmerCrops[fIndex] = updatedCrop;
        localStorage.setItem(farmerKey, JSON.stringify(farmerCrops));
      }
    }

    // ✅ Force refresh of Addcrop.jsx
    window.dispatchEvent(new Event("cropsUpdated"));

    alert("✅ Crop updated successfully!");
    navigate("/addcrop");
  };

  if (!cropData) {
    return <p>Loading...</p>;
  }

  return (
    <div className="edit-crop-page">
      <h2>Edit Crop</h2>
      <Addcropform
        editCrop={cropData}
        onSubmit={handleUpdate}
      />
    </div>
  );
};

export default EditCropCard;
