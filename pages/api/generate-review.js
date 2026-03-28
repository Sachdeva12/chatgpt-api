export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const {
      reason,
      impressions,
      comfort,
      improvements,
      durability,
      favorite,
      recommendation,
      final,
    } = req.body;

    const prompt = `
Write a natural, human-like product review using the following inputs:

Reason for purchase: ${reason}
First impressions: ${impressions}
Comfort & support: ${comfort}
Improvements: ${improvements}
Durability: ${durability}
Favorite feature: ${favorite}
Recommendation: ${recommendation}
Final thoughts: ${final}

Make it sound genuine, conversational, and not robotic.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const review = data.choices?.[0]?.message?.content || "";

    return res.status(200).json({ review });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
