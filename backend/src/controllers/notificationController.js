const User = require("../models/User");

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const EXPO_MAX_BATCH_SIZE = 100;

const chunk = (list, size) => {
  const batches = [];
  for (let index = 0; index < list.length; index += size) {
    batches.push(list.slice(index, index + size));
  }
  return batches;
};

const sendExpoBatch = async (messages) => {
  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(messages)
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Expo push failed (${response.status}): ${responseText}`);
  }

  return response.json();
};

const broadcastNotification = async (req, res) => {
  try {
    const title = String(req.body?.title || "FactoResearch").trim() || "FactoResearch";
    const body = String(req.body?.body || "").trim();
    const data = req.body?.data && typeof req.body.data === "object" ? req.body.data : {};

    if (!body) {
      return res.status(400).json({ message: "body is required" });
    }

    const users = await User.find({ pushTokens: { $exists: true, $ne: [] } }).select("pushTokens email");
    const tokens = [...new Set(users.flatMap((user) => user.pushTokens || []).filter(Boolean))];

    if (!tokens.length) {
      return res.json({
        message: "No registered push tokens found. Ask users to login on the latest app build first.",
        requestedCount: 0,
        deliveredTicketCount: 0,
        tickets: []
      });
    }

    const messages = tokens.map((pushToken) => ({
      to: pushToken,
      sound: "default",
      title,
      body,
      data
    }));

    const batches = chunk(messages, EXPO_MAX_BATCH_SIZE);
    const ticketResults = [];

    for (const batch of batches) {
      const result = await sendExpoBatch(batch);
      const tickets = Array.isArray(result?.data) ? result.data : [];
      ticketResults.push(...tickets);
    }

    return res.json({
      message: "Broadcast request sent to Expo",
      requestedCount: tokens.length,
      deliveredTicketCount: ticketResults.length,
      tickets: ticketResults
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to broadcast notification" });
  }
};

module.exports = {
  broadcastNotification
};
