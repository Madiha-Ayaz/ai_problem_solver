














const { AI_API_KEY, AI_BASE_URL, AI_MODEL, AI_TIMEOUT_MS, AI_CHAT_AUTO_RESOLVE } = require('../config/env')
const { AppError } = require('../middleware/errors')
const { CATEGORIES, PRIORITIES } = require('../constants/ticket')









const KEYWORD_RULES = [
  { matcher: /password|login|sign ?in|log ?in|credential|reset|2fa|otp|verify|access|locked|account/i, category: 'Account', priority: 'HIGH' },
  { matcher: /refund|charge|payment|invoice|subscription|billing|credit|debit|renew|price|cost|overcharge|plan/i, category: 'Billing', priority: 'HIGH' },
  { matcher: /crash|error|bug|freeze|hang|not loading|blank|exception|fails|broken|app isn't|won't open|glitch/i, category: 'Bug', priority: 'HIGH' },
  { matcher: /feature|suggest|request|enhancement|upgrade|new option|add .*button|would like|nice to have|improve/i, category: 'Feature Request', priority: 'LOW' },
  { matcher: /slow|lag|latency|network|connect|server|performance|loading|timeout|technical|install|setup|configure|sync|device|compatibility/i, category: 'Technical', priority: 'MEDIUM' },
]











const SUMMARY_CATALOG = {
  Account: [
    'The customer is locked out of their account and unable to sign in; access must be restored promptly.',
    'The user reports a sign-in failure tied to an account-level problem and needs their access validated and restored.',
    'Account access is currently blocked for this customer; verification and a secure credential reset are required.',
    'The customer cannot reach their account and considers the matter urgent; restore access and confirm they can sign in.',
  ],
  Billing: [
    'The customer is disputing a charge on their account and requests a review of the transaction against their billing history.',
    'A billing discrepancy has been reported; the customer is asking for confirmation of charges and, where applicable, a refund or adjustment.',
    'The user reports an unexpected or duplicate charge and is requesting a correction and refund as appropriate.',
    'A payment concern has been escalated; the charge should be reconciled and corrected if found to be erroneous.',
  ],
  Bug: [
    'The customer encountered a reproducible product defect and provided steps; the issue requires engineering investigation.',
    'A clear product malfunction has been reported with reproduction details; isolate the cause and verify the fix.',
    'The application is behaving unexpectedly for this user; the reported failure should be reproduced, logged, and patched.',
    'A functional breakdown has been documented by the customer; escalate to engineering for diagnosis and release of a fix.',
  ],
  'Feature Request': [
    'The customer has proposed an enhancement that aligns with the product roadmap and merits backlog consideration.',
    'A product improvement was suggested by the customer; evaluate it during the next planning cycle.',
    'The user requested a capability enhancement that would increase product value; log it with the product team.',
    'An enhancement request has been raised; route it to the product owners for feasibility and prioritization.',
  ],
  Technical: [
    'The customer is most likely experiencing an environment-level issue; guided troubleshooting should precede escalation.',
    'A technical fault has been reported that requires standard diagnostics before referral to a specialist.',
    'The issue appears related to configuration, device, or connectivity; run the standard environment checks first.',
    'A performance or setup concern has been reported; validate the customer environment before escalating further.',
  ],
  Other: [
    'The request does not map cleanly to an existing category and requires a brief clarification with the customer.',
    'A general inquiry has been received; a short follow-up will establish the exact outcome the customer needs.',
    'The submission lacks sufficient detail to triage; confirm the intended request before assigning it.',
    'No obvious queue fits this request yet; a concise clarification exchange will determine the correct path forward.',
  ],
}



const RECOMMENDATION_CATALOG = {
  Account: "Verify the customer's identity, then restore or reset account access and confirm they can sign in.",
  Billing: 'Compare the charge against the customer invoice and issue a refund or adjustment if it is erroneous.',
  Bug: 'Reproduce the reported failure, gather logs, and patch the defect in the next release.',
  'Feature Request': 'Share with product management for feasibility review and roadmap prioritization.',
  Technical: 'Guide the customer through standard environment checks before escalating to a specialist.',
  Other: 'Contact the customer to clarify the request, then assign the ticket to the correct queue.',
}

