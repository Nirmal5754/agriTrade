
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// import "./Addcropform.css";
import { useDispatch, useSelector, useStore } from "react-redux";
import { addCrop, updateCrop } from "../../Redux/Slices/cropSlice";
import { toast } from "../../ui/toast";
import { supabase } from "../../supabaseClient";

// useSelector useDispatch 



const Addcropform = ({ editCrop }) => {
  const navigate = useNavigate();
const dispatch = useDispatch();
const store = useStore();
const user = useSelector((state) => state.auth.user);
const reduxCrops = useSelector((state) => state.crops.allCrops);
const persistError = useSelector((state) => state.crops.persistError);
const lastPersistMsgRef = useRef(null);
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

  // localStorage quota is small (~5MB). Base64 images fill it quickly.
  // We compress and downscale images before saving to keep the app stable.
  const compressImageToDataUrl = async (file, opts = {}) => {
    const { maxDim = 720, quality = 0.7 } = opts;
    if (!file || !file.type?.startsWith("image/")) {
      throw new Error("Please select an image file.");
    }

    // Basic guard: very large originals are likely to exceed quota even after compression.
    if (file.size > 8 * 1024 * 1024) {
      throw new Error("Image too large. Please choose an image under 8MB.");
    }

    // Prefer createImageBitmap (faster), fallback to Image() for older browsers.
    let source = null;
    try {
      if (typeof createImageBitmap === "function") {
        source = await createImageBitmap(file);
      }
    } catch {
      source = null;
    }

    if (!source) {
      const url = URL.createObjectURL(file);
      try {
        source = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Failed to load image."));
          img.src = url;
        });
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    const srcW = source.width;
    const srcH = source.height;
    const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
    const dstW = Math.max(1, Math.round(srcW * scale));
    const dstH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement("canvas");
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas not supported.");

    ctx.drawImage(source, 0, 0, dstW, dstH);

    // Cleanup bitmap if we used it.
    if (source && typeof source.close === "function") source.close();

    return canvas.toDataURL("image/jpeg", quality);
  };

  useEffect(() => {
    if (!persistError?.message) return;
    if (lastPersistMsgRef.current === persistError.message) return;
    lastPersistMsgRef.current = persistError.message;

    if (persistError.type === "quota") {
      toast.error(
        "Storage full (localStorage limit). Please delete some crops or use smaller images."
      );
    } else {
      toast.error("Failed to save crops. Please try again.");
    }
  }, [persistError]);

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

  // Only allow numbers & dot for specific field  text-white  mt-20s
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
    let base64 = "";
    try {
      base64 = await compressImageToDataUrl(file, { maxDim: 720, quality: 0.7 });
    } catch (err) {
      toast.error(err?.message || "Failed to process image.");
      return;
    }
    const newImages = [...form.images];
    newImages[index] = base64;
    setForm((prev) => ({ ...prev, images: newImages }));
    setErrors((prev) => ({ ...prev, images: validators.images(newImages) }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate all field  text-white  mt-20s
  const newErrors = {};
  Object.keys(validators).forEach((key) => {
    newErrors[key] =
      key === "images" ? validators.images(form.images) : validators[key](form[key]);
  });
  setErrors(newErrors);
  if (Object.values(newErrors).some((err) => err)) return;

 if (!user || !user.id) {
  toast.error("Please login again");
  return;
}

const ownerId = user.id;
const ownerName = `${user.fname} ${user.lname}`;

  const durationMs =
    form.auctionUnit === "hours"
      ? parseFloat(form.auctionDuration) * 60 * 60 * 1000
      : parseFloat(form.auctionDuration) * 60 * 1000;

  // const STORAGE_KEY = `farmerCrops_${ownerId}`;
  let crops = reduxCrops.filter((c) => c.ownerId === ownerId);

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

// AUCTION RUNNING -> reset from NOW using new duration
if (prevStart && prevEnd && now < prevEnd) {
  auctionStartTime = prevStart; // never touch
  auctionEndTime = now + durationMs;
}


// AUCTION NOT STARTED
if (typeof prevStart !== "number") {
  auctionStartTime = null;
  auctionEndTime = null;
}

// STATUS
let auctionStatus = "Not Started";
if (auctionStartTime && auctionEndTime) {
  auctionStatus = now < auctionEndTime ? "Running" : "Ended";
}


    return {
      ...c,

      // Update ONLY editable crop field  text-white  mt-20s
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

      // Auction field  text-white  mt-20s (never from form)
      auctionDurationMs: durationMs,
      auctionStartTime,
      auctionEndTime,
      auctionStatus,
    };
  });

 const updatedAllCrops = reduxCrops.map((c) =>
    c.id === editCrop.id ? crops.find((cc) => cc.id === c.id) : c
  );

 const updatedCrop = updatedAllCrops.find(c => c.id === editCrop.id);

dispatch(updateCrop(updatedCrop));
{
  const after = store.getState()?.crops?.persistError;
  if (!after) {
    toast.success("Crop updated successfully!");
    navigate("/myaddedcrops");
  }
}
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

{
  const before = store.getState()?.crops?.persistError;
  dispatch(addCrop(newCrop));
  const after = store.getState()?.crops?.persistError;
  // If persist failed, an error toast will show via the persistError effect.
  if (!after || after === before) {
    // Supabase test write (no images; keeps localStorage schema untouched)
    try {
      const payload = {
        local_id: newCrop.id,
        owner_id: ownerId,
        owner_name: ownerName,
        name: newCrop.name,
        category: newCrop.category,
        quantity: Number(newCrop.quantity),
        unit: newCrop.unit,
        base_price: Number(newCrop.basePrice),
        price_unit: newCrop.priceUnit,
        harvest_date: newCrop.harvestDate || null,
        crop_condition: newCrop.cropCondition || null,
        state: newCrop.state || null,
        city: newCrop.city || null,
        address: newCrop.address || null,
        temperature: newCrop.temperature ? Number(newCrop.temperature) : null,
        description: newCrop.description || null,
        auction_duration_ms: newCrop.auctionDurationMs,
      };

      const { error } = await supabase.from("crops_test").insert([payload]);
      if (error) {
        toast.error(`Supabase save failed: ${error.message}`);
      } else {
        toast.success("Saved to Supabase (test)");
      }
    } catch (err) {
      toast.error("Supabase save failed (check .env keys)");
    }

    toast.success("Crop added successfully!");
    navigate("/myaddedcrops");
  }
}
};



  return (
    <div className="flex flex-col h-full w-full justify-center items-center bg-slate-500 text-green-900">
     <h1 className="font-extrabold text-white mb-10 text-6xl mt-10" >Add Crop</h1>  
     <form onSubmit={handleSubmit} className="">
      
      <div className="row flex gap-30">
        {/* Left Column */}
        <div className="col1">
          {/* Name */}
          <div className="field  text-white  mt-20">
            <label className="font-semibold text-white">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`${getInputClass("name")} bg-white rounded-md outline outline-3 outline-black-900 ml-4 px-3 py-1 `}
            />
            <p className="errorMsg text-red-200">{errors.name}</p>
          </div>

          {/* Category */}
          <div className="field  text-white  mt-20">
             <label className="font-semibold text-white">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={`${getInputClass("category")} font-semibold text-green-900 px-3 py-1 bg-white rounded-md outline outline-3 outline-black-900 ml-4 `}
            >
              <option value="" className="font-semibold">Select Category</option>
              <option value="vegetables" className="font-semibold">Vegetables</option>
              <option value="fruits" className="font-semibold">Fruits</option>
              <option value="cereals" className="font-semibold">Cereals</option>
              <option value="pulses" className="font-semibold">Pulses</option>
              <option value="oilseeds" className="font-semibold">Oilseeds</option>
              <option value="spices" className="font-semibold">Spices</option>
              <option value="leafy_greens" className="font-semibold">Leafy Greens</option>
              <option value="nuts" className="font-semibold">Nuts</option>
              <option value="flowers" className="font-semibold">Flowers</option>
              <option value="others" className="font-semibold">Others</option>
            </select>
            <p className="errorMsg text-red-200">{errors.category}</p>
          </div>

          {/* Quantity & Unit */}
          <div className="field  text-white  mt-20">
            <label className="font-semibold text-white">Quantity</label>
            <input
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              className={`${getInputClass("quantity")}text-green-900 px-3 py-1 bg-white rounded-md outline outline-3 outline-black-900 ml-4 `}
            />
            <select name="unit" value={form.unit} onChange={handleChange} className="font-semibold  text-green-900 px-3 py-1 bg-white rounded-md outline outline-3 outline-black-900 ml-4">
              <option value="kg" className="font-semibold">kg</option>
              <option value="quintal" className="font-semibold">Quintal</option>
              <option value="ton" className="font-semibold">Ton</option>
              <option value="grams" className="font-semibold">Grams</option>
              <option value="pieces" className="font-semibold">Pieces</option>
              <option value="bunch" className="font-semibold">Bunch</option>
              <option value="bag" className="font-semibold">Bag</option>
              <option value="crate" className="font-semibold">Crate</option>
            </select>
            <p className="errorMsg text-red-200">{errors.quantity}</p>
          </div>

          {/* Base Price */}
          <div className="field  text-white  mt-20">
             <label className="font-semibold text-white">Base Price</label>
            <input
              name="basePrice"
              value={form.basePrice}
              onChange={handleChange}
              className={`${getInputClass("basePrice")}text-green-900 px-3 py-1 bg-white rounded-md outline outline-3 outline-black-900 ml-4 `}
            />
            <select name="priceUnit" value={form.priceUnit} onChange={handleChange} className=" font-semibold text-green-900 px-3 py-1 bg-white rounded-md outline outline-3 outline-black-900 ml-4">
              <option value="per kg" className="font-semibold">per kg</option>
              <option value="per quintal" className="font-semibold">per quintal</option>
              <option value="per ton" className="font-semibold">per ton</option>
              <option value="per bag" className="font-semibold">per bag</option>
              <option value="per piece" className="font-semibold">per piece</option>
            </select>
            <p className="errorMsg text-red-200">{errors.basePrice}</p>
          </div>

          {/* Images */}
          {[0, 1, 2, 3].map((i) => (
           <div className="field text-white mt-20" key={i}>
   <label className="font-semibold text-white">
    {i === 0 ? "Main Crop Image" : `Condition Image ${i}`}
  </label>

  <label className="ml-4 cursor-pointer bg-white text-green-700 font-semibold px-4  outline outline-1 outline-green-100 rounded-md inline-block">
    Choose File
    <input
      type="file"
      accept="image/*"
      onChange={(e) => handleImageChange(e, i)}
      className="hidden"
    />
  </label>

  {form.images[i] && (
    <img
      src={form.images[i]}
      alt={`preview-${i}`}
      className="w-[60px] h-[60px] mt-1.5 object-cover rounded-lg"
    />
  )}
</div>
          ))}
          <p className="errorMsg">{errors.images}</p>
       

        {/* Right Column */}
      
          {/* Harvest Date */}
          <div className="field  text-white  mt-20">
             <label className="font-semibold text-white">Harvest Date</label>
            <input
              type="date"
              name="harvestDate"
              value={form.harvestDate}
              onChange={handleChange}
              className={`${getInputClass("harvestDate")}font-semibold text-green-900 px-3 py-1 bg-white rounded-md outline outline-3 outline-black-900 ml-4`}
            />
            <p className="errorMsg">{errors.harvestDate}</p>
          </div>

          {/* Crop Condition */}
          <div className="field  text-white  mt-20">
             <label className="font-semibold text-white">Crop Condition</label>
            <select
              name="cropCondition"
              value={form.cropCondition}
              onChange={handleChange}
              className={`${getInputClass("cropCondition")}text-green-900 px-3 py-1 bg-white rounded-md outline font-semibold outline-3 outline-black-900 ml-4 `}
            >
              <option value="" className="font-semibold"
              >Select Condition</option>
              <option value="fresh" className="font-semibold">Fresh</option>
              <option value="semi_dry" className="font-semibold">Semi-dry</option>
              <option value="dry" className="font-semibold">Dry</option>
              <option value="stored" className="font-semibold">Stored (Old Stock)</option>
              <option value="organic" className="font-semibold">Organic (Chemical-free)</option>
              <option value="harvested_today" className="font-semibold">Harvested Today</option>
              <option value="cold_storage" className="font-semibold">Cold Storage</option>
            </select>
            <p className="errorMsg">{errors.cropCondition}</p>
          </div>
   </div>
  <div className="col2">
          {/* State, City, Address, Temperature */}
          {["state", "city", "address", "temperature"].map((f) => (
            <div className="field  text-white  mt-20" key={f}>
               <label className="font-semibold text-white">{f.charAt(0).toUpperCase() + f.slice(1)}</label>
              {f === "address" ? (
                <textarea
                  name={f}
                  value={form[f]}
                  onChange={handleChange}
                  className={`${getInputClass(f)}text-green-900 px-3 py-1 bg-white rounded-md outline outline-3 outline-black-900 ml-4 `}
                />
              ) : (
                <input name={f} value={form[f]} onChange={handleChange} className={`${getInputClass(f)}text-green-900 px-3 py-1 bg-white rounded-md outline outline-3 outline-black-900 ml-4 `} />
              )}
              <p className="errorMsg">{errors[f]}</p>
            </div>
          ))}
   <div className="field  text-white  mt-20">
             <label className="font-semibold text-white">Auction Duration</label>
            <input
              type="number"
              name="auctionDuration"
              value={form.auctionDuration}
              onChange={handleChange}
              min={1}
              className={`${getInputClass("auctionDuration")}text-green-900 px-3 py-1 bg-white rounded-md outline outline-3 outline-black-900 ml-4 `}
            />
            <select name="auctionUnit" value={form.auctionUnit} onChange={handleChange} className="font-semibold text-green-900 px-3 py-1 bg-white rounded-md outline outline-3 outline-black-900 ml-4">
              <option value="hours" className="font-semibold">Hours</option>
              <option value="minutes" className="font-semibold">Minutes</option>
            </select>
            <p className="errorMsg text-red-200">{errors.auctionDuration}</p>
          </div>
          {/* Auction Duration */}
     </div>
      
      </div>
  
      {/* Description */}
      <div className=" text-white  mt-20">
        <label className="font-semibold ">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className={`${getInputClass("description")}text-green-900 px-3 py-1 bg-white rounded-md outline outline-3 outline-black-900 ml-4 `}
        />
        <p className="errorMsg text-red-200">{errors.description}</p>
      </div>

      <div className="submit flex justify-center">
        <button type="submit" className="bg-amber-900 rounded-lg px-5 py-3 font-semibold text-white mt-20 mb-100 mx-auto"
        >{editCrop ? "Update Crop" : "Add Crop"}</button>
      </div>
    </form>
    </div>
 
    
  );
};

export default Addcropform;




































 

