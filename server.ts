import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gen AI client with server-side API key
let aiClient: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI();
  } else {
    console.warn('GEMINI_API_KEY not found in environment, fallback classification will be used.');
  }
} catch (err) {
  console.warn('Failed to initialize Google Gen AI client:', err);
}

// 7 Civic categories and their recommended departments
const CATEGORY_DEPARTMENT_MAP: Record<string, string> = {
  'Garbage Collection': 'Sanitation Department',
  'Road Damage / Potholes': 'Public Works Department',
  'Streetlight Problems': 'Electricity Department',
  'Water Leakage': 'Water Supply Department',
  'Drainage and Sewage': 'Drainage Department',
  'Public Property Damage': 'Public Works Department',
  'Other Civic Issues': 'Municipal Administration'
};

/**
 * AI-Assisted Complaint Classifier endpoint
 * Suggests category, department, priority, keywords, and executive summary
 */
app.post('/api/ai/classify', async (req: Request, res: Response) => {
  const { title = '', description = '' } = req.body;

  if (!title && !description) {
    res.status(400).json({ error: 'Title or description is required for classification' });
    return;
  }

  // Fallback heuristic classification function
  const fallbackClassification = () => {
    const text = `${title} ${description}`.toLowerCase();
    let category = 'Other Civic Issues';
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

    if (text.match(/pothole|road|crater|asphalt|tar|speedbreaker|highway|sidewalk|pavement/)) {
      category = 'Road Damage / Potholes';
      priority = text.match(/deep|huge|accident|deadly|severe|tire|crash/) ? 'high' : 'medium';
    } else if (text.match(/garbage|trash|waste|dump|rubbish|litter|bins|smell|stench|sanitation/)) {
      category = 'Garbage Collection';
      priority = text.match(/overflow|disease|hospital|school|rotting/) ? 'high' : 'medium';
    } else if (text.match(/light|streetlight|lamp|dark|pole|wire|spark|blackout|electric/)) {
      category = 'Streetlight Problems';
      priority = text.match(/spark|exposed|shock|fire|hazard/) ? 'urgent' : 'low';
    } else if (text.match(/water|pipe|leak|burst|flow|pressure|meter|tap/)) {
      category = 'Water Leakage';
      priority = text.match(/burst|flooding|gushing|waste/) ? 'high' : 'medium';
    } else if (text.match(/drain|sewage|gutter|manhole|stagnant|overflowing drain|clogged/)) {
      category = 'Drainage and Sewage';
      priority = text.match(/overflow|manhole open|choked|monsoon/) ? 'urgent' : 'high';
    } else if (text.match(/park|bench|bus stop|shelter|sign|statue|fence|wall|public property/)) {
      category = 'Public Property Damage';
      priority = 'low';
    }

    const department = CATEGORY_DEPARTMENT_MAP[category] || 'Municipal Administration';
    const words = text.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 4);
    const keywords = Array.from(new Set(words)).slice(0, 5);

    return {
      category,
      department,
      priority,
      keywords: keywords.length > 0 ? keywords : ['civic', 'infrastructure', 'maintenance'],
      summary: `Citizen reported ${category.toLowerCase()} at the specified locality requiring inspection by ${department}.`,
      aiPowered: false
    };
  };

  // If Gemini client is unavailable, return fallback
  if (!aiClient) {
    res.json(fallbackClassification());
    return;
  }

  try {
    const prompt = `You are an AI Civic Complaint Assistant for a smart municipal grievance redressal system.
Analyze the following citizen complaint and return a strictly valid JSON response.

Complaint Title: "${title}"
Complaint Description: "${description}"

Categories to pick from (MUST choose one of these exact strings):
1. "Garbage Collection"
2. "Road Damage / Potholes"
3. "Streetlight Problems"
4. "Water Leakage"
5. "Drainage and Sewage"
6. "Public Property Damage"
7. "Other Civic Issues"

Departments corresponding to categories:
- "Garbage Collection" -> "Sanitation Department"
- "Road Damage / Potholes" -> "Public Works Department"
- "Streetlight Problems" -> "Electricity Department"
- "Water Leakage" -> "Water Supply Department"
- "Drainage and Sewage" -> "Drainage Department"
- "Public Property Damage" -> "Public Works Department"
- "Other Civic Issues" -> "Municipal Administration"

Priorities to pick from: "low", "medium", "high", "urgent"
(Choose "urgent" if it poses immediate safety hazard like open manhole, high voltage sparks, or gushing main pipeline; "high" for severe road damage, heavy sewer overflow; "medium" for standard garbage/pothole; "low" for minor cosmetic issues or single flicker light).

Provide:
- category (exact string)
- department (exact string)
- priority (exact string)
- keywords (array of 3 to 6 key terms)
- summary (a clear, factual 1-2 sentence summary for municipal administrators)

Output strictly in JSON format without markdown ticks or backticks:
{
  "category": "...",
  "department": "...",
  "priority": "...",
  "keywords": ["..."],
  "summary": "..."
}`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI classification timeout')), 3000)
    );

    const generatePromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const response: any = await Promise.race([generatePromise, timeoutPromise]);

    const responseText = response.text?.trim() || '';
    const parsed = JSON.parse(responseText);

    const validCategory = CATEGORY_DEPARTMENT_MAP[parsed.category] ? parsed.category : 'Other Civic Issues';
    const validDepartment = CATEGORY_DEPARTMENT_MAP[validCategory] || 'Municipal Administration';

    res.json({
      category: validCategory,
      department: validDepartment,
      priority: ['low', 'medium', 'high', 'urgent'].includes(parsed.priority) ? parsed.priority : 'medium',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 6) : [],
      summary: parsed.summary || `${title}: Reported for municipal inspection.`,
      aiPowered: true
    });
  } catch (err) {
    console.error('Error generating AI classification:', err);
    // Graceful fallback so complaint submission is never blocked
    res.json(fallbackClassification());
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicConnect server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
