const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Load .env if present (local dev only; Railway uses env vars directly)
try { require('dotenv').config(); } catch (e) { /* dotenv optional */ }

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// ─── Middleware ───
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// ─── Admin authentication secrets ───
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LYNXAIPASSOWORDSECURED@34';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'secure-lynx-admin-token-2026';

app.post('/api/admin/login', function (req, res) {
  var body = req.body || {};
  if (body.username === ADMIN_USERNAME && body.password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_TOKEN });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/verify', function (req, res) {
  var body = req.body || {};
  if (body.token === ADMIN_TOKEN) {
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid token' });
});

// ─── Server-side secrets ───
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Pre-fed advice lookup (score range → rating, holding_back, fix_it) ───
const TRAIT_ADVICE = {
  jawline: {
    poor: { rating: 'Poor', holding_back: 'Weak jaw definition, excess submental fat, or recessed mandible reducing angularity', fix_it: 'Practice mewing (proper tongue posture), chew mastic gum 15min/day each side, reduce body fat below 15%' },
    average: { rating: 'Average', holding_back: 'Moderate jaw definition but lacking sharp gonial angle or visible masseter', fix_it: 'Consistent mewing, jawline exercises, and lean diet to reveal bone structure' },
    good: { rating: 'Good', holding_back: 'Well-defined jaw but could improve gonial angle or masseter prominence', fix_it: 'Maintain low body fat, continue mewing, consider targeted masseter training' },
    excellent: { rating: 'Excellent', holding_back: 'Minor room for improvement in overall angularity', fix_it: 'Maintain current physique and posture habits' },
  },
  skin: {
    poor: { rating: 'Poor', holding_back: 'Visible acne, uneven texture, hyperpigmentation, or dullness', fix_it: 'Start basic routine: gentle cleanser, niacinamide serum, SPF 50 daily. Drink 2-3L water' },
    average: { rating: 'Average', holding_back: 'Some texture issues, mild scarring, or inconsistent tone', fix_it: 'Add retinol 2x/week, vitamin C serum in AM, and chemical exfoliant 1x/week' },
    good: { rating: 'Good', holding_back: 'Minor imperfections like occasional breakouts or slight unevenness', fix_it: 'Maintain routine consistency, use sunscreen religiously, consider monthly facials' },
    excellent: { rating: 'Excellent', holding_back: 'Near-flawless skin with minimal room for improvement', fix_it: 'Keep current routine, focus on prevention and hydration' },
  },
  eyes: {
    poor: { rating: 'Poor', holding_back: 'Dark circles, puffiness, negative canthal tilt, or excessive scleral show', fix_it: 'Prioritize 7-8hr sleep, cold compresses daily, reduce sodium, stay hydrated' },
    average: { rating: 'Average', holding_back: 'Some periorbital hollowing or mild dark circles reducing eye area appeal', fix_it: 'Sleep on back, apply caffeine eye serum, manage allergies, reduce screen time before bed' },
    good: { rating: 'Good', holding_back: 'Well-shaped eyes with minor tiredness or slight asymmetry', fix_it: 'Consistent sleep schedule, hydration, and gentle eye cream for maintenance' },
    excellent: { rating: 'Excellent', holding_back: 'Strong eye area with minimal improvement needed', fix_it: 'Protect from sun damage, maintain sleep quality' },
  },
  cheekbones: {
    poor: { rating: 'Poor', holding_back: 'Flat midface with minimal cheekbone projection or definition', fix_it: 'Reduce facial fat through overall body recomp, mewing pushes maxilla forward over time' },
    average: { rating: 'Average', holding_back: 'Some cheekbone presence but lacks prominent zygomatic projection', fix_it: 'Lean down to reveal bone structure, proper tongue posture helps midface development' },
    good: { rating: 'Good', holding_back: 'Visible cheekbones with room for more hollow underneath', fix_it: 'Maintain low body fat percentage, continue facial posture habits' },
    excellent: { rating: 'Excellent', holding_back: 'Prominent zygomatic arches with great facial contrast', fix_it: 'Maintain current body composition and bone health' },
  },
  lips: {
    poor: { rating: 'Poor', holding_back: 'Very thin lips, significant asymmetry, or poor vermillion show', fix_it: 'Stay hydrated, use lip balm with SPF, gentle lip scrub weekly for fullness' },
    average: { rating: 'Average', holding_back: 'Moderate lip volume but could benefit from better proportion or definition', fix_it: 'Hydrate consistently, avoid licking lips, consider lip care routine' },
    good: { rating: 'Good', holding_back: 'Well-proportioned lips with minor asymmetry', fix_it: 'Maintain hydration, protect from sun damage' },
    excellent: { rating: 'Excellent', holding_back: 'Great proportion and shape with minimal improvement needed', fix_it: 'Keep lips moisturized and protected' },
  },
  hair: {
    poor: { rating: 'Poor', holding_back: 'Thinning, receding, poor texture, or unflattering style', fix_it: 'See a dermatologist for hair loss, consider minoxidil, get a style consultation for your face shape' },
    average: { rating: 'Average', holding_back: 'Decent hair but lacking volume, style, or health', fix_it: 'Find a hairstyle for your face shape, use sulfate-free shampoo, scalp massage 3min daily' },
    good: { rating: 'Good', holding_back: 'Healthy hair with room for better styling or volume', fix_it: 'Experiment with styling products, get regular trims, consider a fade or textured cut' },
    excellent: { rating: 'Excellent', holding_back: 'Great hair with minimal improvement needed', fix_it: 'Maintain current routine, protect from heat damage' },
  },
  symmetry: {
    poor: { rating: 'Poor', holding_back: 'Noticeable facial asymmetry in jaw, eyes, or overall alignment', fix_it: 'Sleep on back, chew evenly on both sides, practice balanced mewing, check posture' },
    average: { rating: 'Average', holding_back: 'Mild asymmetry visible in certain lighting or angles', fix_it: 'Even chewing habits, balanced sleeping position, facial muscle awareness' },
    good: { rating: 'Good', holding_back: 'Very minor asymmetry only noticeable on close inspection', fix_it: 'Continue balanced habits, most faces have slight natural asymmetry' },
    excellent: { rating: 'Excellent', holding_back: 'Near-perfect symmetry across all features', fix_it: 'Maintain balanced facial habits' },
  },
  nose: {
    poor: { rating: 'Poor', holding_back: 'Disproportionate size, prominent dorsal hump, wide alar base, or bulbous tip', fix_it: 'Contouring can help appearance, nose exercises have limited evidence but try pinching bridge 5min daily' },
    average: { rating: 'Average', holding_back: 'Acceptable nose but slightly wide or lacks definition from side profile', fix_it: 'Lose facial fat to refine appearance, proper posture helps nasal projection perception' },
    good: { rating: 'Good', holding_back: 'Well-shaped nose with minor width or tip refinement possible', fix_it: 'No major changes needed, maintain overall facial leanness' },
    excellent: { rating: 'Excellent', holding_back: 'Well-proportioned nose that fits facial harmony', fix_it: 'Protect from sun damage, maintain facial composition' },
  },
  chin: {
    poor: { rating: 'Poor', holding_back: 'Significant recession, weak projection from side profile, or excess fat', fix_it: 'Mewing helps forward chin growth over time, reduce body fat, chin tuck exercises daily' },
    average: { rating: 'Average', holding_back: 'Moderate chin projection but slightly recessed when viewed from side', fix_it: 'Consistent mewing, proper head posture, tongue on palate at rest' },
    good: { rating: 'Good', holding_back: 'Good projection with minor room for improvement', fix_it: 'Maintain posture habits, continue mewing for maintenance' },
    excellent: { rating: 'Excellent', holding_back: 'Strong chin with excellent forward projection', fix_it: 'Maintain current posture and habits' },
  },
};

