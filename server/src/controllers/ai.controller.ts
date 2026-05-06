import { Request, Response, NextFunction } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const SUPPORTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type SupportedMediaType = (typeof SUPPORTED_MEDIA_TYPES)[number];

const ANALYSIS_PROMPT = `You are a facility maintenance expert. Analyze this image of a maintenance issue and return ONLY a valid JSON object — no markdown, no code blocks, just raw JSON — with these exact fields:
{
  "category": one of "electrical"|"plumbing"|"hvac"|"structural"|"it"|"other",
  "severity": one of "low"|"medium"|"high"|"critical",
  "issueType": short issue title (max 60 chars),
  "description": what you observe in the image (max 200 chars),
  "estimatedRepairTime": e.g. "30 minutes", "1-2 hours", "half day",
  "requiredTools": array of up to 6 tool name strings,
  "safetyPrecautions": array of up to 3 safety note strings,
  "confidence": number between 0 and 1
}
If the image does not show a recognizable maintenance issue, set confidence below 0.4 and use "other" for category.`;

export async function analyzeImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!env.aiAnalysisEnabled) {
      throw ApiError.badRequest('AI analysis is not enabled on this server');
    }
    if (!env.anthropicApiKey) {
      throw ApiError.internal('AI service is not configured — ANTHROPIC_API_KEY missing');
    }

    const { imageBase64 } = req.body as { imageBase64?: string };
    if (!imageBase64) throw ApiError.badRequest('imageBase64 is required');

    // Parse the data URI  e.g. "data:image/jpeg;base64,/9j/..."
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) throw ApiError.badRequest('Invalid image format — expected a base64 data URI');

    const mediaType = match[1] as SupportedMediaType;
    const base64Data = match[2];

    if (!(SUPPORTED_MEDIA_TYPES as readonly string[]).includes(mediaType)) {
      throw ApiError.badRequest(`Unsupported image type: ${mediaType}. Use JPEG, PNG, GIF, or WebP.`);
    }

    const client = new Anthropic({ apiKey: env.anthropicApiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Data },
            },
            { type: 'text', text: ANALYSIS_PROMPT },
          ],
        },
      ],
    });

    const block = response.content[0];
    if (block.type !== 'text') throw ApiError.internal('Unexpected response format from AI');

    // Strip any accidental markdown fences Claude may include
    const raw = block.text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
    const analysis = JSON.parse(raw) as Record<string, unknown>;

    res.json({
      success: true,
      data: { ...analysis, analyzedAt: new Date().toISOString() },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      next(ApiError.internal('AI returned an unparseable response — please try again'));
      return;
    }
    next(error);
  }
}
