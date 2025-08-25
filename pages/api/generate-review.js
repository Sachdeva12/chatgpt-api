export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { review } = req.body; // 👈 now coming from body

    if (!review || review.trim() === "") {
      return res.status(400).json({ error: "Missing review in body" });
    }

    // Call OpenAI API securely
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
              "You are a helpful assistant that summarizes and improves customer reviews. Always provide:\n1. A short summary (first line)\n2. An improved, natural-sounding review (rest of text).",
          },
          {
            role: "user",
            content: `Please summarize the following review and then provide an improved version:\n\n"${review}"`,
          },
        ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API Error:", errText);
      return res.status(500).json({ error: "Failed to fetch from OpenAI API" });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const summary = lines[0] || "No summary generated.";
    const improvedReview =
      lines.length > 1 ? lines.slice(1).join(" ") : "No improved review generated.";

    return res.status(200).json({ review, summary, improvedReview });
  } catch (error) {
    console.error("Error in API route:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
