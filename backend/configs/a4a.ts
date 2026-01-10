import axios from "axios";

const A4A_BASE_URL = process.env.A4A_BASE_URL!;
const A4A_API_KEY = process.env.A4A_API_KEY!;

if (!A4A_BASE_URL || !A4A_API_KEY) {
  throw new Error(
    "Missing A4A_BASE_URL or A4A_API_KEY in environment variables"
  );
}

export async function generateImageA4A(params: {
  prompt: string;
  aspectRatio?: string; // "16:9"
  size?: "1K" | "2K" | "4K";
  model?: string;
}) {
  const { prompt, aspectRatio = "16:9", size = "1K", model } = params;

  // NOTE: Endpoint + payload shape depends on a4a.co API.
  // Replace "/api/generate-image" with the exact endpoint from a4a docs.
  const resp = await axios.post(
    `${A4A_BASE_URL}/images/generations`,
    {
      model: model ?? process.env.A4A_MODEL,
      prompt,
      aspect_ratio: aspectRatio,
      image_size: size,
      output_format: "png",
      // Some APIs use: width/height instead of aspect_ratio + size
    },
    {
      headers: {
        Authorization: `Bearer ${A4A_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 120_000,
    }
  );

  return resp.data;
}
