
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Addcropform.css";

const Addcropform = ({ editCrop }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "kg",
    basePrice: "",
    priceUnit: "per kg",
    images: ["", "", "", ""],
    harvestDate: "",
    cropCondition: "",
    state: "",
    city: "",
    address: "",
    temperature: "",
    description: "",
    auctionDuration: "",
    auctionUnit: "hours",
  });

  const [errors, setErrors] = useState({});

  const getInputClass = (name) => {
    if (!form[name]) return "";
    return errors[name] ? "error" : "valid";
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  const validators = {
    name: (v) =>
      !v?.trim()
        ? "Name is required!"
        : v.length < 3
        ? "Name must be at least 3 characters!"
        : /^[a-zA-Z\s]+$/.test(v)
        ? ""
        : "Name must contain only letters!",
    category: (v) => (!v ? "Category is required!" : ""),
    quantity: (v) =>
      !v
        ? "Quantity is required!"
        : /^\d+(\.\d+)?$/.test(v)
        ? parseFloat(v) > 0
          ? ""
          : "Quantity must be greater than 0!"
        : "Quantity must be a number!",
    basePrice: (v) =>
      !v
        ? "Base Price is required!"
        : /^\d+(\.\d+)?$/.test(v)
        ? parseFloat(v) > 0
          ? ""
          : "Base Price must be greater than 0!"
        : "Base Price must be a number!",
    harvestDate: (v) => (!v ? "Harvest date is required!" : ""),
    cropCondition: (v) => (!v ? "Crop condition is required!" : ""),
    images: (arr) =>
      !Array.isArray(arr) || arr.length < 4 || arr.some((img) => !img)
        ? "All 4 images are required!"
        : "",
    state: (v) =>
      !v?.trim()
        ? "State is required!"
        : /^[a-zA-Z\s]+$/.test(v)
        ? ""
        : "State must contain only letters!",
    city: (v) =>
      !v?.trim()
        ? "City is required!"
        : /^[a-zA-Z\s]+$/.test(v)
        ? ""
        : "City must contain only letters!",
    address: (v) => (!v?.trim() ? "Address is required!" : ""),
    temperature: (v) =>
      !v?.trim()
        ? "Temperature is required!"
        : /^\d+(\.\d+)?$/.test(v)
        ? ""
        : "Temperature must be a number!",
    description: (v) =>
      !v?.trim()
        ? "Description is required!"
        : v.length < 10
        ? "Description must be at least 10 characters!"
        : "",
    auctionDuration: (v) =>
      !String(v).trim()
        ? "Auction duration is required!"
        : /^\d+(\.\d+)?$/.test(String(v))
        ? parseFloat(v) > 0
          ? ""
          : "Duration must be greater than 0!"
        : "Duration must be a number!",
  };

  // Load data for edit
  useEffect(() => {
  if (!editCrop) return;

  let durationValue = "";
  let durationUnit = "hours";

  if (editCrop.auctionDurationMs) {
    const hours = editCrop.auctionDurationMs / (60 * 60 * 1000);
    if (hours >= 1) {
      durationValue = hours;
      durationUnit = "hours";
    } else {
      durationValue = Math.round(editCrop.auctionDurationMs / (60 * 1000));
      durationUnit = "minutes";
    }
  }

  setForm({
    ...editCrop,
    images: editCrop.images?.length === 4 ? editCrop.images : ["", "", "", ""],
    auctionDuration: durationValue,
    auctionUnit: editCrop.auctionUnit || durationUnit,
  });

  setErrors({});
}, [editCrop]);



const handleChange = (e) => {
  let { name, value } = e.target;

  // Only allow numbers & dot for specific fields
  if (["quantity", "basePrice", "auctionDuration", "temperature"].includes(name)) {
    value = value.replace(/[^0-9.]/g, "");
  }

  setForm((prev) => ({ ...prev, [name]: value }));

  if (validators[name]) {
    setErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
  }
};


  const handleImageChange = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const newImages = [...form.images];
    newImages[index] = base64;
    setForm((prev) => ({ ...prev, images: newImages }));
    setErrors((prev) => ({ ...prev, images: validators.images(newImages) }));
  };