function getAdviceForScore(trait, score) {
  if (score >= 80) return TRAIT_ADVICE[trait]?.excellent || TRAIT_ADVICE[trait]?.good;
  if (score >= 60) return TRAIT_ADVICE[trait]?.good || TRAIT_ADVICE[trait]?.average;
  if (score >= 40) return TRAIT_ADVICE[trait]?.average || TRAIT_ADVICE[trait]?.poor;
  return TRAIT_ADVICE[trait]?.poor;
}

// ─── Pre-fed recommendations by overall tier ───
const TIER_RECOMMENDATIONS = {
  high: [
    'Maintain your routine — consistency is what got you here',
    'Focus on skin protection: SPF 50 daily, antioxidant serum',
    'Optimize sleep quality for cellular repair',
    'Track progress monthly with consistent lighting',
    'Fine-tune your hairstyle with a skilled barber',
  ],
  mid: [
    'Start mewing today — tongue flat on palate, lips sealed',
    'Build a morning skincare routine: cleanser, vitamin C, SPF',
    'Sleep 7-8 hours on your back to reduce puffiness',
    'Cut processed sugar — it directly affects skin clarity',
    'Get a hairstyle consultation for your face shape',
  ],
  low: [
    'Begin with basics: drink 2-3L water daily for skin health',
    'Start mewing and proper tongue posture immediately',
    'Build a skincare routine: gentle cleanser + moisturizer + SPF',
    'Reduce body fat to reveal your bone structure',
    'Fix your sleep schedule — 7-8 hours minimum',
  ],
};

