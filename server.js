const express = require('express');
const cors = require('cors');
const path = require('path');

// Load .env if present (local dev only; Railway uses env vars directly)
try { require('dotenv').config(); } catch (e) { /* dotenv optional */ }

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// ─── Middleware ───
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// ─── Server-side secrets ───
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const ANALYSIS_PROMPT = `You are an expert facial aesthetics analyst. You will receive TWO photos of the same person:
1. A FRONT-FACING photo (straight at the camera)
2. A SIDE PROFILE photo (turned to the side)

Use BOTH angles to provide the most accurate analysis possible. The side profile is critical for:
- Jawline angle and definition (gonial angle)
- Chin projection and recession
- Nose bridge height, tip projection, and dorsal profile
- Neck posture and forward head position
- Cheekbone projection from the side

IMPORTANT: If EITHER image does NOT contain a clearly visible human face, return ONLY: {"no_face": true}

If faces ARE visible in both images, return ONLY valid JSON (no markdown):
{
  "overall": <number 1-100>,
  "overall_rating": "<Gigachad|Chad|Above Average|Average|Below Average>",
  "description": "<2-3 sentence overall assessment referencing observations from BOTH angles>",
  "potential": <number 1-100>,
  "traits": {
    "jawline": { "score": <1-100>, "rating": "<Excellent|Good|Average|Poor>", "holding_back": "<what limits this score — reference side profile observations>", "fix_it": "<actionable improvement tip>" },
    "skin": { "score": <1-100>, "rating": "<Excellent|Good|Average|Poor>", "holding_back": "<what limits this score>", "fix_it": "<actionable improvement tip>" },
    "eyes": { "score": <1-100>, "rating": "<Excellent|Good|Average|Poor>", "holding_back": "<what limits this score>", "fix_it": "<actionable improvement tip>" },
    "cheekbones": { "score": <1-100>, "rating": "<Excellent|Good|Average|Poor>", "holding_back": "<what limits this score — reference side profile projection>", "fix_it": "<actionable improvement tip>" },
    "lips": { "score": <1-100>, "rating": "<Excellent|Good|Average|Poor>", "holding_back": "<what limits this score>", "fix_it": "<actionable improvement tip>" },
    "hair": { "score": <1-100>, "rating": "<Excellent|Good|Average|Poor>", "holding_back": "<what limits this score>", "fix_it": "<actionable improvement tip>" },
    "symmetry": { "score": <1-100>, "rating": "<Excellent|Good|Average|Poor>", "holding_back": "<what limits this score>", "fix_it": "<actionable improvement tip>" },
    "nose": { "score": <1-100>, "rating": "<Excellent|Good|Average|Poor>", "holding_back": "<reference side profile — bridge, tip, projection>", "fix_it": "<actionable improvement tip>" },
    "chin": { "score": <1-100>, "rating": "<Excellent|Good|Average|Poor>", "holding_back": "<reference side profile — projection, recession>", "fix_it": "<actionable improvement tip>" }
  },
  "recommendations": ["<tip1>", "<tip2>", "<tip3>", "<tip4>", "<tip5>"]
}

Rules:
- Be realistic: most people score 40-75 overall.
- overall_rating tiers: 90+ Gigachad, 80-89 Chad, 65-79 Above Average, 50-64 Average, <50 Below Average
- Each trait needs specific, honest holding_back and fix_it advice.
- For jawline, cheekbones, nose, and chin: ALWAYS reference what you observe in the side profile.
- Return ONLY JSON.`;

// ════════════════════════════════════
//  API ROUTES
// ════════════════════════════════════

// Health check
app.get('/api/health', function (req, res) {
  res.json({
    status: 'ok',
    service: 'lynx-ai-server',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!GEMINI_API_KEY,
    groqConfigured: !!GROQ_API_KEY,
  });
});