function buildRecommendation(category) {
  return RECOMMENDATION_CATALOG[category] || RECOMMENDATION_CATALOG.Other
}

function hashText(text) {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return hash
}

function cleanLine(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/[.。!?]+$/, '')
    .trim()
}

function buildSummary(category, { subject, description }) {
  const catalog = SUMMARY_CATALOG[category] || SUMMARY_CATALOG.Other
  const haystack = `${subject}\n${description}`
  const hash = hashText(haystack)
  const words = cleanLine(subject).split(' ').filter(Boolean).length
  let summary = catalog[hash % catalog.length]
  if (words < 5) {
    if (hash % 5 === 0) summary += ' The customer provided limited detail; a short follow-up is recommended to complete the triage.'
    else if (hash % 3 === 0) summary += ' Additional context from the customer would strengthen the triage before it is finalized.'
  }
  return summary
}

function classifyLocally({ subject = '', description = '' }) {
  const haystack = `${subject}\n${description}`

  for (const rule of KEYWORD_RULES) {
    if (rule.matcher.test(haystack)) {
      return {
        category: rule.category,
        priority: rule.priority,
        summary: buildSummary(rule.category, { subject, description }),
        recommendation: buildRecommendation(rule.category),
      }
    }
  }

  return {
    category: 'Other',
    priority: 'MEDIUM',
    summary: buildSummary('Other', { subject, description }),
    recommendation: buildRecommendation('Other'),
  }
}


const AI_URL = `${AI_BASE_URL}/chat/completions`

const SYSTEM_PROMPT = `You are a senior support operations analyst. A customer has just filed a support ticket and you must produce professional, high-quality triage output.
Respond with ONLY a single JSON object and no other text, in exactly this shape:
{"category": "<one of: ${CATEGORIES.join(', ')}>", "priority": "<one of: ${PRIORITIES.join(', ')}>", "summary": "<one concise, professional sentence, 8-20 words, specific to this ticket>", "recommendation": "<one concise, actionable next step for the support team, 6-15 words>"}
Rules: pick the best-fitting category. Base priority on real business impact (blocked, charging, or security issues are HIGH; enhancements are LOW). Write like a senior analyst: direct, specific, professional, no filler, no markdown, no explanations.`



function extractJson(text) {
  const trimmed = String(text || '').trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return null
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch (e) {
    return null
  }
}




function extractAiJson(text) {
  const trimmed = String(text || '').trim()
  try {
    const wrapper = JSON.parse(trimmed)
    const content =
      wrapper &&
      wrapper.choices &&
      wrapper.choices[0] &&
      wrapper.choices[0].message &&
      wrapper.choices[0].message.content
    if (typeof content === 'string') {
      return extractJson(content)
    }
  } catch (e) {
    
  }
  return extractJson(trimmed)
}


function parseTriageResponse(text, input) {
  const data = extractAiJson(text)

  const errors = []
  const category = data && data.category
  const priority = data && data.priority
  const summary = data && data.summary

  if (!CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}`)
  }
  if (!PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`)
  }
  if (typeof summary !== 'string' || summary.trim().length === 0 || summary.trim().length > 300) {
    errors.push('summary must be a non-empty string of at most 300 characters')
  }

  if (errors.length) {
    const err = new AppError(422, 'AI returned an invalid triage response', 'AI_INVALID_RESPONSE')
    err.details = errors
    
    err.raw = String(text).slice(0, 500)
    throw err
  }

  
  
  let recommendation = data && data.recommendation
  if (typeof recommendation !== 'string' || recommendation.trim().length === 0 || recommendation.trim().length > 300) {
    recommendation = null
  }

  return {
    category,
    priority,
    summary: summary.trim(),
    recommendation: recommendation ? recommendation.trim() : null,
  }
}



const MAX_AI_RETRIES = 6
const AI_RETRY_BACKOFF_MS = [10000, 15000, 20000, 30000, 40000]








const AI_SENDER_ID = 'ai'
const AI_SENDER_NAME = 'SupportFlow AI'

