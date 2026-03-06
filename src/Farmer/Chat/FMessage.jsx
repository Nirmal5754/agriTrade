import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";

const FMessage = () => {
  const { cropId } = useParams();
  const location = useLocation();

  const passedWinner = location.state?.winner;
  const farmer = JSON.parse(localStorage.getItem("loggedInUser"));

  const [crop, setCrop] = useState(null);
  const [winner, setWinner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [auctionEnded, setAuctionEnded] = useState(false);

  /* =========================
     LOAD CROP + WINNER (SAFE)
     ========================= */
  useEffect(() => {
    const allCrops =
      JSON.parse(localStorage.getItem("allCrops")) || [];

    const found = allCrops.find(
      (c) => String(c.id) === String(cropId)
    );
    if (!found) return;

    setCrop(found);

    const ended = Date.now() >= found.auctionEndTime;
    setAuctionEnded(ended);

    if (ended) {
      const sorted = [...(found.bidders || [])].sort(
        (a, b) =>
          (b.price || b.bidPrice) -
          (a.price || a.bidPrice)
      );
      setWinner(passedWinner || sorted[0] || null);
    }
  }, [cropId, passedWinner]);

  /* =========================
     LOAD CHAT
     ========================= */
  useEffect(() => {
    if (!crop || !winner || !farmer) return;

    const CHAT_KEY = `chat_${crop.id}_${farmer.id}_${winner.userId}`;

    const reloadChat = () => {
      const saved =
        JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
      setMessages(saved);
    };

    reloadChat();
    window.addEventListener("chatUpdated", reloadChat);

    return () =>
      window.removeEventListener("chatUpdated", reloadChat);
  }, [crop, winner, farmer]);

  const sendMessage = () => {
    if (!text.trim() || !crop || !winner) return;

    const CHAT_KEY = `chat_${crop.id}_${farmer.id}_${winner.userId}`;

    const updated = [
      ...messages,
      { sender: "farmer", text: text.trim(), time: Date.now() }
    ];

    setMessages(updated);
    setText("");
    localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("chatUpdated"));
  };

  if (!crop || !winner) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        Loading chat...
      </div>
    );
  }

  if (!auctionEnded) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        🔒 Chat is available only after auction ends
      </div>
    );
  }

  return (
    <div
      style={{
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #ccc",
        borderRadius: 10
      }}
    >
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid #ccc",
          fontWeight: "bold"
        }}
      >
        Chat with Buyer — {winner.userName || winner.name}
      </div>

      <div
        style={{
          flex: 1,
          padding: 15,
          background: "#f5f5f5",
          overflowY: "auto"
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign:
                m.sender === "farmer" ? "right" : "left",
              marginBottom: 10
            }}
            className="mt-3"
          >
            <span
              style={{
              
                borderRadius: 10,
                background:
                  m.sender === "farmer" ? "#dcf8c6" : "#fff",
                border: "1px solid #ccc"
              }}
     className="p-3 m-3"
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 10,
          borderTop: "1px solid #ccc",
          display: "flex",
          gap: 10
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={sendMessage} className="bg-green-600 rounded-lg p-2 font-semibold text-white">Send</button>
      </div>
    </div>
  );
};

export default FMessage;
