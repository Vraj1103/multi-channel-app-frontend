const apiBase = "https://multi-channel-app.onrender.com/messages";
const smsApi = "https://multi-channel-app.onrender.com/twilio/send-sms";
const whatsappApi =
  "https://multi-channel-app.onrender.com/whatsapp/send-whatsapp-message";

let activeChannel = "slack";

// Switch channel
function switchChannel(channel) {
  activeChannel = channel;
  document.getElementById("channel-title").textContent = `${
    channel.charAt(0).toUpperCase() + channel.slice(1)
  } Chat`;
  fetchMessages();
}

// Fetch messages (polling)
async function fetchMessages() {
  const response = await fetch(`${apiBase}/${activeChannel}/messages`);
  const messagesContainer = document.getElementById("messages");
  messagesContainer.innerHTML = ""; // Clear current messages
  let lastDate = null;
  if (response.ok) {
    const data = await response.json();
    console.log(data); // Debug: Log the API response

    const messages = data.messages;
    if (!Array.isArray(messages)) {
      throw new Error("Expected 'messages' to be an array");
    }

    for (const msg of messages) {
      //   convert timestamp to human readable format, 2 formats are there (1734886941.352559,2024-12-22T17:05:44+00:00)
      let timestamp = msg.timestamp;
      let date;
      if (timestamp.includes("T")) {
        const dateObj = new Date(timestamp);
        date = dateObj.toLocaleDateString();
        timestamp = new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        const dateObj = new Date(Number.parseInt(timestamp) * 1000);
        date = dateObj.toLocaleDateString();
        timestamp = new Date(
          Number.parseInt(timestamp) * 1000
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      if (lastDate !== date) {
        const dateElement = document.createElement("div");
        dateElement.className = "date-header";
        dateElement.textContent = date;
        messagesContainer.appendChild(dateElement);
        lastDate = date;
      }

      const messageElement = document.createElement("div");
      messageElement.className = "message";
      messageElement.classList.add(
        msg.user === "Demo app" || msg.user === "BOT"
          ? "bot-message"
          : "user-message"
      );
      messageElement.innerHTML = ` <span class ="name">${msg.user}</span> ${msg.text} <span class="timestamp">${timestamp}</span>`;
      messagesContainer.appendChild(messageElement);
    }
  } else {
    messagesContainer.innerHTML = "<p>Failed to load messages.</p>";
  }
}

// Send message
async function sendMessage() {
  const input = document.getElementById("message-input");
  const text = input.value.trim();
  if (!text) return;

  let apiUrl = `${apiBase}/send-message`;
  let data = { text };

  if (activeChannel === "sms") {
    apiUrl = smsApi;
    data = { to: "+917990497212", body: text };
  } else if (activeChannel === "whatsapp") {
    apiUrl = whatsappApi;
    data = { to: "whatsapp:+917990497212", body: text };
  } else {
    data = { channel_id: "D086SPYJ0AC", text };
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    input.value = ""; // Clear input box
    fetchMessages(); // Refresh messages
  } else {
    alert("Failed to send message.");
  }
}

// Polling every 10 seconds
setInterval(fetchMessages, 10000);

// Initial load
fetchMessages();
