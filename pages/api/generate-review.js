
export default async function handler(req, res) {
  // ✅ Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // ✅ Collect data from query OR body
    const body =
      req.method === "GET"
        ? req.query
        : typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const {
      reason = "Not provided",
      impressions = "Not provided",
      comfort = "Not provided",
      improvements = "Not provided",
      durability = "Not provided",
      favorite = "Not provided",
      recommendation = "Not provided",
      final = "Not provided",
    } = body;

    // ✅ Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a customer writing a product review. Keep it natural, like a real customer, about a pillow.",
          },
          {
            role: "user",
            content: `Customer shared:
- Why they bought it: ${reason}
- First impression: ${impressions}
- Comfort: ${comfort}
- Improvements: ${improvements}
- Durability: ${durability}
- Favorite feature: ${favorite}
- Recommendation: ${recommendation}
- Final thoughts: ${final}

Write a review using these points organically.`,
          },
        ],
        max_tokens: 250,
        temperature: 0.9,
      }),
    });

    const data = await response.json();

    if (data?.choices?.[0]?.message?.content) {
      return res.status(200).json({
        review: data.choices[0].message.content.trim(),
      });
    } else {
      return res.status(500).json({
        error: "No review generated",
        raw: data,
      });
    }
  } catch (err) {
    console.error("❌ API Error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