// Face analysis endpoint — accepts front + side images
app.post('/api/analyze-face', async function (req, res) {
  try {
    var body = req.body || {};
    var image = body.image;
    var sideImage = body.sideImage;
    var mimeType = body.mimeType || 'image/jpeg';

    console.log('Analyze request received. Front:', image ? image.length : 0, 'Side:', sideImage ? sideImage.length : 0, 'Key set:', !!GEMINI_API_KEY);

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Build parts array — always include front image, optionally side
    var parts = [
      { text: ANALYSIS_PROMPT },
      { text: 'FRONT-FACING PHOTO:' },
      { inline_data: { mime_type: mimeType, data: image } },
    ];

    if (sideImage) {
      parts.push({ text: 'SIDE PROFILE PHOTO:' });
      parts.push({ inline_data: { mime_type: mimeType, data: sideImage } });
    }

    var response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      }),
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(502).json({ error: 'AI analysis failed', detail: errText.substring(0, 200), geminiStatus: response.status });
    }

    var result = await response.json();
    
    // Gemini 2.5 Flash is a "thinking" model — response has multiple parts:
    // thought parts (internal reasoning) + the actual text output.
    // We need the last non-thought text part.
    var textContent = null;
    if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
      var parts = result.candidates[0].content.parts;
      for (var p = parts.length - 1; p >= 0; p--) {
        if (parts[p].text && !parts[p].thought) {
          textContent = parts[p].text;
          break;
        }
      }
      // Fallback: if no non-thought part found, use the last part with text
      if (!textContent) {
        for (var p2 = parts.length - 1; p2 >= 0; p2--) {
          if (parts[p2].text) {
            textContent = parts[p2].text;
            break;
          }
        }
      }
    }

    if (!textContent) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    var cleaned = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    var scores = JSON.parse(cleaned);

    // Check if Gemini detected no face
    if (scores.no_face) {
      return res.status(422).json({ error: 'No face detected', code: 'NO_FACE' });
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, Math.round(v))); }

    // Build response — support both new rich format and legacy flat format
    var responseData = {
      overall: clamp(scores.overall, 1, 100),
      overall_rating: scores.overall_rating || 'Average',
      description: scores.description || '',
      potential: clamp(scores.potential, 1, 100),
      traits: {},
      recommendations: scores.recommendations || scores.tips || [],
      // Legacy flat fields for backward compat
      jawline: 0, skin_quality: 0, eyes: 0, lips: 0, facial_symmetry: 0, hair_quality: 0,
      tips: scores.recommendations || scores.tips || [],
    };

    if (scores.traits) {
      var traitNames = ['jawline', 'skin', 'eyes', 'cheekbones', 'lips', 'hair', 'symmetry', 'nose', 'chin'];
      traitNames.forEach(function(name) {
        var t = scores.traits[name] || {};
        responseData.traits[name] = {
          score: clamp(t.score || 50, 1, 100),
          rating: t.rating || 'Average',
          holding_back: t.holding_back || '',
          fix_it: t.fix_it || '',
        };
      });
      // Fill legacy flat fields
      responseData.jawline = responseData.traits.jawline?.score || 50;
      responseData.skin_quality = responseData.traits.skin?.score || 50;
      responseData.eyes = responseData.traits.eyes?.score || 50;
      responseData.lips = responseData.traits.lips?.score || 50;
      responseData.facial_symmetry = responseData.traits.symmetry?.score || 50;
      responseData.hair_quality = responseData.traits.hair?.score || 50;
    } else {
      // Legacy format fallback
      responseData.jawline = clamp(scores.jawline || 50, 1, 100);
      responseData.skin_quality = clamp(scores.skin_quality || 50, 1, 100);
      responseData.eyes = clamp(scores.eyes || 50, 1, 100);
      responseData.lips = clamp(scores.lips || 50, 1, 100);
      responseData.facial_symmetry = clamp(scores.facial_symmetry || 50, 1, 100);
      responseData.hair_quality = clamp(scores.hair_quality || 50, 1, 100);
    }

    res.json(responseData);
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat endpoint — powered by Groq (Llama 3.3 70B) for ultra-fast responses