// ─── Lightweight AI prompt (scores + delta only) ───
const ANALYSIS_PROMPT = `You are a facial aesthetics scorer. You receive TWO photos (front + side profile).

VALIDATION (check first):
1. No visible human face → return ONLY: {"no_face": true}
2. Recognizable celebrity/public figure → return ONLY: {"rejected": true, "reason": "Celebrity or public figure detected. Please upload your own photo."}
3. AI-generated face → return ONLY: {"rejected": true, "reason": "AI-generated image detected. Please upload a real photo."}
4. Screenshot/watermark/downloaded image → return ONLY: {"rejected": true, "reason": "Downloaded or screenshot image detected. Please take a fresh photo."}

If valid, return ONLY this JSON (no markdown, no explanation):
{
  "overall": <1-100>,
  "potential": <1-100>,
  "jawline": <1-100>,
  "skin": <1-100>,
  "eyes": <1-100>,
  "cheekbones": <1-100>,
  "lips": <1-100>,
  "hair": <1-100>,
  "symmetry": <1-100>,
  "nose": <1-100>,
  "chin": <1-100>,
  "delta": "<ONE sentence about what you observe — be specific about THIS person's features>"
}

Rules:
- Be realistic: most people score 40-75 overall.
- Use side profile to judge jawline, chin, nose projection, cheekbone projection.
- "delta" should note the most distinctive observation about their face.
- Return ONLY JSON. No extra text.`;

// ════════════════════════════════════
//  API ROUTES
// ════════════════════════════════════

// ─── JWT Authentication Middleware ───
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mxcvwkdkjsailyoestlv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Xwc0XCQFr1AIpTcgv9X0tw_TphzEYaf';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: invalid token' });
    }
    req.user = user;
    req.userToken = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: auth error' });
  }
}

function getUserSupabase(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

// ─── Economy Signature Helpers ───
const ECONOMY_SIGNING_KEY = process.env.ECONOMY_SIGNING_KEY || 'lynx-secure-signing-key-2026';

function signEconomy(economy) {
  const dataToSign = {
    coins: Number(economy.coins) || 0,
    totalCoinsEarned: Number(economy.totalCoinsEarned) || 0,
    aiCredits: Number(economy.aiCredits) || 0,
    plan: economy.plan || 'free',
    streak: economy.streak || { current: 0, longest: 0, lastActiveDate: '', shieldsRemaining: 0, milestonesClaimed: [] },
    owned: Array.isArray(economy.owned) ? economy.owned : [],
    equipped: economy.equipped || { border: null, theme: null, banner: null, title: null },
    purchaseHistory: Array.isArray(economy.purchaseHistory) ? economy.purchaseHistory : [],
    freeCreditsGranted: !!economy.freeCreditsGranted
  };

  const serialized = JSON.stringify(dataToSign);
  const signature = crypto.createHmac('sha256', ECONOMY_SIGNING_KEY).update(serialized).digest('hex');
  return { ...dataToSign, signature };
}

function verifyEconomy(economy) {
  if (!economy || !economy.signature) return false;
  const { signature, ...rest } = economy;
  
  // Format rest exactly like dataToSign to match serialized hash
  const formattedRest = {
    coins: Number(rest.coins) || 0,
    totalCoinsEarned: Number(rest.totalCoinsEarned) || 0,
    aiCredits: Number(rest.aiCredits) || 0,
    plan: rest.plan || 'free',
    streak: rest.streak || { current: 0, longest: 0, lastActiveDate: '', shieldsRemaining: 0, milestonesClaimed: [] },
    owned: Array.isArray(rest.owned) ? rest.owned : [],
    equipped: rest.equipped || { border: null, theme: null, banner: null, title: null },
    purchaseHistory: Array.isArray(rest.purchaseHistory) ? rest.purchaseHistory : [],
    freeCreditsGranted: !!rest.freeCreditsGranted
  };

  const expectedSig = crypto.createHmac('sha256', ECONOMY_SIGNING_KEY).update(JSON.stringify(formattedRest)).digest('hex');
  return signature === expectedSig;
}

async function getCloudEconomy(userId, token) {
  const client = getUserSupabase(token);
  const { data, error } = await client
    .from('lynx_user_data')
    .select('economy')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data || !data.economy || Object.keys(data.economy).length === 0) {
    return null;
  }
  return data.economy;
}

