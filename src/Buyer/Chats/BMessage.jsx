import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { selectAllCrops } from "../../Redux/Slices/cropSlice";
import {
  appendChatMessage,
  hydrateChat,
  selectChatMessages,
  setChatMessages
} from "../../Redux/Slices/chatSlice";

const BMessage = () => {
  const { cropId } = useParams();
  const dispatch = useDispatch();

  const buyer = useSelector((state) => state.auth.user);
  const allCrops = useSelector(selectAllCrops);

  const [crop, setCrop] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [input, setInput] = useState("");
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [chatKey, setChatKey] = useState("");

  const messages = useSelector((state) => selectChatMessages(state, chatKey));
  const decisionTaken = messages.some(
    (m) => m.text === "Proceed Deal" || m.text === "Cancel Deal"
  );

  useEffect(() => {
    if (!buyer) return;

    const found = allCrops.find((c) => String(c.id) === String(cropId));
    if (!found) return;

    setCrop(found);

    const farmerInfo = {
      id: found.farmerId || found.ownerId,
      name: found.farmerName || found.farmer || found.ownerName || "Farmer"
    };
    setFarmer(farmerInfo);

    const ended = Date.now() >= found.auctionEndTime;
    setAuctionEnded(ended);

    const sorted = [...(found.bidders || [])].sort(
      (a, b) => (b.price || b.bidPrice) - (a.price || a.bidPrice)
    );

    const winner = sorted[0];
    const buyerWon = winner?.userId === buyer.id;
    setIsWinner(buyerWon);

    if (!buyerWon) {
      setChatKey("");
      return;
    }

    setChatKey(`chat_${found.id}_${farmerInfo.id}_${buyer.id}`);
  }, [cropId, buyer, allCrops]);

  useEffect(() => {
    if (!chatKey) return;
    dispatch(hydrateChat({ key: chatKey }));
  }, [chatKey, dispatch]);

  useEffect(() => {
    if (!chatKey || !auctionEnded || !isWinner) return;
    if (messages.length > 0) return;

    const autoMsg = {
      sender: "farmer",
      text: "Congrats on winning! Here are my contact details.",
      time: Date.now(),
      system: true
    };

    dispatch(setChatMessages({ key: chatKey, messages: [autoMsg] }));
  }, [chatKey, auctionEnded, isWinner, messages.length, dispatch]);

  const sendMessage = (text) => {
    if (!text.trim() || !auctionEnded || !isWinner || !chatKey) return;

    dispatch(
      appendChatMessage({
        key: chatKey,
        message: { sender: "buyer", text, time: Date.now() }
      })
    );
    setInput("");
  };

  const sendDecision = (text) => {
    if (decisionTaken) return;
    sendMessage(text);
  };

  if (!crop || !farmer) {
    return <div className="w-full p-6 text-center font-semibold">Loading chat...</div>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 h-[80vh] flex flex-col justify-center border border-gray-300 rounded-[10px] pb-5">
      <div className="p-4 rounded-t-lg border-gray-300 bg-emerald-600">
        <span className="flex items-center font-semibold text-white">
          <div className="border bg-yellow-500 border-none rounded-full px-2 py-1 font-bold text-yellow-100">
            {farmer.name.split(" ").map((w) => w[0]).join("")}
          </div>
          &nbsp; {farmer.name}
        </span>
      </div>

      <div className="flex-1 p-4 bg-[#49361c] overflow-y-auto">
        {auctionEnded && isWinner ? (
          messages.map((m, i) => (
            <div
              key={i}
              className={[
                "mb-2.5 flex",
                m.sender === "buyer" ? "justify-end" : "justify-start",
              ].join(" ")}
            >
              <span
                className={[
                  "px-3 py-2 rounded-[10px] inline-block max-w-[70%] text-white font-semibold",
                  m.sender === "buyer" ? "bg-[#a57c14]" : "bg-[#66481e]",
                ].join(" ")}
              >
                {m.text}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center mt-10 text-white/90 font-semibold">
            Chat is locked until auction ends
          </div>
        )}
      </div>

      {auctionEnded && isWinner && !decisionTaken && (
        <div className="p-2.5 border-t border-gray-300 flex justify-center gap-2.5 bg-[#49361c]">
          <button
            onClick={() => sendDecision("Proceed Deal")}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
          >
            Proceed Deal
          </button>
          <button
            onClick={() => sendDecision("Cancel Deal")}
            className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
          >
            Cancel Deal
          </button>
        </div>
      )}

      <div className="p-2.5 flex gap-5 justify-center bg-[#49361c]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!auctionEnded || !isWinner}
          placeholder="Type a message"
          className="flex-1 w-full px-3 py-3 bg-[#66481e] rounded-xl text-white font-semibold outline-none disabled:opacity-60"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!auctionEnded || !isWinner}
          className="rounded-xl bg-yellow-600 px-4 py-1 text-white font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default BMessage;


