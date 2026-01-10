import { Request, Response } from "express";
import Thumbnail from "../models/Thumbnail.js";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";

const stylePrompts = {
  "Bold & Graphic":
    "eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional style",
  "Tech/Futuristic":
    "futuristic thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere",
  Minimalist:
    "minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point",
  Photorealistic:
    "photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field",
  Illustrated:
    "illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style",
};

const colorSchemeDescriptions = {
  vibrant:
    "vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette",
  sunset:
    "warm sunset tones, orange pink and purple hues, soft gradients, cinematic glow",
  forest:
    "natural green tones, earthy colors, calm and organic palette, fresh atmosphere",
  neon: "neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow",
  purple:
    "purple-dominant color palette, magenta and violet tones, modern and stylish mood",
  monochrome:
    "black and white color scheme, high contrast, dramatic lighting, timeless aesthetic",
  ocean:
    "cool blue and teal tones, aquatic color palette, fresh and clean atmosphere",
  pastel:
    "soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic",
};

/** Uploads a Buffer to Cloudinary without writing to disk */
function uploadToCloudinary(
  buffer: Buffer,
  aspectRatio?: string
): Promise<{ url: string }> {
  const transformations = getCloudinaryTransform(aspectRatio);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        transformation: transformations,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Upload failed"));
        }
        resolve({ url: result.secure_url || result.url });
      }
    );

    stream.end(buffer);
  });
}

function getCloudinaryTransform(aspectRatio?: string) {
  if (aspectRatio === "16:9") {
    return [{ aspect_ratio: "16:9", crop: "fill", gravity: "center" }];
  }

  if (aspectRatio === "9:16") {
    return [{ aspect_ratio: "9:16", crop: "fill", gravity: "center" }];
  }

  // 1:1 → no crop
  return [];
}

/** Extract base64 or URL from many possible a4a response shapes */
function extractImageFromA4AResponse(data: any): {
  buffer?: Buffer;
  url?: string;
} {
  // Common base64 fields
  const base64 =
    data?.image_base64 ??
    data?.base64 ??
    data?.data?.[0]?.b64_json ??
    data?.output?.[0]?.base64 ??
    data?.result?.image_base64;

  if (typeof base64 === "string" && base64.length > 50) {
    return { buffer: Buffer.from(base64, "base64") };
  }

  // Common URL fields
  const url =
    data?.image_url ??
    data?.url ??
    data?.data?.[0]?.url ??
    data?.output?.[0]?.url ??
    data?.result?.image_url;

  if (typeof url === "string" && url.startsWith("http")) {
    return { url };
  }

  return {};
}

export const generateThumbnail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session as any;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      title,
      prompt: user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay, // (kept for DB, you can also inject into prompt if you want)
    } = req.body;

    if (!title || !style) {
      return res.status(400).json({ message: "title and style are required" });
    }

    const thumbnail = await Thumbnail.create({
      userId,
      title,
      prompt_used: user_prompt,
      user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay,
      isGenerating: true,
    });

    // Build prompt
    let prompt = `Create a ${
      stylePrompts[style as keyof typeof stylePrompts] ??
      stylePrompts["Bold & Graphic"]
    } with title: "${title}". `;

    if (color_scheme) {
      prompt += `Use a ${
        colorSchemeDescriptions[
          color_scheme as keyof typeof colorSchemeDescriptions
        ] ?? ""
      } color scheme. `;
    }

    if (user_prompt) {
      prompt += `Additional details: "${user_prompt}". `;
    }

    if (text_overlay) {
      prompt += `Include this text overlay (make it readable, bold): "${text_overlay}". `;
    }

    prompt += `The thumbnail should be ${
      aspect_ratio || "16:9"
    }, visually stunning, and designed to maximize click-through rate. Make it bold, professional, and impossible to ignore.`;

    // ✅ a4a config
    const A4A_BASE_URL = process.env.A4A_BASE_URL;
    const A4A_API_KEY = process.env.A4A_API_KEY;
    const A4A_GENERATE_ENDPOINT = process.env.A4A_GENERATE_ENDPOINT;
    const A4A_MODEL = process.env.A4A_MODEL || "provider-4/imagen-3.5";

    if (!A4A_BASE_URL || !A4A_API_KEY || !A4A_GENERATE_ENDPOINT) {
      thumbnail.isGenerating = false;
      await thumbnail.save();
      return res.status(500).json({
        message:
          "Missing A4A env vars. Set A4A_BASE_URL, A4A_API_KEY, A4A_GENERATE_ENDPOINT.",
      });
    }

    const a4aResp = await axios.post(
      `${A4A_BASE_URL}${A4A_GENERATE_ENDPOINT}`,
      {
        model: "provider-4/flux-schnell",
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
      },
      {
        headers: {
          Authorization: `Bearer ${A4A_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 120_000,
      }
    );

    const { buffer, url } = extractImageFromA4AResponse(a4aResp.data);

    let finalBuffer: Buffer | null = null;

    if (buffer) {
      finalBuffer = buffer;
    } else if (url) {
      // Download image bytes if a4a returns a URL
      const img = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 120_000,
      });
      finalBuffer = Buffer.from(img.data);
    }

    if (!finalBuffer) {
      thumbnail.isGenerating = false;
      await thumbnail.save();
      console.error("A4A raw response:", a4aResp.data);
      return res.status(500).json({
        message:
          "a4a did not return an image (base64 or URL). Check endpoint/payload/response.",
      });
    }

    // Upload to Cloudinary from memory (no local file)
    const transformations = getCloudinaryTransform(aspect_ratio);

    const uploadResult = await uploadToCloudinary(finalBuffer, aspect_ratio);

    thumbnail.image_url = uploadResult.url;
    thumbnail.isGenerating = false;
    await thumbnail.save();

    return res.status(200).json({
      message: "Thumbnail generated successfully",
      thumbnail,
    });
  } catch (err: any) {
    console.error(err?.response?.data || err);
    return res.status(500).json({
      message: "Something went wrong",
      error: err?.response?.data || err?.message || String(err),
    });
  }
};

export const deleteThumbnail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.session as any;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await Thumbnail.findByIdAndDelete({ _id: id, userId });

    return res.status(200).json({ message: "Thumbnail deleted successfully" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