const handleSubmit = (e) => {
  e.preventDefault();

  // Validate all fields
  const newErrors = {};
  Object.keys(validators).forEach((key) => {
    newErrors[key] =
      key === "images" ? validators.images(form.images) : validators[key](form[key]);
  });
  setErrors(newErrors);
  if (Object.values(newErrors).some((err) => err)) return;

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser || !loggedInUser.id) {
    alert("Please login again");
    return;
  }

  const ownerId = loggedInUser.id;
  const ownerName = `${loggedInUser.fname} ${loggedInUser.lname}`;

  const durationMs =
    form.auctionUnit === "hours"
      ? parseFloat(form.auctionDuration) * 60 * 60 * 1000
      : parseFloat(form.auctionDuration) * 60 * 1000;

  const STORAGE_KEY = `farmerCrops_${ownerId}`;
  let crops = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let allCrops = JSON.parse(localStorage.getItem("allCrops")) || [];

if (editCrop) {
  crops = crops.map((c) => {
    if (c.id !== editCrop.id) return c;

   const now = Date.now();
const prevStart =
  typeof c.auctionStartTime === "number" ? c.auctionStartTime : null;
const prevEnd =
  typeof c.auctionEndTime === "number" ? c.auctionEndTime : null;

let auctionStartTime = prevStart;
let auctionEndTime = prevEnd;

// 🟢 AUCTION RUNNING → recalc remaining time
// 🟢 AUCTION RUNNING → reset from NOW using new duration
if (prevStart && prevEnd && now < prevEnd) {
  auctionStartTime = prevStart; // never touch
  auctionEndTime = now + durationMs;
}


// 🔴 AUCTION NOT STARTED
if (typeof prevStart !== "number") {
  auctionStartTime = null;
  auctionEndTime = null;
}

// 🟡 STATUS
let auctionStatus = "Not Started";
if (auctionStartTime && auctionEndTime) {
  auctionStatus = now < auctionEndTime ? "Running" : "Ended";
}


    return {
      ...c,

      // ✅ update ONLY editable crop fields
      name: form.name,
      category: form.category,
      quantity: form.quantity,
      unit: form.unit,
      basePrice: form.basePrice,
      priceUnit: form.priceUnit,
      images: form.images,
      harvestDate: form.harvestDate,
      cropCondition: form.cropCondition,
      state: form.state,
      city: form.city,
      address: form.address,
      temperature: form.temperature,
      description: form.description,
      auctionUnit: form.auctionUnit,

      // ✅ auction fields (never from form)
      auctionDurationMs: durationMs,
      auctionStartTime,
      auctionEndTime,
      auctionStatus,
    };
  });

  allCrops = allCrops.map((c) =>
    c.id === editCrop.id ? crops.find((cc) => cc.id === c.id) : c
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(crops));
  localStorage.setItem("allCrops", JSON.stringify(allCrops));

  window.dispatchEvent(new Event("cropsUpdated"));
  alert("Crop updated successfully!");
  navigate("/myaddedcrops");
  return;
}







  // New crop
  const newCrop = {
    ...form,
    id: Date.now(),
    auctionDurationMs: durationMs,
    ownerId,
    ownerName,
    auctionStartTime: null,
    auctionEndTime: null,
    auctionStatus: "Not Started",
    bidders: form.bidders || [],
  };

  crops.push(newCrop);
  allCrops.push(newCrop);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(crops));
  localStorage.setItem("allCrops", JSON.stringify(allCrops));

  window.dispatchEvent(new Event("cropsUpdated"));
  alert("Crop added successfully!");
  navigate("/myaddedcrops");
};



  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        {/* Left Column */}
        <div className="col1">
          {/* Name */}
          <div className="field">
            <label>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={getInputClass("name")}
            />
            <p className="errorMsg">{errors.name}</p>
          </div>

          {/* Category */}
          <div className="field">
            <label>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={getInputClass("category")}
            >
              <option value="">Select Category</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="cereals">Cereals</option>
              <option value="pulses">Pulses</option>
              <option value="oilseeds">Oilseeds</option>
              <option value="spices">Spices</option>
              <option value="leafy_greens">Leafy Greens</option>
              <option value="nuts">Nuts</option>
              <option value="flowers">Flowers</option>
              <option value="others">Others</option>
            </select>
            <p className="errorMsg">{errors.category}</p>
          </div>

          {/* Quantity & Unit */}
          <div className="field">
            <label>Quantity</label>
            <input
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              className={getInputClass("quantity")}
            />
            <select name="unit" value={form.unit} onChange={handleChange}>
              <option value="kg">kg</option>
              <option value="quintal">Quintal</option>
              <option value="ton">Ton</option>
              <option value="grams">Grams</option>
              <option value="pieces">Pieces</option>
              <option value="bunch">Bunch</option>
              <option value="bag">Bag</option>
              <option value="crate">Crate</option>
            </select>
            <p className="errorMsg">{errors.quantity}</p>
          </div>

          {/* Base Price */}
          <div className="field">
            <label>Base Price</label>
            <input
              name="basePrice"
              value={form.basePrice}
              onChange={handleChange}
              className={getInputClass("basePrice")}
            />
            <select name="priceUnit" value={form.priceUnit} onChange={handleChange}>
              <option value="per kg">per kg</option>
              <option value="per quintal">per quintal</option>
              <option value="per ton">per ton</option>
              <option value="per bag">per bag</option>
              <option value="per piece">per piece</option>
            </select>
            <p className="errorMsg">{errors.basePrice}</p>
          </div>

          {/* Images */}
          {[0, 1, 2, 3].map((i) => (
            <div className="field" key={i}>
              <label>{i === 0 ? "Main Crop Image" : `Condition Image ${i}`}</label>
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, i)} />
              {form.images[i] && (
                <img
                  src={form.images[i]}
                  alt={`preview-${i}`}
                  style={{ width: 120, height: 90, marginTop: 6, objectFit: "cover" }}
                />
              )}
            </div>
          ))}
          <p className="errorMsg">{errors.images}</p>
        </div>

        {/* Right Column */}
        <div className="col2">
          {/* Harvest Date */}
          <div className="field">
            <label>Harvest Date</label>
            <input
              type="date"
              name="harvestDate"
              value={form.harvestDate}
              onChange={handleChange}
              className={getInputClass("harvestDate")}
            />
            <p className="errorMsg">{errors.harvestDate}</p>
          </div>

          {/* Crop Condition */}
          <div className="field">
            <label>Crop Condition</label>
            <select
              name="cropCondition"
              value={form.cropCondition}
              onChange={handleChange}
              className={getInputClass("cropCondition")}
            >
              <option value="">Select Condition</option>
              <option value="fresh">Fresh</option>
              <option value="semi_dry">Semi-dry</option>
              <option value="dry">Dry</option>
              <option value="stored">Stored (Old Stock)</option>
              <option value="organic">Organic (Chemical-free)</option>
              <option value="harvested_today">Harvested Today</option>
              <option value="cold_storage">Cold Storage</option>
            </select>
            <p className="errorMsg">{errors.cropCondition}</p>
          </div>

          {/* State, City, Address, Temperature */}
          {["state", "city", "address", "temperature"].map((f) => (
            <div className="field" key={f}>
              <label>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
              {f === "address" ? (
                <textarea
                  name={f}
                  value={form[f]}
                  onChange={handleChange}
                  className={getInputClass(f)}
                />
              ) : (
                <input name={f} value={form[f]} onChange={handleChange} className={getInputClass(f)} />
              )}
              <p className="errorMsg">{errors[f]}</p>
            </div>
          ))}

          {/* Auction Duration */}
          <div className="field">
            <label>Auction Duration</label>
            <input
              type="number"
              name="auctionDuration"
              value={form.auctionDuration}
              onChange={handleChange}
              min={1}
              className={getInputClass("auctionDuration")}
            />
            <select name="auctionUnit" value={form.auctionUnit} onChange={handleChange}>
              <option value="hours">Hours</option>
              <option value="minutes">Minutes</option>
            </select>
            <p className="errorMsg">{errors.auctionDuration}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="field">
        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className={getInputClass("description")}
        />
        <p className="errorMsg">{errors.description}</p>
      </div>

      <div className="submit">
        <button type="submit">{editCrop ? "Update Crop" : "Add Crop"}</button>
      </div>
    </form>
  );
};

export default Addcropform;




































 