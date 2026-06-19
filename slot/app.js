const PRIZES = [
  {
    id: "crown", rank: "一獎", label: "皇冠禮", detail: "紅寶皇冠",
    result: "恭喜抽中一獎  皇冠禮",
    reward: "平日每天可兌換 100 元便當共 5 個（限內用並留下每日用餐評論）",
    note: "最高獎項",
    asset: "./assets/transparent/crown.png",
    weight: 2, reelScale: 1.18
  },
  {
    id: "vip-card", rank: "二獎", label: "VIP 卡", detail: "黑金會員卡",
    result: "恭喜抽中二獎  VIP 卡",
    reward: "平日每天可兌換 100 元便當共 3 個（限內用並留下每日用餐評論）",
    note: "會員資格",
    asset: "./assets/transparent/vip-card.png",
    weight: 3, reelScale: 1.42
  },
  {
    id: "bento", rank: "三獎", label: "豪華便當", detail: "燒肉便當",
    result: "恭喜抽中三獎  豪華便當",
    reward: "本次用餐升級雙主餐 + 加碼炭烤肋排",
    note: "人氣主餐",
    asset: "./assets/transparent/bento.png",
    weight: 4, reelScale: 1.26
  },
  {
    id: "coupon", rank: "四獎", label: "折價券", detail: "黑金券面",
    result: "恭喜抽中四獎  折價券",
    reward: "10 元折價券,下次來店現場折抵",
    note: "下次折抵",
    asset: "./assets/transparent/coupon.png",
    weight: 5, reelScale: 1.48
  },
  {
    id: "pork-belly", rank: "五獎", label: "五花肉", detail: "燒肉單品",
    result: "恭喜抽中五獎  加菜五花肉",
    reward: "當月壽星可享加贈五花烤肉片一片(限當月使用)",
    note: "加菜獎",
    asset: "./assets/transparent/pork-belly.png",
    weight: 6, reelScale: 1.28
  },
  {
    id: "ember-grill", rank: "未中獎", label: "熄火炭爐", detail: "炭火待起",
    result: "本次未中獎",
    reward: "很可惜,這次沒中獎。明天再來試試手氣!",
    note: "明日再試一次",
    asset: "./assets/transparent/ember-grill.png",
    weight: 14, reelScale: 1.2
  }
];

const REPEAT_SETS = 12;
const BASE_SET_INDEX = 3;
const DAILY_KEY = "uenoSlotDate";
const PRIZE_KEY = "uenoSlotPrize";

const spinButton = document.getElementById("spinButton");
const spinButtonText = spinButton.querySelector(".spin-button__text");
const resultLabel = document.getElementById("resultLabel");
const resultDetail = document.getElementById("resultDetail");
const resultIcon = document.getElementById("resultIcon");
const resultCS = document.getElementById("resultCS");
const prizeCards = document.getElementById("prizeCards");
const reelTracks = [...document.querySelectorAll(".reel-track")];

let reelHeight = 0;
let isSpinning = false;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function hasSpunToday() {
  return localStorage.getItem(DAILY_KEY) === todayKey();
}

function buildPrizeCards() {
  prizeCards.innerHTML = "";
  for (const prize of PRIZES) {
    const article = document.createElement("article");
    article.className = "prize-card";
    article.dataset.prizeId = prize.id;
    article.innerHTML = `
      <div class="prize-card__rank">${prize.rank}</div>
      <div class="prize-card__icon">
        <img src="${prize.asset}" alt="${prize.label}" />
      </div>
      <p class="prize-card__name">${prize.label}</p>
      <p class="prize-card__note">${prize.note}</p>
    `;
    prizeCards.appendChild(article);
  }
}

function buildReels() {
  const repeated = [];
  for (let i = 0; i < REPEAT_SETS; i += 1) repeated.push(...PRIZES);
  for (const track of reelTracks) {
    track.innerHTML = "";
    for (const prize of repeated) {
      const symbol = document.createElement("div");
      symbol.className = "reel-symbol";
      symbol.innerHTML = `
        <div class="reel-symbol__plate" data-prize-id="${prize.id}">
          <img src="${prize.asset}" alt="" style="--reel-scale:${prize.reelScale};" />
        </div>
      `;
      track.appendChild(symbol);
    }
  }
}

