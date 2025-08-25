// pages/api/generate-review.js

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET requests are allowed" });
  }

  try {
    const { review } = req.query;

    if (!review || review.trim() === "") {
      return res.status(400).json({ error: "Missing ?review= in query" });
    }

    // 🔐 Call OpenAI securely (make sure API_KEY is set in Vercel environment variables)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that summarizes and improves customer reviews. Always return:\n1. A short summary (one sentence).\n2. An improved, natural-sounding review.",
          },
          {
            role: "user",
            content: `Summarize and improve this review:\n\n"${review}"`,
          },
        ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", errorText);
      return res
        .status(response.status)
        .json({ error: "Failed to fetch from OpenAI API", details: errorText });
    }

    const data = await response.json();

    // Validate response structure
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      console.error("Invalid OpenAI response:", data);
      return res.status(500).json({ error: "Invalid OpenAI response" });
    }

    // Split into summary + improved review
    const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);

    const summary = lines[0] || "No summary generated.";
    const improvedReview =
      lines.length > 1 ? lines.slice(1).join(" ") : "No improved review generated.";

    return res.status(200).json({
      original: review,
      summary,
      improvedReview,
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return res.status(500).json({ error: "Something went wrong", details: error.message });
  }
}
