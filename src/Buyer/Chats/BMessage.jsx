import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const BMessage = () => {
  const { cropId } = useParams();
  const buyer = JSON.parse(localStorage.getItem("loggedInUser"));

  const [crop, setCrop] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [decisionTaken, setDecisionTaken] = useState(false);

  /* ===== LOAD CROP + STATUS ===== */
  useEffect(() => {
    if (!buyer) return;

    const allCrops = JSON.parse(localStorage.getItem("allCrops")) || [];
    const found = allCrops.find(c => String(c.id) === cropId);
    if (!found) return;

    setCrop(found);

    const farmerInfo = {
      id: found.farmerId || found.ownerId,
      name:
        found.farmerName ||
        found.farmer ||
        found.ownerName ||
        "Farmer",
    };
    setFarmer(farmerInfo);

    const now = Date.now();
    const ended = now >= found.auctionEndTime;
    setAuctionEnded(ended);

    const sorted = [...(found.bidders || [])].sort(
      (a, b) => (b.price || b.bidPrice) - (a.price || a.bidPrice)
    );

    const winner = sorted[0];
    const buyerWon = winner?.userId === buyer.id;
    setIsWinner(buyerWon);

    if (!buyerWon) return;

    const CHAT_KEY = `chat_${found.id}_${farmerInfo.id}_${buyer.id}`;
    const saved = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];

    if (ended && saved.length === 0) {
      const autoMsg = {
        sender: "farmer",
        text: "Congrats on winning! Here are my contact details.",
        time: Date.now(),
        system: true,
      };
      localStorage.setItem(CHAT_KEY, JSON.stringify([autoMsg]));
      setMessages([autoMsg]);
    } else {
      setMessages(saved);
      setDecisionTaken(
        saved.some(
          m => m.text === "Proceed Deal" || m.text === "Cancel Deal"
        )
      );
    }
  }, [cropId, buyer]);

  /* ===== REAL-TIME SYNC ===== */
  useEffect(() => {
    if (!crop || !farmer || !buyer) return;

    const CHAT_KEY = `chat_${crop.id}_${farmer.id}_${buyer.id}`;

    const onStorageChange = (e) => {
      if (e.key === CHAT_KEY && e.newValue) {
        setMessages(JSON.parse(e.newValue));
      }
    };

    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, [crop, farmer, buyer]);

  /* ===== SEND MESSAGE ===== */
  const sendMessage = (text) => {
    if (!text.trim() || !auctionEnded || !isWinner) return;

    const CHAT_KEY = `chat_${crop.id}_${farmer.id}_${buyer.id}`;
    const updated = [
      ...messages,
      { sender: "buyer", text, time: Date.now() },
    ];

    setMessages(updated);
    setInput("");
    localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
  };

  /* ===== DEAL ACTION ===== */
  const sendDecision = (text) => {
    if (decisionTaken) return;
    sendMessage(text);
    setDecisionTaken(true);
  };

  if (!crop || !farmer) return null;

  return (
    <div
      style={{
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #ccc",
        borderRadius: 10,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid #ccc",
          fontWeight: "bold",
        }}
      >
        Chat with Farmer — {farmer.name}
      </div>

      {/* BODY (FIXED HEIGHT — NO SHRINK) */}
      <div
        style={{
          flex: 1,
          padding: 15,
          background: "#f5f5f5",
          overflowY: "auto",
        }}
      >
        {auctionEnded && isWinner ? (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                textAlign:
                  m.sender === "buyer" ? "right" : "left",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  background:
                    m.sender === "buyer" ? "#dcf8c6" : "#fff",
                  border: "1px solid #ccc",
                  display: "inline-block",
                  maxWidth: "70%",
                }}
              >
                {m.text}
              </span>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            🔒 Chat is locked until auction ends
          </div>
        )}
      </div>

      {/* DEAL BUTTONS */}
      {auctionEnded && isWinner && !decisionTaken && (
        <div
          style={{
            padding: 10,
            borderTop: "1px solid #ccc",
            display: "flex",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <button onClick={() => sendDecision("Proceed Deal")}>
            Proceed Deal
          </button>
          <button onClick={() => sendDecision("Cancel Deal")}>
            Cancel Deal
          </button>
        </div>
      )}

      {/* INPUT */}
      <div
        style={{
          padding: 10,
          borderTop: "1px solid #ccc",
          display: "flex",
          gap: 10,
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={!auctionEnded || !isWinner}
          placeholder="Type a message"
          style={{ flex: 1, padding: 8 }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!auctionEnded || !isWinner}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default BMessage;
