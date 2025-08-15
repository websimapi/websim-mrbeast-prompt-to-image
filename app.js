import anime from "animejs";

const form = document.getElementById("promptForm");
const promptEl = document.getElementById("prompt");
const generateBtn = document.getElementById("generate");
const viewerImg = document.getElementById("viewerImg");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const MRBEAST_CANON = `Ultra-realistic cinematic portrait of MrBeast (Jimmy Donaldson), a tall Caucasian male in his mid-20s with a friendly yet confident demeanor, short dark brown hair styled casually with a slight wave, neatly trimmed light brown beard and mustache, bright blue eyes with a kind sparkle, and a warm inviting smile; wearing a casual hoodie in bold colors (black with a turquoise logo), standing slightly angled toward the camera with one hand gesturing outward as if explaining something exciting; soft diffused studio lighting with subtle rim light outlining his figure, hyper-detailed skin texture with natural tones, faint freckles, and realistic shadows; background softly blurred with vibrant colors and bokeh lights evoking a celebratory, high-energy atmosphere; shallow depth of field focused sharply on his face; cinematic 8K photorealistic style, promotional, charismatic YouTube personality.`;

let conversationHistory = [];
let items = [];
let currentIndex = -1;

function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  promptEl.disabled = isLoading;
}

function addToGallery({ url }) {
  items.push({ url });
  currentIndex = items.length - 1;
  renderCurrent();
}

function renderCurrent() {
  if (currentIndex < 0 || currentIndex >= items.length) { viewerImg.removeAttribute("src"); return; }
  viewerImg.src = items[currentIndex].url;
  anime({ targets: viewerImg, opacity: [0, 1], duration: 200, easing: "easeOutQuad" });
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userText = (promptEl.value || "").trim();
  if (!userText) { anime({ targets: promptEl, translateX: [{v:-4},{v:4},{v:0}], duration: 180 }); return; }

  try {
    setLoading(true);
    const finalPrompt = await llmPromptTransform(userText);
    const fullPrompt = `${finalPrompt} — ensure MrBeast is clearly incorporated naturally. Use this appearance reference for MrBeast: ${MRBEAST_CANON} High quality, detailed, clean composition.`;
    const result = await websim.imageGen({ prompt: fullPrompt });
    addToGallery({ url: result.url });
    promptEl.select();
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
});

promptEl.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
    generateBtn.click();
  }
});

prevBtn.addEventListener("click", () => {
  if (items.length === 0) return;
  currentIndex = Math.max(0, currentIndex - 1);
  renderCurrent();
});

nextBtn.addEventListener("click", () => {
  if (items.length === 0) return;
  currentIndex = Math.min(items.length - 1, currentIndex + 1);
  renderCurrent();
});