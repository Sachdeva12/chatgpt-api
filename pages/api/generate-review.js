export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  try {
    const { review } = req.query;

    if (!review) {
      return res.status(400).json({ error: "Missing ?review= in query" });
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
          { role: "system", content: "You are a helpful assistant that improves customer reviews." },
          {
            role: "user",
            content: `Please summarize the following review and then provide an improved, natural version:\n\n"${review}"`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices.length) {
      return res.status(500).json({ error: "Invalid OpenAI response" });
    }

    const content = data.choices[0].message.content;
    const lines = content.split("\n").map(line => line.trim()).filter(line => line);

    const summary = lines[0] || "No summary generated.";
    const improvedReview = lines.length > 1 ? lines.slice(1).join(" ") : "No improved review generated.";

    res.status(200).json({
      review,
      summary,
      improvedReview,
    });

  } catch (error) {
    console.error("Error in API route:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
}