const CHAT_SYSTEM_PROMPT = `You are SupportFlow's AI support assistant: knowledgeable, friendly and concise.
Reply to the CUSTOMER directly and naturally in plain text (at most 200 words).

GUIDELINES:
- Reply in the SAME LANGUAGE the customer writes in (Urdu, Hindi, English, Arabic, etc.). If the customer switches language, follow them.
- Give a UNIQUE, contextual answer to what they actually asked. Never copy or reuse previous replies.
- Use the ticket details and the full conversation context. Stay relevant to the customer's latest message.
- Handle greetings ("hi", "hello", "bye") and off-topic small talk gracefully — be friendly and briefly guide them back to their support topic.
- Never mention being an AI model, an API, or internal systems. You are SupportFlow's assistant.

STATUS DECISION — after every reply, judge the RIGHT ticket status and return it in your JSON envelope:
- RESOLVED: the customer's actual problem is now FULLY and CONFIDENTLY solved by the guidance you gave, and the customer confirms it works / the issue is closed.
- IN_PROGRESS: you are actively helping and the issue is being worked on, or it now needs a human agent to continue.
- ASSIGNED: a specific human agent is now handling the ticket (only meaningful when one is already assigned).
- UNASSIGN: a human agent should release this back to the open pool for re-routing (unassigned).
- KEEP: no status change — this is the safe default for greetings, thanks without a resolved issue, small talk, or anything unclear.

Be CONSERVATIVE: never resolve a greeting, a mere thank-you (without a confirmed fix), an open question, or anything that still needs a human. When in doubt, pick KEEP.

After writing your reply, output EXACTLY this JSON envelope on its own line (nothing else after it):
{"reply": "<your reply to the customer>", "status": "RESOLVED|IN_PROGRESS|ASSIGNED|UNASSIGN|KEEP"}`








const CHAT_STATUS_KEYS = Object.freeze({
  RESOLVED: 'RESOLVED',
  IN_PROGRESS: 'IN_PROGRESS',
  ASSIGNED: 'ASSIGNED',
  UNASSIGN: 'UNASSIGN',
  KEEP: 'KEEP',
})

function parseChatEnvelope(text) {
  const raw = String(text || '').trim()
  let reply = raw
  let status = CHAT_STATUS_KEYS.KEEP

  const open = raw.indexOf('{')
  const close = raw.lastIndexOf('}')
  if (open !== -1 && close > open) {
    try {
      const parsed = JSON.parse(raw.slice(open, close + 1))
      if (parsed) {
        if (typeof parsed.reply === 'string' && parsed.reply.trim()) {
          reply = parsed.reply.trim()
        }
        const s = String(parsed.status || '').trim().toUpperCase()
        if (CHAT_STATUS_KEYS[s]) {
          status = CHAT_STATUS_KEYS[s]
        } else if (parsed.resolved === true) {
          status = CHAT_STATUS_KEYS.RESOLVED
        }
      }
    } catch (e) {
      
    }
  }
  return { reply, status, resolved: status === CHAT_STATUS_KEYS.RESOLVED }
}

const CANNED_ANSWERS = {
  Account: 'Thanks for reaching out about your account. Please try the "Forgot password" reset from the sign-in screen — if that does not help, our agent will restore access for you shortly.',
  Billing: 'Thanks for flagging the billing concern. Our team will review the charge against your plan and follow up about any refund or adjustment as soon as possible.',
  Bug: 'Thanks for the report — we are on it. Please share the exact steps, your device/OS, and the error message if you can; that helps us fix it faster.',
  Technical: 'Thanks! Let us start with a couple of quick checks: restart the app, clear the cache, and confirm your internet connection. If it keeps happening, an agent will take over.',
  'Feature Request': 'Great idea — we have noted it for the product team. Keep an eye out; we appreciate your input.',
  Other: 'Thanks for your message! A support agent will review this and reply shortly. Feel free to add any extra details that might help.',
}

function cannedAnswer(category) {
  return CANNED_ANSWERS[category] || CANNED_ANSWERS.Other
}


function extractText(text) {
  const trimmed = String(text || '').trim()
  try {
    const wrapper = JSON.parse(trimmed)
    const content = wrapper && wrapper.choices && wrapper.choices[0] &&
      wrapper.choices[0].message && wrapper.choices[0].message.content
    if (typeof content === 'string') return content.trim()
  } catch (e) {
    
  }
  return trimmed
}

