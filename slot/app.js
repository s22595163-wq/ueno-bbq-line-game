const PRIZES = [
  {
    id: "crown",
    rank: "一獎",
    label: "皇冠禮",
    detail: "紅寶皇冠",
    result: "抽中皇冠禮",
    note: "最高獎項",
    asset: "./assets/transparent/crown.png",
    weight: 2,
    reelScale: 1.18
  },
  {
    id: "vip-card",
    rank: "二獎",
    label: "VIP 卡",
    detail: "黑金會員卡",
    result: "抽中 VIP 卡",
    note: "會員資格",
    asset: "./assets/transparent/vip-card.png",
    weight: 3,
    reelScale: 1.42
  },
  {
    id: "bento",
    rank: "三獎",
    label: "豪華便當",
    detail: "燒肉便當",
    result: "抽中豪華便當",
    note: "人氣主餐",
    asset: "./assets/transparent/bento.png",
    weight: 4,
    reelScale: 1.26
  },
  {
    id: "coupon",
    rank: "四獎",
    label: "折價券",
    detail: "黑金券面",
    result: "抽中折價券",
    note: "下次折抵",
    asset: "./assets/transparent/coupon.png",
    weight: 5,
    reelScale: 1.48
  },
  {
    id: "pork-belly",
    rank: "五獎",
    label: "五花肉",
    detail: "燒肉單品",
    result: "抽中五花肉",
    note: "加菜獎",
    asset: "./assets/transparent/pork-belly.png",
    weight: 6,
    reelScale: 1.28
  },
  {
    id: "ember-grill",
    rank: "未中獎",
    label: "熄火炭爐",
    detail: "炭火待起",
    result: "本次未中獎",
    note: "可再試一次",
    asset: "./assets/transparent/ember-grill.png",
    weight: 14,
    reelScale: 1.2
  }
];

const REPEAT_SETS = 12;
const BASE_SET_INDEX = 3;

const spinButton = document.getElementById("spinButton");
const resultLabel = document.getElementById("resultLabel");
const resultDetail = document.getElementById("resultDetail");
const resultIcon = document.getElementById("resultIcon");
const prizeCards = document.getElementById("prizeCards");
const reelTracks = [...document.querySelectorAll(".reel-track")];

let reelHeight = 0;
let isSpinning = false;

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

  for (let i = 0; i < REPEAT_SETS; i += 1) {
    repeated.push(...PRIZES);
  }

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
  if (!windowNode) {
    return;
  }

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
    if (roll <= 0) {
      return prize;
    }
  }

  return PRIZES[PRIZES.length - 1];
}

function setActivePrize(prizeId) {
  for (const card of prizeCards.children) {
    card.classList.toggle("is-active", card.dataset.prizeId === prizeId);
  }
}

function updateResult(prize) {
  resultLabel.textContent = prize.result;
  resultDetail.textContent = `${prize.rank}：${prize.detail}`;
  resultIcon.src = prize.asset;
  resultIcon.alt = prize.label;
  setActivePrize(prize.id);
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
  if (isSpinning || reelHeight === 0) {
    return;
  }

  isSpinning = true;
  spinButton.disabled = true;
  resultLabel.textContent = "抽獎中";
  resultDetail.textContent = "三軸正在依序停下。";

  const selectedPrize = weightedPick();
  const prizeIndex = PRIZES.findIndex((prize) => prize.id === selectedPrize.id);

  const jobs = reelTracks.map((track, index) => spinTrack(track, prizeIndex, index));
  await Promise.all(jobs);

  updateResult(selectedPrize);
  spinButton.disabled = false;
  isSpinning = false;
}

function syncLayout() {
  measureReels();
  const activePrizeId = [...prizeCards.children].find((card) => card.classList.contains("is-active"))?.dataset.prizeId;
  const activeIndex = Math.max(
    0,
    PRIZES.findIndex((prize) => prize.id === activePrizeId)
  );

  for (const track of reelTracks) {
    setReelToPrize(track, activeIndex);
  }
}

buildPrizeCards();
buildReels();
setActivePrize("ember-grill");
syncLayout();

window.addEventListener("resize", syncLayout);
spinButton.addEventListener("click", startSpin);
