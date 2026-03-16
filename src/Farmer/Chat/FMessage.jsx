import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation } from "react-router-dom";
import { selectAllCrops } from "../../Redux/Slices/cropSlice";
import { appendChatMessage, hydrateChat, selectChatMessages } from "../../Redux/Slices/chatSlice";

const FMessage = () => {
  const { cropId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();

  const passedWinner = location.state?.winner;
  const farmer = useSelector((state) => state.auth.user);
  const allCrops = useSelector(selectAllCrops);

  const [crop, setCrop] = useState(null);
  const [winner, setWinner] = useState(null);
  const [text, setText] = useState("");
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [chatKey, setChatKey] = useState("");

  const messages = useSelector((state) => selectChatMessages(state, chatKey));

  useEffect(() => {
    if (!farmer) return;

    const found = allCrops.find((c) => String(c.id) === String(cropId));
    if (!found) return;

    setCrop(found);

    const ended = Date.now() >= found.auctionEndTime;
    setAuctionEnded(ended);

    if (!ended) {
      setWinner(null);
      setChatKey("");
      return;
    }

    const sorted = [...(found.bidders || [])].sort(
      (a, b) => (b.price || b.bidPrice) - (a.price || a.bidPrice)
    );
    const resolvedWinner = passedWinner || sorted[0] || null;
    setWinner(resolvedWinner);

    if (resolvedWinner?.userId) {
      setChatKey(`chat_${found.id}_${farmer.id}_${resolvedWinner.userId}`);
    } else {
      setChatKey("");
    }
  }, [cropId, passedWinner, farmer, allCrops]);

  useEffect(() => {
    if (!chatKey) return;
    dispatch(hydrateChat({ key: chatKey }));
  }, [chatKey, dispatch]);

  const sendMessage = () => {
    if (!text.trim() || !chatKey) return;

    dispatch(
      appendChatMessage({
        key: chatKey,
        message: { sender: "farmer", text: text.trim(), time: Date.now() }
      })
    );
    setText("");
  };

  if (!crop || !winner)
    return (
      <div className="w-full p-5 text-center font-semibold text-neutral-700">
        Loading chat...
      </div>
    );
  if (!auctionEnded)
    return (
      <div className="w-full p-5 text-center font-semibold text-neutral-700">
        Chat is available only after auction ends
      </div>
    );

  const buyerName = winner.userName || winner.name || "Buyer";
  const buyerInitials = buyerName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div
      className="w-full max-w-3xl mx-auto px-4 sm:px-6 h-[80vh] flex flex-col justify-center border border-gray-300 rounded-[10px] pb-5"
    >
      <div className="p-4 rounded-t-lg border-gray-300 bg-emerald-600">
        <span className="flex items-center font-semibold text-white">
          <div className="border bg-yellow-500 border-none rounded-full px-2 py-1 font-bold text-yellow-100">
            {buyerInitials}
          </div>
          &nbsp; {buyerName}
        </span>
      </div>

      <div className="flex-1 p-4 bg-[#49361c] overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={[
              "mb-2.5 flex",
              m.sender === "farmer" ? "justify-end" : "justify-start",
            ].join(" ")}
          >
            <span
              className={[
                "px-3 py-2 rounded-[10px] inline-block max-w-[70%] text-white font-semibold",
                m.sender === "farmer" ? "bg-[#a57c14]" : "bg-[#66481e]",
              ].join(" ")}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <div className="p-2.5 flex gap-5 justify-center bg-[#49361c]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          className="flex-1 w-full px-3 py-3 bg-[#66481e] rounded-xl text-white font-semibold outline-none"
        />
        <button onClick={sendMessage} className="rounded-xl bg-yellow-600 px-4 py-1 text-white font-semibold">
          Send
        </button>
      </div>
    </div>
  );
};

export default FMessage;