async function answerChat({ subject, description, category, history = [] }, opts = {}) {
  const { timeoutMs = AI_TIMEOUT_MS, maxRetries = 1, backoffMs = [1500] } = opts

  const noChange = { reply: cannedAnswer(category), status: CHAT_STATUS_KEYS.KEEP, resolved: false }
  if (!AI_API_KEY) return noChange

  const transcript = (history || [])
    .slice(-8)
    .map((m) => {
      const who = m.senderId === AI_SENDER_ID ? AI_SENDER_NAME : 'Customer'
      return `${who}: ${String(m.message || m.body || '').slice(0, 400)}`
    })
    .join('\n')

  const userPrompt = `TICKET\nSubject: ${subject || ''}\nCategory: ${category || 'Other'}\nDescription: ${String(description || '').slice(0, 1500)}\n\nCONVERSATION SO FAR:\n${transcript}\n\nNow reply to the customer's latest message.\n\nWrite your reply, then — on its own line — judge the correct ticket status, using EXACTLY this JSON envelope (nothing else after it):\n{"reply": "<your reply to the customer>", "status": "RESOLVED|IN_PROGRESS|ASSIGNED|UNASSIGN|KEEP"}`

  try {
    const text = await callProvider(
      {
        model: AI_MODEL,
        temperature: 0.4,
        messages: [
          { role: 'system', content: CHAT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      },
      { timeoutMs, maxRetries, backoffMs }
    )
    const { reply, status, resolved } = parseChatEnvelope(extractText(text))
    if (reply && reply.length <= 1000) {
      
      
      
      const appliedStatus = AI_CHAT_AUTO_RESOLVE ? status : CHAT_STATUS_KEYS.KEEP
      return {
        reply,
        status: appliedStatus,
        resolved: AI_CHAT_AUTO_RESOLVE && appliedStatus === CHAT_STATUS_KEYS.RESOLVED,
      }
    }
    return noChange
  } catch (e) {
    
    console.warn('[AI] chat answer degraded to canned reply:', (e && e.code) || 'unknown')
    return noChange
  }
}

async function callProvider(payload, opts = {}, attempt = 1) {
  const {
    timeoutMs = AI_TIMEOUT_MS,
    maxRetries = MAX_AI_RETRIES,
    backoffMs = AI_RETRY_BACKOFF_MS,
  } = opts
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let response
  try {
    response = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new AppError(503, 'AI triage timed out', 'AI_TIMEOUT')
    }
    throw new AppError(503, 'AI service unreachable', 'AI_UNAVAILABLE')
  } finally {
    clearTimeout(timer)
  }

  if (response.status === 429 && attempt < maxRetries) {
    const waitMs = backoffMs[attempt - 1] != null ? backoffMs[attempt - 1] : backoffMs[backoffMs.length - 1] || 5000
    await new Promise((resolve) => setTimeout(resolve, waitMs))
    return callProvider(payload, opts, attempt + 1)
  }

  if (!response.ok) {
    const status = response.status
    throw new AppError(502, `AI provider returned an error (HTTP ${status})`, 'AI_PROVIDER_ERROR')
  }

  let text
  try {
    text = await response.text()
  } catch (e) {
    throw new AppError(502, 'Could not read AI response', 'AI_PROVIDER_ERROR')
  }
  return text
}

async function triage(input, opts = {}) {
  
  
  
  const suggestion = classifyLocally(input)

  
  if (opts.useNetwork !== true) {
    return suggestion
  }

  if (!AI_API_KEY) {
    return suggestion
  }

  try {
    const text = await callProvider(
      {
        model: AI_MODEL,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Subject: ${input.subject}\nDescription: ${input.description}`,
          },
        ],
      },
      opts
    )
    
    const parsed = parseTriageResponse(text, input)
    parsed.recommendation = parsed.recommendation || buildRecommendation(parsed.category)
    return parsed
  } catch (e) {
    
    
    console.warn('[AI] falling back to local triage:', (e && e.code) || 'unknown')
    return suggestion
  }
}

module.exports = {
  triage,
  parseTriageResponse,
  classifyLocally,
  answerChat,
  cannedAnswer,
  AI_SENDER_ID,
  AI_SENDER_NAME,
}