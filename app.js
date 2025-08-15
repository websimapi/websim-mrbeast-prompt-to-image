import anime from "animejs";

/* ...existing code... */
const form = document.getElementById("promptForm");
const promptEl = document.getElementById("prompt");
const ratioEl = document.getElementById("ratio");
const seedEl = document.getElementById("seed");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const galleryEl = document.getElementById("gallery");
const surpriseBtn = document.getElementById("surprise");
const generateBtn = document.getElementById("generate");

const MRBEAST_CANON = `Ultra-realistic cinematic portrait of MrBeast (Jimmy Donaldson), a tall Caucasian male in his mid-20s with a friendly yet confident demeanor, short dark brown hair styled casually with a slight wave, neatly trimmed light brown beard and mustache, bright blue eyes with a kind sparkle, and a warm inviting smile; wearing a casual hoodie in bold colors (black with a turquoise logo), standing slightly angled toward the camera with one hand gesturing outward as if explaining something exciting; soft diffused studio lighting with subtle rim light outlining his figure, hyper-detailed skin texture with natural tones, faint freckles, and realistic shadows; background softly blurred with vibrant colors and bokeh lights evoking a celebratory, high-energy atmosphere; shallow depth of field focused sharply on his face; cinematic 8K photorealistic style, promotional, charismatic YouTube personality.`;

let conversationHistory = [];
let items = [];

function setLoading(isLoading, text = "Manifesting your idea…") {
  statusEl.querySelector(".status-text").textContent = text;
  statusEl.classList.toggle("hidden", !isLoading);
  generateBtn.disabled = isLoading;
  surpriseBtn.disabled = isLoading;
}

function setError(message) {
  errorEl.textContent = message || "";
  errorEl.classList.toggle("hidden", !message);
}

function addToGallery({ url, displayPrompt, ratio, seed }) {
  const card = document.createElement("div");
  card.className = "card";
  const img = document.createElement("img");
  img.alt = displayPrompt;
  img.loading = "lazy";
  img.decoding = "async";
  img.src = url;

  const meta = document.createElement("div");
  meta.className = "meta";

  const badge = document.createElement("div");
  badge.className = "badge";
  badge.title = displayPrompt;
  badge.textContent = displayPrompt;

  const dl = document.createElement("button");
  dl.className = "icon-btn";
  dl.type = "button";
  dl.textContent = "Download";
  dl.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `mrbeast_${seed || "image"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  meta.appendChild(badge);
  meta.appendChild(dl);
  card.appendChild(img);
  card.appendChild(meta);
  galleryEl.prepend(card);

  anime({ targets: card, opacity: [0, 1], translateY: [6, 0], duration: 220, easing: "easeOutQuad" });
}

async function llmPromptTransform(userText) {
  // Keep short, deterministic JSON that blends the user's idea with MrBeast tastefully
  const system = `
Respond with JSON only. No extra text.
Schema:
{
  prompt: string;        // final visual prompt for image generation
}
Guidelines:
- Keep the user's idea intact.
- Tastefully and clearly incorporate MrBeast (popular YouTuber/creator) into the scene.
- Prefer positive, cinematic, high-detail phrasing; avoid gore/NSFW/violence.
- Include visual style notes only if helpful (lighting, composition), keep concise.
- Do not add text overlays unless explicitly asked.
- When depicting MrBeast, ground his appearance with this reference (summarize only the essentials needed for the scene): ${MRBEAST_CANON}
`;
  const user = [
    { type: "text", text: `User idea: ${userText}` }
  ];
  conversationHistory.push({ role: "user", content: userText });
  // only last 10 messages
  conversationHistory = conversationHistory.slice(-10);

  const completion = await websim.chat.completions.create({
    messages: [
      { role: "system", content: system },
      ...conversationHistory,
      { role: "user", content: user }
    ],
    json: true,
  });

  let prompt = "";
  try {
    const obj = JSON.parse(completion.content);
    prompt = obj.prompt || userText;
  } catch {
    prompt = `${userText}, prominently featuring MrBeast in a fitting way`;
  }
  return prompt;
}

function pickSurprisePrompt() {
  const ideas = [
    "a futuristic city built on waterfalls at golden hour",
    "a serene tea house floating on clouds",
    "a tiny astronaut exploring a giant houseplant jungle",
    "a library where constellations form between shelves",
    "a cozy cabin during a glittering snowstorm",
    "a bustling ramen street market in neon rain",
  ];
  return ideas[Math.floor(Math.random() * ideas.length)];
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setError("");
  const userText = (promptEl.value || "").trim();
  if (!userText) return setError("Please enter a prompt.");

  const ratio = ratioEl.value || "1:1";
  const seed = seedEl.value ? Number(seedEl.value) : undefined;

  try {
    setLoading(true);
    const finalPrompt = await llmPromptTransform(userText);
    const fullPrompt = `${finalPrompt} — ensure MrBeast is clearly incorporated in a natural, context-appropriate way. Use this appearance reference for MrBeast: ${MRBEAST_CANON} High quality, detailed, clean composition.`;

    const result = await websim.imageGen({
      prompt: fullPrompt,
      aspect_ratio: ratio,
      ...(seed !== undefined ? { seed } : {}),
    });

    addToGallery({
      url: result.url,
      displayPrompt: userText,
      ratio,
      seed: seed ?? Math.floor(Math.random() * 1e9),
    });

    promptEl.focus();
    promptEl.select();
  } catch (err) {
    console.error(err);
    setError("Something went wrong generating the image. Please try again.");
  } finally {
    setLoading(false);
  }
});

surpriseBtn.addEventListener("click", () => {
  promptEl.value = pickSurprisePrompt();
  anime({ targets: promptEl, scale: [1, 1.01], duration: 120, direction: "alternate", easing: "easeOutQuad" });
});

promptEl.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
    generateBtn.click();
  }
});