const CHAT_SYSTEM_PROMPT = `You are Lynx, a friendly and knowledgeable AI assistant specialized in looksmaxing, facial aesthetics, skincare, grooming, fitness, and overall self-improvement. 

Personality:
- Supportive, encouraging, but honest
- Give practical, actionable advice based on the user's actual data
- Use casual, friendly language (not overly formal)
- Keep responses concise (2-4 short paragraphs max)
- Use relevant emojis sparingly
- Reference the user's specific scores and weak areas when giving advice
- If the user hasn't done a scan yet, encourage them to do one
- If asked about topics outside your expertise, gently redirect to self-improvement topics

Your knowledge covers:
- Facial aesthetics & bone structure
- Skincare routines & products
- Hair care & styling
- Fitness & body composition
- Mewing, jawline exercises
- Style & grooming
- Confidence & mindset

IMPORTANT: You have access to the user's face scan data below. Use it to personalize every response. For example, if their jawline is low, recommend mewing exercises. If skin quality is low, suggest a skincare routine. Always be specific to THEIR data.`;

app.post('/api/chat', async function (req, res) {
  try {
    var prevMessages = req.body.messages || [];
    var userMessage = req.body.message || '';
    var userContext = req.body.userContext || '';

    if (!userMessage.trim()) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // Build system prompt with user context
    var systemPrompt = CHAT_SYSTEM_PROMPT;
    if (userContext) {
      systemPrompt += '\n\n--- USER DATA (use this to personalize your responses) ---\n' + userContext;
    }

    var reply = null;

    // ── Try Groq first (fast) ──
    if (GROQ_API_KEY) {
      try {
        var groqMessages = [{ role: 'system', content: systemPrompt }];
        for (var i = 0; i < prevMessages.length; i++) {
          groqMessages.push({
            role: prevMessages[i].role === 'user' ? 'user' : 'assistant',
            content: prevMessages[i].content
          });
        }
        groqMessages.push({ role: 'user', content: userMessage });

        var groqRes = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + GROQ_API_KEY,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 800,
          }),
        });

        if (groqRes.ok) {
          var groqResult = await groqRes.json();
          reply = groqResult.choices && groqResult.choices[0] && groqResult.choices[0].message && groqResult.choices[0].message.content;
        } else {
          console.log('Groq rate-limited (' + groqRes.status + '), falling back to Gemini...');
        }
      } catch (groqErr) {
        console.log('Groq failed, falling back to Gemini:', groqErr.message);
      }
    }

    // ── Fallback to Gemini ──
    if (!reply && GEMINI_API_KEY) {
      var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;
      var contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Understood! I'm Lynx, your AI glow-up companion. Ready to help! 💪" }] }
      ];
      for (var j = 0; j < prevMessages.length; j++) {
        contents.push({
          role: prevMessages[j].role === 'user' ? 'user' : 'model',
          parts: [{ text: prevMessages[j].content }]
        });
      }
      contents.push({ role: 'user', parts: [{ text: userMessage }] });

      var geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
        }),
      });

      if (geminiRes.ok) {
        var geminiResult = await geminiRes.json();
        // Handle thinking model: find last non-thought text part
        if (geminiResult.candidates && geminiResult.candidates[0] && geminiResult.candidates[0].content && geminiResult.candidates[0].content.parts) {
          var gParts = geminiResult.candidates[0].content.parts;
          for (var gp = gParts.length - 1; gp >= 0; gp--) {
            if (gParts[gp].text && !gParts[gp].thought) { reply = gParts[gp].text; break; }
          }
          if (!reply) {
            for (var gp2 = gParts.length - 1; gp2 >= 0; gp2--) {
              if (gParts[gp2].text) { reply = gParts[gp2].text; break; }
            }
          }
        }
      } else {
        var errText = await geminiRes.text();
        console.error('Gemini also failed:', geminiRes.status, errText);
      }
    }

    if (!reply) {
      return res.status(502).json({ error: 'AI response failed' });
    }

    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ════════════════════════════════════
//  SERVE STATIC WEB BUILD
// ════════════════════════════════════
var distPath = path.join(__dirname, 'web', 'dist');
app.use(express.static(distPath));

// SPA fallback
app.get('*', function (req, res) {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ════════════════════════════════════
//  START SERVER
// ════════════════════════════════════
app.listen(PORT, '0.0.0.0', function () {
  console.log('Lynx AI Server running on port ' + PORT);
  console.log('  API: /api/health');
  console.log('  Web: /');
});