function measureReels() {
  const windowNode = document.querySelector(".reel-window");
  if (!windowNode) return;
  reelHeight = windowNode.clientHeight;
  for (const track of reelTracks) {
    for (const symbol of track.children) {
      symbol.style.height = `${reelHeight}px`;
    }
  }
}

function setReelToPrize(track, prizeIndex) {
  const normalizedIndex = prizeIndex + PRIZES.length * BASE_SET_INDEX;
  track.style.transition = "none";
  track.style.transform = `translateY(${-normalizedIndex * reelHeight}px)`;
  track.dataset.position = String(normalizedIndex);
}

function weightedPick() {
  const total = PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
  let roll = Math.random() * total;
  for (const prize of PRIZES) {
    roll -= prize.weight;
    if (roll <= 0) return prize;
  }
  return PRIZES[PRIZES.length - 1];
}

function setActivePrize(prizeId) {
  for (const card of prizeCards.children) {
    card.classList.toggle("is-active", card.dataset.prizeId === prizeId);
  }
}

function updateResult(prize, fromSpin) {
  resultLabel.textContent = prize.result;
  resultDetail.textContent = prize.reward;
  resultIcon.src = prize.asset;
  resultIcon.alt = prize.label;
  if (resultCS) {
    resultCS.textContent = prize.id === "ember-grill"
      ? ""
      : "📸 請截圖此畫面傳給官方客服核銷您的獎品";
  }
  setActivePrize(prize.id);
  if (fromSpin) {
    localStorage.setItem(DAILY_KEY, todayKey());
    localStorage.setItem(PRIZE_KEY, prize.id);
  }
}

function lockButtonForToday() {
  spinButton.disabled = true;
  if (spinButtonText) spinButtonText.textContent = "今日已抽過";
}

function spinTrack(track, prizeIndex, reelIndex) {
  return new Promise((resolve) => {
    const loops = BASE_SET_INDEX + 3 + reelIndex * 2;
    const targetPosition = prizeIndex + PRIZES.length * loops;
    const duration = 1600 + reelIndex * 420;
    track.style.transition = `transform ${duration}ms cubic-bezier(.12,.78,.18,1)`;
    track.style.transform = `translateY(${-targetPosition * reelHeight}px)`;
    const handleStop = () => {
      track.removeEventListener("transitionend", handleStop);
      setReelToPrize(track, prizeIndex);
      resolve();
    };
    track.addEventListener("transitionend", handleStop, { once: true });
  });
}

async function startSpin() {
  if (isSpinning || reelHeight === 0) return;
  if (hasSpunToday()) { lockButtonForToday(); return; }

  isSpinning = true;
  spinButton.disabled = true;
  resultLabel.textContent = "抽獎中";
  resultDetail.textContent = "三軸正在依序停下。";
  if (resultCS) resultCS.textContent = "";

  const selectedPrize = weightedPick();
  const prizeIndex = PRIZES.findIndex((prize) => prize.id === selectedPrize.id);
  const jobs = reelTracks.map((track, index) => spinTrack(track, prizeIndex, index));
  await Promise.all(jobs);

  updateResult(selectedPrize, true);
  isSpinning = false;
  lockButtonForToday();
}

function syncLayout() {
  measureReels();
  const activePrizeId = [...prizeCards.children].find((card) => card.classList.contains("is-active"))?.dataset.prizeId;
  const activeIndex = Math.max(0, PRIZES.findIndex((prize) => prize.id === activePrizeId));
  for (const track of reelTracks) {
    setReelToPrize(track, activeIndex);
  }
}

buildPrizeCards();
buildReels();

// 初始：若今日已抽過,恢復上次結果並鎖住按鈕
const storedPrizeId = hasSpunToday() ? localStorage.getItem(PRIZE_KEY) : null;
const storedPrize = storedPrizeId ? PRIZES.find((p) => p.id === storedPrizeId) : null;
setActivePrize(storedPrize ? storedPrize.id : "ember-grill");
syncLayout();
if (storedPrize) {
  updateResult(storedPrize, false);
  lockButtonForToday();
}

window.addEventListener("resize", syncLayout);
spinButton.addEventListener("click", startSpin);