async function saveCloudEconomy(userId, token, economy) {
  const client = getUserSupabase(token);
  const { error } = await client
    .from('lynx_user_data')
    .upsert({
      user_id: userId,
      economy: economy,
      updated_at: new Date().toISOString()
    });
  if (error) {
    console.error('Failed to save economy to cloud:', error.message);
  }
}

// ─── Economy Endpoints ───
app.post('/api/economy/sync', authMiddleware, async function (req, res) {
  try {
    const { economyState } = req.body || {};
    const userId = req.user.id;
    const token = req.userToken;

    let localValid = verifyEconomy(economyState);
    let dbEconomy = await getCloudEconomy(userId, token);

    if (dbEconomy && verifyEconomy(dbEconomy)) {
      if (localValid) {
        const localEarned = economyState.totalCoinsEarned || 0;
        const dbEarned = dbEconomy.totalCoinsEarned || 0;
        if (localEarned >= dbEarned) {
          await saveCloudEconomy(userId, token, economyState);
          return res.json(economyState);
        } else {
          return res.json(dbEconomy);
        }
      } else {
        console.warn(`[Economy] Tamper detected for user ${userId}. Restoring from cloud.`);
        return res.json(dbEconomy);
      }
    } else {
      if (localValid) {
        await saveCloudEconomy(userId, token, economyState);
        return res.json(economyState);
      } else {
        const defaultEco = signEconomy({
          coins: 0,
          totalCoinsEarned: 0,
          aiCredits: 200,
          plan: 'free',
          streak: { current: 0, longest: 0, lastActiveDate: '', shieldsRemaining: 0, milestonesClaimed: [] },
          owned: [],
          equipped: { border: null, theme: null, banner: null, title: null },
          purchaseHistory: [],
          freeCreditsGranted: false
        });
        await saveCloudEconomy(userId, token, defaultEco);
        return res.json(defaultEco);
      }
    }
  } catch (err) {
    console.error('Economy sync error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/economy/earn', authMiddleware, async function (req, res) {
  try {
    const { economyState, amount } = req.body || {};
    const userId = req.user.id;
    const token = req.userToken;

    let currentEco = verifyEconomy(economyState) ? economyState : await getCloudEconomy(userId, token);
    if (!currentEco || !verifyEconomy(currentEco)) {
      currentEco = signEconomy({
        coins: 0,
        totalCoinsEarned: 0,
        aiCredits: 200,
        plan: 'free',
        streak: { current: 0, longest: 0, lastActiveDate: '', shieldsRemaining: 0, milestonesClaimed: [] },
        owned: [],
        equipped: { border: null, theme: null, banner: null, title: null },
        purchaseHistory: [],
        freeCreditsGranted: false
      });
    }

    const earnAmount = Number(amount) || 0;
    if (earnAmount <= 0 || earnAmount > 2000) {
      return res.status(400).json({ error: 'Invalid earn amount' });
    }

    const { signature, ...rest } = currentEco;
    rest.coins = (rest.coins || 0) + earnAmount;
    rest.totalCoinsEarned = (rest.totalCoinsEarned || 0) + earnAmount;

    const newEco = signEconomy(rest);
    await saveCloudEconomy(userId, token, newEco);
    res.json(newEco);
  } catch (err) {
    console.error('Economy earn error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/economy/purchase', authMiddleware, async function (req, res) {
  try {
    const { economyState, itemId, price } = req.body || {};
    const userId = req.user.id;
    const token = req.userToken;

    let currentEco = verifyEconomy(economyState) ? economyState : await getCloudEconomy(userId, token);
    if (!currentEco || !verifyEconomy(currentEco)) {
      return res.status(400).json({ error: 'Invalid economy state. Tampering detected.' });
    }

    const itemPrice = Number(price) || 0;
    if (currentEco.coins < itemPrice) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    if (currentEco.owned.includes(itemId)) {
      return res.json(currentEco);
    }

    const { signature, ...rest } = currentEco;
    rest.coins -= itemPrice;
    rest.owned.push(itemId);
    rest.purchaseHistory.push({ itemId, price: itemPrice, timestamp: new Date().toISOString() });

    const newEco = signEconomy(rest);
    await saveCloudEconomy(userId, token, newEco);
    res.json(newEco);
  } catch (err) {
    console.error('Economy purchase error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const STREAK_MILESTONES = [
  { days: 3, reward: 15 },
  { days: 7, reward: 50 },
  { days: 14, reward: 100 },
  { days: 30, reward: 250 },
  { days: 60, reward: 500 },
  { days: 100, reward: 1000 },
];

app.post('/api/economy/update-state', authMiddleware, async function (req, res) {
  try {
    const { economyState, streak, equipped, plan } = req.body || {};
    const userId = req.user.id;
    const token = req.userToken;

    let currentEco = verifyEconomy(economyState) ? economyState : await getCloudEconomy(userId, token);
    if (!currentEco || !verifyEconomy(currentEco)) {
      return res.status(400).json({ error: 'Invalid economy state. Tampering detected.' });
    }

    const { signature, ...rest } = currentEco;
    
    // 1. Equip updates (only allow if item is owned)
    if (equipped) {
      const slots = ['border', 'theme', 'banner', 'title'];
      slots.forEach(function(slot) {
        if (equipped[slot] !== undefined) {
          const itemId = equipped[slot];
          if (itemId === null || rest.owned.includes(itemId) || itemId === 'theme-default' || itemId === 'banner-default') {
            rest.equipped[slot] = itemId;
          }
        }
      });
    }

    // 2. Plan updates
    if (plan && ['free', 'basic', 'pro', 'ultra'].includes(plan)) {
      rest.plan = plan;
    }

    // 3. Streak updates & milestone rewards
    if (streak) {
      const prevMilestones = rest.streak.milestonesClaimed || [];
      const newMilestones = streak.milestonesClaimed || [];
      
      // Find newly claimed milestones
      const added = newMilestones.filter(function(m) { return !prevMilestones.includes(m); });
      let bonusCoins = 0;
      added.forEach(function(days) {
        const milestone = STREAK_MILESTONES.find(function(sm) { return sm.days === days; });
        if (milestone) {
          bonusCoins += milestone.reward;
        }
      });

      rest.streak = {
        current: Number(streak.current) || 0,
        longest: Number(streak.longest) || 0,
        lastActiveDate: streak.lastActiveDate || '',
        shieldsRemaining: Number(streak.shieldsRemaining) || 0,
        milestonesClaimed: newMilestones
      };

      if (bonusCoins > 0) {
        rest.coins += bonusCoins;
        rest.totalCoinsEarned += bonusCoins;
      }
    }

    const newEco = signEconomy(rest);
    await saveCloudEconomy(userId, token, newEco);
    res.json(newEco);
  } catch (err) {
    console.error('Economy update-state error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Profile Endpoints ───

// Check if a username is available (case-insensitive)
app.post('/api/profile/check-username', authMiddleware, async function (req, res) {
  try {
    const { username } = req.body || {};
    const userId = req.user.id;

    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ available: false, error: 'Username must be 3-20 characters' });
    }

    // Only allow alphanumeric, underscore, dot
    if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      return res.status(400).json({ available: false, error: 'Only letters, numbers, _ and . allowed' });
    }

    const client = getUserSupabase(req.userToken);
    const { data, error } = await client
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .neq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Username check error:', error.message);
      return res.status(500).json({ available: false, error: 'Check failed' });
    }

    res.json({ available: !data });
  } catch (err) {
    console.error('Username check error:', err);
    res.status(500).json({ available: false, error: 'Internal error' });
  }
});

// Update profile (username + avatar_url)
app.post('/api/profile/update', authMiddleware, async function (req, res) {
  try {
    const { username, avatar_url } = req.body || {};
    const userId = req.user.id;
    const client = getUserSupabase(req.userToken);

    const updates = { updated_at: new Date().toISOString() };

    // Validate and set username if provided
    if (username !== undefined) {
      if (!username || username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'Username must be 3-20 characters' });
      }
      if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
        return res.status(400).json({ error: 'Only letters, numbers, _ and . allowed' });
      }

      // Check uniqueness
      const { data: existing } = await client
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .neq('id', userId)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      updates.username = username.toLowerCase();
      updates.display_name = username;
    }

    // Set avatar if provided
    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }

    // Upsert into profiles table
    const { error: upsertError } = await client
      .from('profiles')
      .upsert({ id: userId, ...updates });

    if (upsertError) {
      console.error('Profile update error:', upsertError.message);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Also update Supabase auth user_metadata so session reflects changes
    const authUpdates = {};
    if (username !== undefined) authUpdates.display_name = username;
    if (avatar_url !== undefined) authUpdates.avatar_url = avatar_url;

    if (Object.keys(authUpdates).length > 0) {
      await supabase.auth.admin.updateUserById(userId, { user_metadata: authUpdates });
    }

    res.json({ success: true, username: updates.username, avatar_url: updates.avatar_url });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Upload profile picture (base64 → Supabase Storage)
app.post('/api/profile/upload-avatar', authMiddleware, async function (req, res) {
  try {
    const { image } = req.body || {};
    const userId = req.user.id;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Decode base64
    const buffer = Buffer.from(image, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large (max 5MB)' });
    }

    const fileName = `avatars/${userId}_${Date.now()}.jpg`;
    const client = getUserSupabase(req.userToken);

    // Upload to Supabase Storage (bucket: 'profiles')
    const { error: uploadError } = await client.storage
      .from('profiles')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError.message);
      return res.status(500).json({ error: 'Upload failed: ' + uploadError.message });
    }

    // Get public URL
    const { data: urlData } = client.storage.from('profiles').getPublicUrl(fileName);
    const publicUrl = urlData?.publicUrl;

    if (!publicUrl) {
      return res.status(500).json({ error: 'Failed to get public URL' });
    }

    res.json({ url: publicUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get profile (public — for leaderboard/others to see)
app.get('/api/profile/:userId', async function (req, res) {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

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

const PLAN_CONFIG = {
  free:  { scanCost: 80, chatCost: 10, coinMultiplier: 1 },
  basic: { scanCost: 70, chatCost: 8,  coinMultiplier: 1.5 },
  pro:   { scanCost: 60, chatCost: 2,  coinMultiplier: 2 },
  ultra: { scanCost: 40, chatCost: 1,  coinMultiplier: 3 },
};

// Face analysis endpoint — accepts front + side images
app.post('/api/analyze-face', authMiddleware, async function (req, res) {
  try {
    var body = req.body || {};
    var image = body.image;
    var sideImage = body.sideImage;
    var mimeType = body.mimeType || 'image/jpeg';
    var clientEco = body.economyState;
    var previousScores = body.previousScores || null;
    var userId = req.user.id;
    var token = req.userToken;

    // Verify and fetch valid economy state
    let currentEco = verifyEconomy(clientEco) ? clientEco : await getCloudEconomy(userId, token);
    if (!currentEco || !verifyEconomy(currentEco)) {
      currentEco = signEconomy({
        coins: 0,
        totalCoinsEarned: 0,
        aiCredits: 200,
        plan: 'free',
        streak: { current: 0, longest: 0, lastActiveDate: '', shieldsRemaining: 0, milestonesClaimed: [] },
        owned: [],
        equipped: { border: null, theme: null, banner: null, title: null },
        purchaseHistory: [],
        freeCreditsGranted: false
      });
    }

    // Check credits
    var cost = PLAN_CONFIG[currentEco.plan]?.scanCost || 80;
    if (currentEco.aiCredits < cost) {
      return res.status(402).json({ error: 'Insufficient AI credits', code: 'INSUFFICIENT_CREDITS' });
    }

    console.log('Analyze request received. User:', userId, 'Front:', image ? image.length : 0, 'Side:', sideImage ? sideImage.length : 0, 'Key set:', !!GEMINI_API_KEY);

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Build parts array — always include front image, optionally side
    // Build parts array
    var promptText = ANALYSIS_PROMPT;
    if (previousScores) {
      promptText += '\n\nPREVIOUS SCAN SCORES (compare and note changes in delta): ' + JSON.stringify(previousScores);
    }

    var parts = [
      { text: promptText },
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

    // Check if image was rejected (celebrity, AI-generated, downloaded)
    if (scores.rejected) {
      return res.status(422).json({ error: scores.reason || 'Image rejected', code: 'IMAGE_REJECTED' });
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, Math.round(v))); }

    // Build response using AI scores + pre-fed advice
    var overall = clamp(scores.overall || 50, 1, 100);
    var potential = clamp(scores.potential || overall + 10, 1, 100);

    // Determine overall rating from score
    var overall_rating = overall >= 90 ? 'Gigachad' : overall >= 80 ? 'Chad' : overall >= 65 ? 'Above Average' : overall >= 50 ? 'Average' : 'Below Average';

    // Build traits with pre-fed advice
    var traitNames = ['jawline', 'skin', 'eyes', 'cheekbones', 'lips', 'hair', 'symmetry', 'nose', 'chin'];
    var traits = {};
    traitNames.forEach(function(name) {
      var s = clamp(scores[name] || 50, 1, 100);
      var advice = getAdviceForScore(name, s);
      traits[name] = {
        score: s,
        rating: advice ? advice.rating : 'Average',
        holding_back: advice ? advice.holding_back : '',
        fix_it: advice ? advice.fix_it : '',
      };
    });

    // Pick recommendations based on tier
    var tier = overall >= 75 ? 'high' : overall >= 50 ? 'mid' : 'low';
    var recommendations = TIER_RECOMMENDATIONS[tier];

    // Use AI's delta observation as the description
    var description = scores.delta || '';

    var responseData = {
      overall: overall,
      overall_rating: overall_rating,
      description: description,
      potential: potential,
      traits: traits,
      recommendations: recommendations,
      // Legacy flat fields
      jawline: traits.jawline?.score || 50,
      skin_quality: traits.skin?.score || 50,
      eyes: traits.eyes?.score || 50,
      lips: traits.lips?.score || 50,
      facial_symmetry: traits.symmetry?.score || 50,
      hair_quality: traits.hair?.score || 50,
      tips: recommendations,
    };

    // Deduct scan cost and earn scan coin reward on server
    const { signature: _, ...ecoRest } = currentEco;
    ecoRest.aiCredits = Math.max(0, ecoRest.aiCredits - cost);
    const mult = PLAN_CONFIG[ecoRest.plan]?.coinMultiplier || 1;
    const scanReward = Math.round(10 * mult);
    ecoRest.coins = (ecoRest.coins || 0) + scanReward;
    ecoRest.totalCoinsEarned = (ecoRest.totalCoinsEarned || 0) + scanReward;

    const newEco = signEconomy(ecoRest);
    await saveCloudEconomy(userId, token, newEco);

    // Return the new economy state alongside responseData
    responseData.economyState = newEco;

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

app.post('/api/chat', authMiddleware, async function (req, res) {
  try {
    var prevMessages = req.body.messages || [];
    var userMessage = req.body.message || '';
    var userContext = req.body.userContext || '';
    var clientEco = req.body.economyState;
    var userId = req.user.id;
    var token = req.userToken;

    // Verify and fetch valid economy state
    let currentEco = verifyEconomy(clientEco) ? clientEco : await getCloudEconomy(userId, token);
    if (!currentEco || !verifyEconomy(currentEco)) {
      currentEco = signEconomy({
        coins: 0,
        totalCoinsEarned: 0,
        aiCredits: 200,
        plan: 'free',
        streak: { current: 0, longest: 0, lastActiveDate: '', shieldsRemaining: 0, milestonesClaimed: [] },
        owned: [],
        equipped: { border: null, theme: null, banner: null, title: null },
        purchaseHistory: [],
        freeCreditsGranted: false
      });
    }

    // Check credits
    var cost = PLAN_CONFIG[currentEco.plan]?.chatCost || 10;
    if (currentEco.aiCredits < cost) {
      return res.status(402).json({ error: 'Insufficient AI credits', code: 'INSUFFICIENT_CREDITS' });
    }

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

    // Deduct credits on server
    const { signature: _, ...ecoRest } = currentEco;
    ecoRest.aiCredits = Math.max(0, ecoRest.aiCredits - cost);

    const newEco = signEconomy(ecoRest);
    await saveCloudEconomy(userId, token, newEco);

    res.json({
      reply: reply.trim(),
      economyState: newEco
    });
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
