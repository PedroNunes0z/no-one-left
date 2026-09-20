import { WEAPONS, weaponId, isWeapon } from "./weapons";
import {
  WORLD,
  STORY_WORLD,
  STORY_LOBBY,
  ROADS,
  HOUSES,
  DISTRICTS,
  MAP_BLUEPRINT,
  MAP_CELL,
} from "./world";
import { assetUrl, images } from "./assets";

import {
  PACKS,
  ITEM_PHYSICS,
  isUsable,
  carryWeight,
  canPlace,
  ITEMS,
  RECIPES,
  SHELTERS,
  readSave,
  clockText,
  isNight,
  type SaveData,
  type ItemId,
  type RecipeId,
} from "./model";

export interface Settings {
  music: number;
  effects: number;
  sound: boolean;
}

export interface GameApi {
  grid: (uid: string, x: number, y: number) => string;
  hotbar: (slot: number, uid: string | null) => string;
  drop: (uid: string) => string;
  equip: (uid: string) => string;
  repairWeapon: () => string;
  search: () => string;
  collect: (id: ItemId) => string;
  start: (save?: SaveData) => void;
  startStory: () => void;
  prologue: (showLogo: () => void, done: () => void) => void;
  pause: (paused: boolean) => void;
  save: () => boolean;
  quit: () => void;
  consume: (id: ItemId, uid?: string) => string;
  craft: (id: RecipeId) => string;
  rest: () => string;
  repair: () => string;
  transfer: (id: ItemId, deposit: boolean) => string;
  settings: (settings: Settings) => void;
  touch: (key: string, down: boolean) => void;
  uiSound: (key: "backpack-open" | "backpack-close") => void;
  activateAudio: () => void;
}

const paths: Record<string, string> = {
  arrow: "M4 12h15m-6-6 6 6-6 6",
  close: "m5 5 14 14M19 5 5 19",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4",
  bag: "M8 6V5a4 4 0 0 1 8 0v1M6 6h12l2 15H4L6 6Zm2 8h8v4H8v-4Z",
  map: "m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16",
  pause: "M8 5v14M16 5v14",
  heart: "M20 5c-2-2-6-1-8 2-2-3-6-4-8-2-3 3-1 6 8 14 9-8 11-11 8-14Z",
  food: "M5 3v7a3 3 0 0 0 6 0V3M8 3v18M19 3c-5 3-5 10 0 10V3Zm0 10v8",
  water: "M12 2c-1 4-7 10-7 14a7 7 0 0 0 14 0c0-4-6-10-7-14ZM9 17l2 2",
  stamina: "m13 2-8 12h7l-1 8 8-12h-7l1-8Z",
  moon: "M20 15a8 8 0 0 1-11-11 9 9 0 1 0 11 11Z",
  rest: "M3 19V7m18 12v-9H3m2 0V6h5v4m2 0V6h7v4M3 16h18",
  radio: "M3 9h18v12H3V9Zm0 0 16-6M6 13h5v5H6v-5Zm9 0h3m-3 4h3",
  shield: "m12 2 8 3v7c0 5-5 8-8 10-3-2-8-5-8-10V5l8-3Z",
  volume: "M4 9h4l5-5v16l-5-5H4V9Zm12-2c4 2 4 8 0 10m2-13c7 4 7 12 0 16",
};

export const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.arrow}"/></svg>`;

const gameLogo = (extra = "") =>
  `<div class="game-logo ${extra}" aria-label="NO ONE LEFT"><div class="logo-line logo-top" aria-hidden="true"><span>N</span><span>O</span><span>O</span><span>N</span><span>E</span></div><div class="logo-line logo-bottom" aria-hidden="true"><span>L</span><span>E</span><span>F</span><span>T</span></div></div>`;

export function itemImage(id: string) {
  return images[id] ? assetUrl(images[id]) : `/icons/${id}.svg`;
}

function readSettings(): Settings {
  try {
    const s = JSON.parse(localStorage.getItem("no-one-left.settings") || "{}");
    return {
      music:
        typeof s.music === "number" ? Math.max(0, Math.min(1, s.music)) : 0.45,
      effects:
        typeof s.effects === "number"
          ? Math.max(0, Math.min(1, s.effects))
          : 0.65,
      sound: typeof s.sound === "boolean" ? s.sound : true,
    };
  } catch {
    return { music: 0.45, effects: 0.65, sound: true };
  }
}

export class UI {
  api: GameApi | null = null;
  state: SaveData | null = null;
  facing = 0;
  settings = readSettings();
  active = false;
  ready = false;
  selectedUid = "";
  dragUid = "";
  dragOffset = { x: 0, y: 0 };
  panel = "";
  tab = "supplies";
  currentShelter = "";
  nearbyCamp = false;
  dayTransitionTimer = 0;
  lastHotbarSignature = "";
  lastMinimapAt = 0;
  root = document.getElementById("ui")!;

  constructor() {
    this.root.innerHTML = `<section class="prologue" id="prologue" aria-label="Introdução">${gameLogo("intro-logo")}<button class="intro-continue" data-action="intro-continue">CLIQUE PARA CONTINUAR</button></section><section class="menu" id="menu" aria-label="Menu principal">
      <div class="menu-bg" id="bg-a"></div><div class="menu-bg" id="bg-b" style="opacity:0"></div><div class="menu-shade"></div><div class="grain"></div>
      <header class="menu-header"><div class="brand"><div class="brandmark">N</div><div class="brand-copy">NO ONE LEFT<span>UM JOGO DE SOBREVIVÊNCIA</span></div></div><div class="version"><i class="status-dot"></i> V. 2.0 / SOBREVIVÊNCIA<button class="text-button menu-audio" id="menu-audio" type="button" aria-label="Ativar ou desativar áudio">ATIVAR ÁUDIO</button></div></header>
      <main class="menu-main"><div class="chapter">O MUNDO PAROU. VOCÊ, AINDA NÃO.</div>${gameLogo("menu-logo")}
        <p class="menu-intro">As cidades se calaram. As noites ficaram longas. Encontre recursos, um abrigo e uma razão para continuar.</p>
        <div class="button-stack"><button class="primary menu-play" data-action="new" disabled>INICIAR SOBREVIVÊNCIA ${icon("arrow")}</button><button class="secondary menu-play" data-action="story" disabled>MODO HISTÓRIA ${icon("arrow")}</button><button class="secondary menu-play hidden" id="continue" data-action="continue">CONTINUAR JORNADA ${icon("arrow")}</button></div>
        <div class="menu-links"><button class="text-button" data-action="guide">Como sobreviver</button><button class="text-button" data-action="settings">Opções</button></div>
        <div id="loading" style="margin-top:18px"><span class="loading-text" id="loading-text">PREPARANDO O MUNDO · 0%</span><div class="loading-line"><span id="loading-bar"></span></div></div>
      </main>
      <aside class="menu-note"><div class="eyebrow">CADA NOITE É UMA CONQUISTA</div><p>Explore o que restou.<br>Cuide de suas reservas.<br>Sobreviva por mais um dia.</p><div class="coordinates">SETOR 07 / ZONA DE EXCLUSÃO</div></aside>
      <footer class="menu-footer"><div class="footer-left"><span><i class="status-dot"></i> &nbsp; SOBREVIVA AO SILÊNCIO</span><div class="scene-indicator">${[0, 1, 2, 3].map((i) => `<i class="${i === 0 ? "active" : ""}"></i>`).join("")}</div></div><span class="footer-right"><a href="/credits.html" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;margin-right:24px">CRÉDITOS</a>EXPLORAR · RESISTIR · RECOMEÇAR</span></footer>
    </section>
    <section class="hud hidden" id="hud" aria-label="Painel de sobrevivência">
      <div class="hud-top"><div class="hud-id"><div class="brandmark">N</div><div><strong>NO ONE LEFT</strong><small id="location">CIDADE DAS CINZAS</small></div></div><div class="hud-actions"><button class="icon-button" data-action="inventory" title="Inventário (I)" aria-label="Abrir inventário">${icon("bag")}</button><button class="icon-button" data-action="map" title="Mapa (M)" aria-label="Abrir mapa">${icon("map")}</button><button class="icon-button" data-action="pause" title="Pausar (Esc)" aria-label="Pausar">${icon("pause")}</button></div></div>
      <div class="hud-clock"><b id="clock">17:20</b><small id="day">DIA 01 · ENTARDECER</small></div>
      <aside class="objective"><div class="eyebrow">SOBREVIVA AO PRÓXIMO DIA</div><p id="objective-title">Encontre os três abrigos</p><small id="objective-detail">Procure as escotilhas marcadas no mapa.</small><div class="objective-progress" id="objective-progress"></div></aside>
      <div class="vitals">${(["health", "hunger", "thirst", "stamina"] as const).map((key, i) => `<div class="vital ${key}" id="vital-${key}"><div class="vital-label"><span>${icon(["heart", "food", "water", "stamina"][i])}${["Vida", "Saciedade", "Hidratação", "Energia"][i]}</span><b id="value-${key}">100</b></div><div class="vital-track"><i id="bar-${key}" style="width:100%"></i></div></div>`).join("")}<div class="conditions" id="conditions">SEM INFECÇÃO · SEM PROTEÇÃO</div></div>
      <div class="quickbar" id="hotbar"><div class="quickslot weapon-slot"><img src="${itemImage("weapon")}" alt="Pistola"/><div><strong id="ammo">8 / 24</strong><small>PISTOLA &nbsp; [R]</small></div></div><div id="hotbar-slots"></div></div>
      <div class="hint hidden" id="hint"><kbd>E</kbd><span id="hint-text"></span></div>
      <aside class="minimap"><header><span>LOCALIZAÇÃO</span><b>N ↑</b></header><canvas id="minimap" width="180" height="148" aria-label="Minimapa com sua posição, orientação e abrigos"></canvas><small id="minimap-caption">SETOR 07</small></aside>
      <div class="game-help"><span><kbd>W A S D</kbd> mover</span><span><kbd>SHIFT</kbd> correr</span><span><kbd>F</kbd> golpear</span></div>
      <div class="mobile-controls"><div class="dpad"><button class="touch-button up" data-touch="up" aria-label="Mover para cima">↑</button><button class="touch-button left" data-touch="left" aria-label="Mover para esquerda">←</button><button class="touch-button down" data-touch="down" aria-label="Mover para baixo">↓</button><button class="touch-button right" data-touch="right" aria-label="Mover para direita">→</button></div><div class="touch-actions"><button class="touch-button" data-touch="sprint">CORRER</button><button class="touch-button" data-touch="interact">USAR</button><button class="touch-button" data-touch="melee">SOCO</button><button class="touch-button" data-touch="shoot">TIRO</button><button class="touch-button" data-touch="crouch">AGACHAR</button><button class="touch-button" data-touch="aim">MIRA</button><button class="touch-button" data-touch="block">DEFESA</button></div></div>
    </section><div id="day-transition" class="day-transition" aria-live="polite"></div><div id="toasts" class="toasts" aria-live="polite"></div><div id="modal-host"></div><div id="crosshair" class="crosshair"></div>`;

    const backgrounds = [2, 4, 1, 3].map((n) =>
      assetUrl(
        `assets/MenuBG/PNG/Postapocalypce${n}/Pale/postapocalypse${n}.png`,
      ),
    );

    document.getElementById("bg-a")!.style.backgroundImage =
      `url("${backgrounds[0]}")`;

    let index = 0,
      showA = true;

    setInterval(() => {
      index = (index + 1) % 4;
      showA = !showA;
      const next = document.getElementById(showA ? "bg-a" : "bg-b")!;

      next.style.backgroundImage = `url("${backgrounds[index]}")`;
      next.style.opacity = "1";

      document.getElementById(showA ? "bg-b" : "bg-a")!.style.opacity = "0";
      this.root
        .querySelectorAll(".scene-indicator i")
        .forEach((el, i) => el.classList.toggle("active", i === index));
    }, 14000);

    this.refreshContinue();
    this.root.addEventListener("click", (event) => this.click(event));
    this.root.addEventListener("input", (event) => this.changeSettings(event));

    this.root
      .querySelectorAll<HTMLButtonElement>("[data-touch]")
      .forEach((button) => {
        const key = button.dataset.touch!;
        button.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          button.setPointerCapture(event.pointerId);
          this.api?.touch(key, true);
        });

        ["pointerup", "pointercancel", "lostpointercapture"].forEach((e) =>
          button.addEventListener(e, () => this.api?.touch(key, false)),
        );
      });

    document.addEventListener("keydown", (event) => {
      if (
        !this.active ||
        event.repeat ||
        (event.target as HTMLElement).tagName === "INPUT"
      )
        return;

      if (["death"].includes(this.panel)) return;

      const k = event.key.toLowerCase();

      if (this.panel === "inventory" && k === "g" && this.selectedUid) {
        event.preventDefault();
        this.toast(this.api?.drop(this.selectedUid) || "");
        this.selectedUid = "";
        this.render();
        return;
      }
      if (
        this.panel === "inventory" &&
        event.key.startsWith("Arrow") &&
        this.selectedUid &&
        this.state
      ) {
        const i = this.state.grid.find((g) => g.uid === this.selectedUid);
        if (i) {
          event.preventDefault();
          this.api?.grid(
            i.uid,
            i.x +
              (event.key === "ArrowRight"
                ? 1
                : event.key === "ArrowLeft"
                  ? -1
                  : 0),
            i.y +
              (event.key === "ArrowDown"
                ? 1
                : event.key === "ArrowUp"
                  ? -1
                  : 0),
          );

          this.render();
        }
        return;
      }

      if (k === "tab" && this.panel) {
        return;
      }

      const p =
        k === "i" || k === "tab"
          ? "inventory"
          : k === "m"
            ? "map"
            : k === "escape"
              ? "pause"
              : "";

      if (p) {
        event.preventDefault();
        this.panel ? this.close() : this.open(p);
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.active && !this.panel) this.open("pause");
    });

    window.addEventListener("blur", () => {
      if (this.active && !this.panel) this.open("pause");
    });
    window.addEventListener("beforeunload", () => {
      if (this.active) this.api?.save();
    });

    this.bindInventoryDrag();
  }

  refreshContinue() {
    const save = readSave();
    const b = document.getElementById("continue")!;
    b.classList.toggle("hidden", !save || save.vitals.health <= 0);
    b.innerHTML = `CONTINUAR DIA ${save ? Math.floor(save.minutes / 1440) + 1 : 1} ${icon("arrow")}`;
  }

  progress(value: number) {
    document.getElementById("loading-text")!.textContent =
      `PREPARANDO O MUNDO · ${Math.round(value * 100)}%`;
    document.getElementById("loading-bar")!.style.width = `${value * 100}%`;
  }
  loaded() {
    this.ready = true;
    this.root.querySelector<HTMLButtonElement>("[data-action=new]")!.disabled =
      false;
    this.root.querySelector<HTMLButtonElement>(
      "[data-action=story]",
    )!.disabled = false;

    document.getElementById("loading")!.classList.add("hidden");
  }
  activateAudio() {
    if (this.settings.sound) this.api?.activateAudio();
  }

  loadingError(file: string) {
    document.getElementById("loading-text")!.textContent =
      `FALHA AO CARREGAR: ${file}. Atualize a página.`;
  }

  start(save?: SaveData) {
    this.root.dataset.mode = "survival";

    if (!this.ready || !this.api) return;

    this.panel = "";
    this.active = true;
    this.currentShelter = "";
    document.getElementById("modal-host")!.innerHTML = "";
    document.getElementById("menu")!.classList.add("hidden");
    document.getElementById("hud")!.classList.remove("hidden");
    this.api.start(save);
    this.api.settings(this.settings);
    this.showDay(Math.floor((save?.minutes ?? 0) / 1440) + 1);
  }
  showDay(day: number) {
    const title = document.getElementById("day-transition")!;
    window.clearTimeout(this.dayTransitionTimer);
    title.textContent = `DIA ${day}`;
    title.classList.remove("show");
    void title.offsetWidth;
    title.classList.add("show");
    this.dayTransitionTimer = window.setTimeout(
      () => title.classList.remove("show"),
      2800,
    );
  }

  menu() {
    this.root.dataset.mode = "";
    this.active = false;
    this.panel = "";
    this.currentShelter = "";
    document.getElementById("modal-host")!.innerHTML = "";
    document.getElementById("hud")!.classList.add("hidden");
    document.getElementById("menu")!.classList.remove("hidden");
    document.getElementById("crosshair")!.style.display = "none";
    this.refreshContinue();
  }
  update(state: SaveData, shelter = "", camp = false, facing = 0) {
    this.state = state;
    this.facing = facing;
    this.currentShelter = shelter;
    this.nearbyCamp = camp;
    if (!this.active) return;
    for (const key of ["health", "hunger", "thirst", "stamina"] as const) {
      const v = state.vitals[key];
      document.getElementById(`value-${key}`)!.textContent = String(
        Math.ceil(v),
      );
      document.getElementById(`bar-${key}`)!.style.width = `${v}%`;
      document
        .getElementById(`vital-${key}`)!
        .classList.toggle("warning", v < 25);
    }
    document.getElementById("clock")!.textContent = clockText(state.minutes);
    const hour = (state.minutes % 1440) / 60;
    document.getElementById("day")!.textContent =
      `DIA ${String(Math.floor(state.minutes / 1440) + 1).padStart(2, "0")} · ${isNight(state.minutes) ? "NOITE" : hour >= 16 ? "ENTARDECER" : "DIA"}`;
    document.getElementById("conditions")!.textContent =
      `${state.vitals.infection > 0 ? `INFECÇÃO ${Math.ceil(state.vitals.infection)}%` : "SEM INFECÇÃO"} · ${state.vitals.armor > 0 ? `PROTEÇÃO ${state.vitals.armor}%` : "SEM PROTEÇÃO"}`;
    document
      .getElementById("conditions")!
      .classList.toggle("danger", state.vitals.infection >= 30);
    const weapon = weaponId(state),
      spec = WEAPONS[weapon];
    const weaponImage =
      this.root.querySelector<HTMLImageElement>(".weapon-slot img")!;
    weaponImage.src = itemImage(weapon);
    weaponImage.alt = spec.name;
    this.root.querySelector(".weapon-slot small")!.textContent =
      spec.name.toUpperCase() + " [R]";
    document.getElementById("ammo")!.textContent =
      `${state.ammo} / ${state.inventory.ammo}`;
    const hotbarSignature = JSON.stringify({
      hotbar: state.hotbar,
      grid: state.grid.map(({ uid, item, count, durability }) => [
        uid,
        item,
        count,
        Math.ceil(durability),
      ]),
    });
    if (hotbarSignature !== this.lastHotbarSignature) {
      this.lastHotbarSignature = hotbarSignature;
      this.renderHotbar();
    }
    const now = performance.now();
    if (now - this.lastMinimapAt >= 300) {
      this.lastMinimapAt = now;
      this.drawMinimap();
    }
    const sceneMode = this.root.dataset.mode || "survival";
    const objectiveLabel = this.root.querySelector<HTMLElement>(
      ".objective .eyebrow",
    )!;
    if (sceneMode === "story") {
      objectiveLabel.textContent = "MODO HISTÓRIA · ZONA PACÍFICA";
      document.getElementById("location")!.textContent = "LOBBY DA HISTÓRIA";
      document.getElementById("objective-title")!.textContent = "O PRÓLOGO";
      document.getElementById("objective-detail")!.textContent =
        "Encontre outros sobreviventes ao redor da fogueira. A história começa além do limite do lobby.";
      document.getElementById("objective-progress")!.innerHTML = "";
      return;
    }
    objectiveLabel.textContent = "SOBREVIVA AO PRÓXIMO DIA";
    const found = SHELTERS.filter(
      (s) => state.shelters[s.id].discovered,
    ).length;
    document.getElementById("objective-title")!.textContent =
      "Resista. Um dia de cada vez.";
    document.getElementById("objective-detail")!.textContent =
      `${Math.floor(state.elapsed / 60)}m ${Math.floor(state.elapsed % 60)}s sobrevividos · ${found}/3 abrigos · ${carryWeight(state).toFixed(1)} / ${PACKS[state.backpack].capacity} kg`;
    document.getElementById("objective-progress")!.innerHTML = SHELTERS.map(
      (s) =>
        `<span class="${state.shelters[s.id].discovered ? "done" : ""}"></span>`,
    ).join("");
    document.getElementById("location")!.textContent = shelter
      ? SHELTERS.find((s) => s.id === shelter)!.name.toUpperCase()
      : DISTRICTS.find(
          (d) =>
            state.x >= d.x &&
            state.x <= d.x + d.w &&
            state.y >= d.y &&
            state.y <= d.y + d.h,
        )?.name || "FLORESTA DO SILÊNCIO";
  }
  hint(text: string) {
    document.getElementById("hint")!.classList.toggle("hidden", !text);
    document.getElementById("hint-text")!.textContent = text;
  }
  toast(text: string) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    document.getElementById("toasts")!.append(el);
    setTimeout(() => el.remove(), 4500);
  }
  open(panel: string) {
    this.panel = panel;
    if (panel === "inventory") this.api?.uiSound("backpack-open");
    this.api?.pause(true);
    this.render();
  }
  close() {
    const closing = this.panel;
    this.panel = "";
    document.getElementById("modal-host")!.innerHTML = "";
    if (closing === "inventory") this.api?.uiSound("backpack-close");
    if (this.active) this.api?.pause(false);
  }
  shelter(id: string) {
    this.currentShelter = id;
    this.open("shelter");
  }
  finish() {
    this.open("death");
  }
  modal(title: string, eyebrow: string, body: string, compact = false) {
    document.getElementById("modal-host")!.innerHTML =
      `<div class="modal-backdrop"><section class="modal ${compact ? "compact" : ""}" role="dialog" aria-modal="true" aria-label="${title}" tabindex="-1"><header class="modal-head"><div><div class="eyebrow">${eyebrow}</div><h2>${title}</h2></div>${this.panel === "death" ? "" : `<button class="modal-close" data-action="close" aria-label="Fechar">${icon("close")}</button>`}</header>${body}</section></div>`;
    const modal = document.querySelector<HTMLElement>(".modal")!;
    modal.focus();
    modal.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const nodes = [
        ...modal.querySelectorAll<HTMLElement>("button:not(:disabled),input"),
      ];
      if (!nodes.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
  render() {
    const s = this.state;
    if (this.panel === "settings") {
      this.modal(
        "Opções",
        "FAÇA DO SILÊNCIO SEU ALIADO",
        `<label class="settings-row"><span>Áudio ativado<small>Trilha instrumental e efeitos ambientais</small></span><input type="checkbox" data-setting="sound" ${this.settings.sound ? "checked" : ""}/></label><label class="settings-row"><span>Música<small>Piano, cordas e ambientes sombrios</small></span><input type="range" min="0" max="1" step="0.05" value="${this.settings.music}" data-setting="music" aria-label="Volume da música"/></label><label class="settings-row"><span>Efeitos<small>Passos, tiros, portas e infectados</small></span><input type="range" min="0" max="1" step="0.05" value="${this.settings.effects}" data-setting="effects" aria-label="Volume dos efeitos"/></label><div class="settings-row"><span>Tela cheia</span><button class="small-button" data-action="fullscreen">Alternar</button></div><p class="inline-note">Suas opções são salvas neste navegador. O áudio começa após iniciar a partida.</p>`,
        true,
      );
      return;
    }
    if (this.panel === "guide") {
      this.modal(
        "Manual do sobrevivente",
        "APRENDA ANTES QUE A NOITE CHEGUE",
        `<div class="guide-grid"><div><h3>MANTENHA-SE VIVO</h3><p>Coma, beba e guarde bandagens. A fome e a sede esgotadas tiram sua vida. Água suja e comida estragada causam infecção; use antibióticos ou purifique a água nos abrigos.</p><h3>QUANTO TEMPO VOCÊ RESISTE?</h3><p>Não há resgate. Sobreviva pelo maior tempo possível. Explore os três bunkers, organize reservas e prepare-se para noites cada vez mais perigosas.</p><h3>USE O QUE RESTOU</h3><p>Os itens não brilham. Procure no chão e pesquise móveis, armários e porta-malas com E. Arraste itens pela grade e para os cinco atalhos. Mochilas I, II e III mudam o espaço e o limite de peso. Fabrique proteção e acampamentos no inventário. Frutas caem das árvores e estragam com o tempo. Asse carne e batata no fogão dos bunkers ou junto à fogueira do acampamento. O minimapa mostra sua posição e orientação. Nos bunkers você pode descansar, purificar água e guardar recursos.</p></div><div><h3>CONTROLES</h3>${[
          ["W A S D / ↑ ↓ ← →", "Mover"],
          ["SHIFT", "Correr"],
          ["MOUSE / CLIQUE ESQUERDO", "Direção / atirar"],
          ["F", "Dar soco"],
          ["E", "Coletar / entrar / sair"],
          ["R", "Recarregar"],
          ["CTRL", "Alternar agachado / em pé"],
          ["Q", "Defender (segurar) · pode falhar"],
          ["BOTÃO DIREITO", "Mirar com zoom (segurar)"],
          ["U", "Soltar / ocultar mouse"],
          ["G", "Soltar item selecionado"],
          ["1 A 5", "Usar atalhos escolhidos"],
          ["I / TAB", "Inventário e fabricação"],
          ["M / ESC", "Mapa / pausa"],
        ]
          .map(
            ([k, t]) =>
              `<div class="key-row"><kbd>${k}</kbd><span>${t}</span></div>`,
          )
          .join(
            "",
          )}<p>À noite, os zumbis enxergam mais longe e perseguem mais rápido. Correr e atirar atraem atenção. Agachar reduz o alcance de percepção dos zumbis em 88%. Atirar reduz muito sua velocidade. Q consome energia: 75% de chance de bloquear. Bunkers são seguros. Água custa energia; afastar-se da costa causa afogamento.</p></div></div><div class="modal-foot"><span>Salvamento automático a cada 15 segundos.</span><span>Touch: use os botões na tela.</span></div>`,
      );
      return;
    }
    if (this.panel === "replace") {
      this.modal(
        "Uma nova jornada",
        "SEU PROGRESSO ATUAL",
        `<p class="ending-copy">Iniciar uma nova sobrevivência substitui a partida salva neste navegador.</p><div class="pause-options"><button class="primary" data-action="new-confirmed">INICIAR NOVA PARTIDA ${icon("arrow")}</button><button class="secondary" data-action="close">Voltar</button></div>`,
        true,
      );
      return;
    }
    if (this.panel === "pause") {
      this.modal(
        "Um momento de silêncio",
        "JORNADA PAUSADA",
        `<p class="ending-copy">O mundo pode esperar um pouco.</p><div class="pause-options"><button class="primary" data-action="close">CONTINUAR ${icon("arrow")}</button><button class="secondary" data-action="save">Salvar jornada</button><button class="secondary" data-action="settings">Opções</button><button class="secondary" data-action="guide">Como sobreviver</button><button class="secondary" data-action="quit">Salvar e voltar ao menu</button></div>`,
        true,
      );
      return;
    }
    if (this.panel === "death" && s) {
      this.modal(
        "Ninguém ficou.",
        "SUA JORNADA TERMINOU",
        `<p class="ending-copy">Sua sobrevivência terminou. Prepare suas reservas e tente resistir por mais tempo na próxima jornada.</p><div class="end-stats"><div><b>${Math.floor(s.elapsed / 60)}m ${Math.floor(s.elapsed % 60)}s</b><small>SOBREVIVIDOS</small></div><div><b>${s.kills}</b><small>INFECTADOS</small></div><div><b>${SHELTERS.filter((t) => s.shelters[t.id].discovered).length}/3</b><small>ABRIGOS</small></div></div><div class="pause-options"><button class="primary" data-action="new-confirmed">RECOMEÇAR ${icon("arrow")}</button><button class="secondary" data-action="quit">Voltar ao menu</button></div>`,
        true,
      );
      return;
    }
    if (!s) return;
    if (this.panel === "inventory") {
      const tabs = `<nav class="tabs"><button class="tab ${this.tab === "supplies" ? "active" : ""}" data-tab="supplies">INVENTÁRIO</button><button class="tab ${this.tab === "craft" ? "active" : ""}" data-tab="craft">FABRICAÇÃO</button>${this.currentShelter ? `<button class="tab ${this.tab === "stash" ? "active" : ""}" data-tab="stash">ARMAZENAMENTO</button>` : ""}</nav>`;
      let body = "";
      if (this.tab === "craft")
        body =
          `${this.nearbyCamp ? '<button class="small-button" data-action="rest">Descansar junto à fogueira</button>' : ""}<p class="inline-note">${this.currentShelter ? "Fogão disponível." : this.nearbyCamp ? "Fogueira disponível." : "Para cozinhar, aproxime-se de um acampamento ou use o fogão de um bunker."}</p>` +
          Object.entries(RECIPES)
            .map(([id, r]) => {
              const available =
                (!["cookMeat", "cookPotato"].includes(id) ||
                  !!this.currentShelter ||
                  this.nearbyCamp) &&
                Object.entries(r.cost).every(
                  ([key, n]) => s.inventory[key as ItemId] >= n,
                );
              return `<div class="recipe"><div><h3>${r.name}</h3><p>${r.description}</p><p class="cost">${Object.entries(
                r.cost,
              )
                .map(
                  ([key, n]) =>
                    `${n} ${ITEMS[key as ItemId].name} (${s.inventory[key as ItemId]})`,
                )
                .join(
                  " · ",
                )}</p></div><button class="small-button" data-craft="${id}" ${!available ? "disabled" : ""}>${["cookMeat", "cookPotato"].includes(id) ? "Cozinhar" : "Fabricar"}</button></div>`;
            })
            .join("");
      else if (this.tab === "stash" && this.currentShelter) {
        const stash = s.shelters[this.currentShelter].stash;
        body = `<p class="inline-note">Deposite uma unidade por vez ou retire suas reservas deste bunker.</p><div class="inventory-grid">${Object.entries(
          ITEMS,
        )
          .map(
            ([id, item]) =>
              `<div class="item-card"><div class="item-top"><img src="${itemImage(item.icon)}" alt=""/><span class="item-count">${stash[id as ItemId]}</span></div><h3>${item.name}</h3><p>Na mochila: ${s.inventory[id as ItemId]}</p><div style="display:flex;gap:5px"><button class="small-button" data-deposit="${id}" ${s.inventory[id as ItemId] === 0 ? "disabled" : ""}>Guardar</button><button class="small-button" data-withdraw="${id}" ${stash[id as ItemId] === 0 ? "disabled" : ""}>Retirar</button></div></div>`,
          )
          .join("")}</div>`;
      } else {
        this.tab = "supplies";
        body = this.inventoryBody();
      }
      this.modal(
        "O que você carrega",
        "MOCHILA DO SOBREVIVENTE",
        `${tabs}${body}<div class="modal-foot"><span>${s.vitals.armor > 0 ? `Proteção equipada · ${Math.round(s.vitals.armor)}% de redução de dano` : "Sem proteção equipada"}</span><span>Arraste para organizar · selecione e use G para soltar.</span></div>`,
      );
      return;
    }
    if (this.panel === "container") {
      const id = this.api?.search() || "",
        contents = s.containers[id];
      if (!contents) {
        this.close();
        return;
      }
      const ids = (Object.keys(ITEMS) as ItemId[]).filter(
        (i) => contents[i] > 0,
      );
      this.modal(
        "O que ficou para trás",
        "MÓVEL PESQUISADO",
        `<p class="inline-note">${carryWeight(s).toFixed(1)} / ${PACKS[s.backpack].capacity} kg na mochila. Pegue apenas o que conseguir carregar.</p><div class="search-items">${ids.map((i) => `<div class="search-item"><img src="${itemImage(ITEMS[i].icon)}" alt=""/><div><h3>${ITEMS[i].name}</h3><p>${contents[i]} unidades · ${ITEM_PHYSICS[i].weight} kg cada</p></div><button class="small-button" data-collect="${i}">Pegar</button></div>`).join("") || '<p class="empty-container">Vazio. Alguém chegou antes.</p>'}</div>`,
        true,
      );
      return;
    }
    if (this.panel === "shelter") {
      const shelter = SHELTERS.find((t) => t.id === this.currentShelter);
      if (!shelter) {
        this.close();
        return;
      }
      this.modal(
        shelter.name,
        `BUNKER ${shelter.label} / ZONA SEGURA`,
        `<div class="shelter-banner" style="background-image:url('${assetUrl("assets/EspecialRoom/Shelter/Asset pack shelter/Cover.png")}')"><span>${shelter.label}</span></div><p class="shelter-description">${shelter.description}</p><div class="shelter-actions"><button class="secondary" data-action="rest">${icon("rest")}<div>Descansar 4 horas<small>+35 vida · −12 saciedade e hidratação</small></div></button><button class="secondary" data-action="stash">${icon("bag")}<div>Guardar suprimentos<small>Reservas exclusivas deste bunker</small></div></button><button class="secondary" data-action="craft-panel">${icon("shield")}<div>Fabricar e reforçar<small>${s.shelters[shelter.id].barricaded ? "Abrigo reforçado" : "Proteção, bandagens e água potável"}</small></div></button>${shelter.id === "signal" ? `<button class="secondary" data-action="repair">${icon("radio")}<div>${s.radio ? "Rádio funcionando" : "Reparar o rádio"}<small>${s.radio ? "Base de sobrevivência · sem resgate" : "6 sucatas · manter o rádio"}</small></div></button>` : ""}</div><div class="modal-foot"><span>Bunkers protegem você dos infectados.</span><button class="text-button" data-action="close">Explorar o interior ${icon("arrow")}</button></div>`,
      );
      return;
    }
    if (this.panel === "map") {
      const story = this.root.dataset.mode === "story";
      this.modal(
        story ? "Lobby da história" : "O mundo que restou",
        story ? "ZONA PACÍFICA / MAPA LOCAL" : "SETOR 07 / MAPA DE EXPLORAÇÃO",
        story
          ? `<div class="map-wrap"><canvas id="world-map" width="800" height="510" aria-label="Mapa local do lobby da história"></canvas></div><div class="map-legend"><span><i class="player"></i>Você</span><span><i></i>Fogueira</span><span><i style="background:#8a9978"></i>Casa de música</span></div><div class="map-locations"><div><b>LOBBY DA HISTÓRIA</b>Zona pacífica, sem infectados e sem combate.</div></div>`
          : `<div class="map-wrap"><canvas id="world-map" width="800" height="510" aria-label="Mapa: cidade ao centro, bunker 01 a noroeste, bunker 02 a nordeste e bunker 03 a sudoeste"></canvas></div><div class="map-legend"><span><i class="player"></i>Você</span><span><i></i>Abrigo explorado</span><span><i style="background:#8a9978"></i>Abrigo desconhecido</span></div><div class="map-locations">${SHELTERS.map((t) => `<div><b>${t.label} / ${t.name}</b>${s.shelters[t.id].discovered ? "EXPLORADO" : "EXPLORE A ESCOTILHA"} · ${Math.round(Math.hypot(t.x - s.x, t.y - s.y) / 32)} m</div>`).join("")}</div>`,
      );
      this.drawMap();
      return;
    }
  }
  renderHotbar() {
    if (!this.state) return;
    const s = this.state;
    document.getElementById("hotbar-slots")!.innerHTML = s.hotbar
      .map((uid, i) => {
        const g = s.grid.find((g) => g.uid === uid);
        return `<button class="quickslot ${g?.uid === this.selectedUid ? "chosen" : ""}" data-quick="${i}" data-slot="${i}" title="${g ? ITEMS[g.item].name : "Atalho vazio"} (${i + 1})"><kbd>${i + 1}</kbd>${g ? `<img src="${itemImage(ITEMS[g.item].icon)}" alt="${ITEMS[g.item].name}"/><b>${g.count}</b>` : '<span class="slot-empty">—</span>'}</button>`;
      })
      .join("");
  }
  inventoryBody() {
    const s = this.state!,
      p = PACKS[s.backpack],
      selected = s.grid.find((g) => g.uid === this.selectedUid);
    if (!selected) this.selectedUid = "";
    return `<div class="pack-summary"><div><h3>${p.name}</h3><small>${p.columns} × ${p.rows} espaços · mochila ${p.weight} kg</small></div><b>${carryWeight(s).toFixed(2)} / ${p.capacity} kg</b></div><div class="weight-track"><i style="width:${Math.min(100, (carryWeight(s) / p.capacity) * 100)}%"></i></div><div class="inventory-layout"><div><div class="bag-grid" data-bag style="--cols:${p.columns};--rows:${p.rows}">${s.grid
      .map((g) => {
        const d = ITEM_PHYSICS[g.item];
        return `<button draggable="true" class="grid-item ${g.uid === this.selectedUid ? "selected" : ""}" data-uid="${g.uid}" data-select="${g.uid}" style="left:calc(${g.x} * var(--cell));top:calc(${g.y} * var(--cell));width:calc(${d.w} * var(--cell) - 4px);height:calc(${d.h} * var(--cell) - 4px)" title="${ITEMS[g.item].name} · ${g.count} · ${(d.weight * g.count).toFixed(2)} kg · durabilidade ${Math.ceil(g.durability)}%"><img draggable="false" src="${itemImage(ITEMS[g.item].icon)}" alt="${ITEMS[g.item].name}"/><b>${g.count}</b><span class="item-durability"><i style="width:${g.durability}%"></i></span></button>`;
      })
      .join(
        "",
      )}</div><p class="inline-note">Arraste os itens. Setas também movem o item selecionado.</p></div><aside class="item-details">${selected ? `<div class="detail-image"><img src="${itemImage(ITEMS[selected.item].icon)}" alt=""/></div><h3>${ITEMS[selected.item].name}</h3><p>${ITEMS[selected.item].description}</p><dl><dt>Peso</dt><dd>${(ITEM_PHYSICS[selected.item].weight * selected.count).toFixed(2)} kg</dd><dt>Tamanho</dt><dd>${ITEM_PHYSICS[selected.item].w} × ${ITEM_PHYSICS[selected.item].h}</dd><dt>Durabilidade</dt><dd>${Math.ceil(selected.durability)}%</dd></dl><div class="detail-actions">${isUsable(selected.item) ? `<button class="small-button" data-use="${selected.item}">Usar</button>` : ""}${selected.item.startsWith("backpack") ? '<button class="small-button" data-action="equip-pack">Equipar mochila</button>' : ""}${isWeapon(selected.item) ? `<button class="small-button" data-use="${selected.item}">Equipar arma</button>` + '<button class="small-button" data-action="repair-weapon">Reparar · 2 sucatas</button>' : ""}<button class="small-button" data-action="drop-selected">Soltar [G]</button></div>` : '<div class="empty-selection">Selecione um item para ver seu peso, tamanho e estado.</div>'}</aside></div><div class="hotbar-editor"><h3>SEUS ATALHOS</h3><p class="inline-note">Arraste um item para um espaço, ou selecione-o e clique em 1–5. × libera o atalho.</p><div class="editable-slots">${s.hotbar
      .map((uid, i) => {
        const g = s.grid.find((g) => g.uid === uid);
        return `<div class="editable-slot" data-slot="${i}"><button class="quickslot" data-assign="${i}" title="Atribuir item selecionado ao atalho ${i + 1}"><kbd>${i + 1}</kbd>${g ? `<img src="${itemImage(ITEMS[g.item].icon)}" alt="${ITEMS[g.item].name}"/>` : "—"}</button><button class="clear-slot" data-clear="${i}" aria-label="Limpar atalho ${i + 1}">×</button></div>`;
      })
      .join("")}</div></div>`;
  }
  bindInventoryDrag() {
    this.root.addEventListener("dragstart", (e) => {
      const event = e as DragEvent,
        node = (event.target as HTMLElement).closest<HTMLElement>("[data-uid]");
      if (!node || !this.state) return;
      this.dragUid = node.dataset.uid!;
      const rect = node.getBoundingClientRect(),
        bag = node.closest<HTMLElement>("[data-bag]")!,
        cell = bag.clientWidth / PACKS[this.state.backpack].columns;
      this.dragOffset = {
        x: Math.floor((event.clientX - rect.left) / cell),
        y: Math.floor((event.clientY - rect.top) / cell),
      };
      event.dataTransfer?.setData("text/plain", this.dragUid);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    });
    this.root.addEventListener("dragover", (e) => {
      const ev = e as DragEvent,
        bag = (ev.target as HTMLElement).closest<HTMLElement>("[data-bag]"),
        slot = (ev.target as HTMLElement).closest("[data-slot]");
      if (bag || slot) {
        ev.preventDefault();
        if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";
        if (bag && this.state) {
          const r = bag.getBoundingClientRect(),
            cell = bag.clientWidth / PACKS[this.state.backpack].columns,
            x = Math.floor((ev.clientX - r.left) / cell) - this.dragOffset.x,
            y = Math.floor((ev.clientY - r.top) / cell) - this.dragOffset.y;
          bag.classList.toggle(
            "drop-valid",
            canPlace(this.state, this.dragUid, x, y),
          );
          bag.classList.toggle(
            "drop-invalid",
            !canPlace(this.state, this.dragUid, x, y),
          );
        }
      }
    });
    this.root.addEventListener("drop", (e) => {
      const ev = e as DragEvent;
      if (!this.dragUid || !this.state) return;
      ev.preventDefault();
      const slot = (ev.target as HTMLElement).closest<HTMLElement>(
          "[data-slot]",
        ),
        bag = (ev.target as HTMLElement).closest<HTMLElement>("[data-bag]");
      if (slot)
        this.toast(
          this.api?.hotbar(Number(slot.dataset.slot), this.dragUid) || "",
        );
      else if (bag) {
        const r = bag.getBoundingClientRect(),
          cell = bag.clientWidth / PACKS[this.state.backpack].columns;
        this.toast(
          this.api?.grid(
            this.dragUid,
            Math.floor((ev.clientX - r.left) / cell) - this.dragOffset.x,
            Math.floor((ev.clientY - r.top) / cell) - this.dragOffset.y,
          ) || "",
        );
      }
      this.selectedUid = this.dragUid;
      this.dragUid = "";
      this.render();
      this.renderHotbar();
    });
    this.root.addEventListener("dragend", () => {
      this.dragUid = "";
      document
        .querySelector("[data-bag]")
        ?.classList.remove("drop-valid", "drop-invalid");
    });
    let touch: { uid: string; x: number; y: number; moved: boolean } | null =
      null;
    this.root.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      const n = (e.target as HTMLElement).closest<HTMLElement>("[data-uid]");
      if (n) {
        touch = {
          uid: n.dataset.uid!,
          x: e.clientX,
          y: e.clientY,
          moved: false,
        };
      }
    });
    this.root.addEventListener("pointermove", (e) => {
      if (touch && Math.hypot(e.clientX - touch.x, e.clientY - touch.y) > 12) {
        touch.moved = true;
        e.preventDefault();
      }
    });
    this.root.addEventListener("pointerup", (e) => {
      if (!touch || !touch.moved || !this.state) {
        touch = null;
        return;
      }
      const target = document.elementFromPoint(e.clientX, e.clientY),
        slot = target?.closest<HTMLElement>("[data-slot]"),
        bag = target?.closest<HTMLElement>("[data-bag]");
      if (slot) this.api?.hotbar(Number(slot.dataset.slot), touch.uid);
      else if (bag) {
        const r = bag.getBoundingClientRect(),
          cell = bag.clientWidth / PACKS[this.state.backpack].columns;
        this.toast(
          this.api?.grid(
            touch.uid,
            Math.floor((e.clientX - r.left) / cell),
            Math.floor((e.clientY - r.top) / cell),
          ) || "",
        );
      }
      this.selectedUid = touch.uid;
      touch = null;
      this.render();
      this.renderHotbar();
    });
  }

  paintMap(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
    const s = this.state!;
    ctx.fillStyle = "#153247";
    ctx.fillRect(0, 0, WORLD.width * sx, WORLD.height * sy);
    const colors: Record<string, string> = {
      ocean: "#153247", beach: "#8a806d", grass: "#273943",
      road: "#424d57", urban: "#314654", industrial: "#3b4650", lake: "#467b99",
    };
    MAP_BLUEPRINT.forEach((line, row) => line.forEach((cell, col) => {
      ctx.fillStyle = colors[cell];
      ctx.fillRect(col * MAP_CELL * sx, row * MAP_CELL * sy, MAP_CELL * sx + 0.4, MAP_CELL * sy + 0.4);
    }));
    ctx.fillStyle = "#424d57";
    for (const r of ROADS)
      ctx.fillRect(
        (r.x - r.w / 2) * sx,
        (r.y - r.h / 2) * sy,
        r.w * sx,
        r.h * sy,
      );
    ctx.fillStyle = "#7892a6";
    for (const h of HOUSES)
      ctx.fillRect((h.x - 90) * sx, (h.y - 180) * sy, 180 * sx, 160 * sy);
    for (const t of SHELTERS) {
      ctx.fillStyle = s.shelters[t.id].discovered ? "#b9d8ec" : "#718da2";
      ctx.strokeStyle = ctx.fillStyle;
      ctx.strokeRect(t.x * sx - 5, t.y * sy - 5, 10, 10);
      ctx.fillRect(t.x * sx - 2, t.y * sy - 2, 4, 4);
    }
    ctx.fillStyle = "#b39b6e";
    for (const c of s.camps) {
      ctx.beginPath();
      ctx.moveTo(c.x * sx, c.y * sy - 4);
      ctx.lineTo(c.x * sx + 4, c.y * sy + 3);
      ctx.lineTo(c.x * sx - 4, c.y * sy + 3);
      ctx.fill();
    }
  }
  paintStoryMap(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
    ctx.fillStyle = "#263323";
    ctx.fillRect(0, 0, STORY_WORLD.width * sx, STORY_WORLD.height * sy);
    ctx.fillStyle = "#303c29";
    ctx.beginPath();
    ctx.ellipse(
      STORY_LOBBY.x * sx,
      STORY_LOBBY.y * sy,
      STORY_LOBBY.radius * sx,
      STORY_LOBBY.radius * 0.7 * sy,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.strokeStyle = "#718060";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#d2a75d";
    ctx.beginPath();
    ctx.arc(STORY_LOBBY.x * sx, STORY_LOBBY.y * sy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7e765d";
    ctx.fillRect(
      (STORY_LOBBY.x + 360) * sx,
      (STORY_LOBBY.y - 45) * sy,
      120 * sx,
      90 * sy,
    );
  }
  drawMinimap() {
    const c = document.getElementById("minimap") as HTMLCanvasElement;
    if (!c || !this.state) return;
    const ctx = c.getContext("2d")!,
      s = this.state,
      story = this.root.dataset.mode === "story",
      sx = c.width / (story ? 700 : 1200),
      sy = c.height / (story ? 570 : 985);
    ctx.fillStyle = "#101923";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.translate(c.width / 2 - s.x * sx, c.height / 2 - s.y * sy);
    if (story) this.paintStoryMap(ctx, sx, sy);
    else this.paintMap(ctx, sx, sy);
    ctx.restore();
    ctx.strokeStyle = "#7da7c440";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.width / 2, 0);
    ctx.lineTo(c.width / 2, c.height);
    ctx.moveTo(0, c.height / 2);
    ctx.lineTo(c.width, c.height / 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(this.facing);
    ctx.fillStyle = "#e8d4a0";
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    document.getElementById("minimap-caption")!.textContent = story
      ? "LOBBY LOCAL · ZONA PACÍFICA"
      : this.currentShelter
        ? "INTERIOR DO BUNKER"
        : `X ${Math.round(s.x / 32)} · Y ${Math.round(s.y / 32)}`;
  }
  drawMap() {
    if (!this.state) return;
    const c = document.getElementById("world-map") as HTMLCanvasElement,
      ctx = c.getContext("2d")!,
      story = this.root.dataset.mode === "story",
      mapWorld = story ? STORY_WORLD : WORLD,
      sx = c.width / mapWorld.width,
      sy = c.height / mapWorld.height;
    if (story) this.paintStoryMap(ctx, sx, sy);
    else this.paintMap(ctx, sx, sy);
    ctx.font = "10px monospace";
    ctx.fillStyle = "#b5bf9b";
    if (story) {
      ctx.fillText(
        "FOGUEIRA",
        STORY_LOBBY.x * sx + 12,
        STORY_LOBBY.y * sy + 3,
      );
      ctx.fillText(
        "CASA DE MÚSICA",
        (STORY_LOBBY.x + 360) * sx,
        (STORY_LOBBY.y - 55) * sy,
      );
    } else {
      for (const d of DISTRICTS)
        ctx.fillText(d.name, d.x * sx, (d.y + d.h + 80) * sy);
      for (const t of SHELTERS)
        ctx.fillText(t.label, t.x * sx + 10, t.y * sy + 3);
    }
    ctx.fillStyle = "#eee6cf";
    ctx.beginPath();
    ctx.arc(this.state.x * sx, this.state.y * sy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  click(event: Event) {
    const b = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button",
    );
    if (!b || b.disabled) return;
    if (b.dataset.select) {
      this.selectedUid = b.dataset.select;
      this.render();
      return;
    }
    if (b.dataset.assign !== undefined) {
      this.toast(
        this.api?.hotbar(Number(b.dataset.assign), this.selectedUid || null) ||
          "",
      );
      this.render();
      return;
    }
    if (b.dataset.clear !== undefined) {
      this.api?.hotbar(Number(b.dataset.clear), null);
      this.render();
      return;
    }
    if (b.dataset.quick !== undefined) {
      const uid = this.state?.hotbar[Number(b.dataset.quick)],
        item = this.state?.grid.find((g) => g.uid === uid);
      if (item) {
        this.selectedUid = item.uid;
        this.toast(
          item.item.startsWith("backpack")
            ? this.api?.equip(item.uid) || ""
            : this.api?.consume(item.item, item.uid) || "",
        );
      }
      return;
    }
    if (b.dataset.collect) {
      const item = b.dataset.collect as ItemId;
      this.toast(this.api?.collect(item) || "");
      if (
        item === "backpack2" &&
        this.state?.containers[this.api?.search() || ""].backpack2 === 0
      )
        this.state.collected.push("upgrade-II");
      if (
        item === "backpack3" &&
        this.state?.containers[this.api?.search() || ""].backpack3 === 0
      )
        this.state.collected.push("upgrade-III");
      this.render();
      return;
    }
    if (b.dataset.tab) {
      this.tab = b.dataset.tab;
      this.render();
      return;
    }
    if (b.dataset.use) {
      const id = b.dataset.use as ItemId;
      const uid = this.state?.grid.find(
        (item) => item.uid === this.selectedUid && item.item === id,
      )?.uid;
      this.toast(this.api?.consume(id, uid) || "");
      if (this.panel) this.render();
      return;
    }
    if (b.dataset.craft) {
      this.toast(this.api?.craft(b.dataset.craft as RecipeId) || "");
      this.render();
      return;
    }
    if (b.dataset.deposit || b.dataset.withdraw) {
      this.toast(
        this.api?.transfer(
          (b.dataset.deposit || b.dataset.withdraw) as ItemId,
          !!b.dataset.deposit,
        ) || "",
      );
      this.render();
      return;
    }
    if (["story", "new", "new-confirmed", "continue"].includes(b.dataset.action || ""))
      this.activateAudio();
    switch (b.dataset.action) {
      case "intro-continue":
        this.activateAudio();
        document.getElementById("prologue")?.classList.add("hidden");
        this.api?.prologue(() => {}, () => {});
        break;
      case "story":
        this.root.dataset.mode = "story";
        this.panel = "";
        this.active = true;
        document.getElementById("menu")!.classList.add("hidden");
        document.getElementById("hud")!.classList.remove("hidden");
        this.api?.startStory();
        break;
      case "new":
        if (readSave()) this.open("replace");
        else this.start();
        break;
      case "new-confirmed":
        this.start();
        break;
      case "continue": {
        const save = readSave();
        if (save) this.start(save);
        else this.toast("Não foi possível ler a partida salva.");
        break;
      }
      case "close":
        this.close();
        break;
      case "quit":
        this.api?.quit();
        this.menu();
        break;
      case "save":
        this.toast(
          this.api?.save()
            ? "Jornada salva neste navegador."
            : "Não foi possível salvar. Verifique o armazenamento do navegador.",
        );
        break;
      case "drop-selected":
        if (this.selectedUid) {
          this.toast(this.api?.drop(this.selectedUid) || "");
          this.selectedUid = "";
          this.render();
        }
        break;
      case "equip-pack":
        this.toast(this.api?.equip(this.selectedUid) || "");
        this.render();
        break;
      case "repair-weapon":
        this.toast(this.api?.repairWeapon() || "");
        this.render();
        break;
      case "inventory":
        this.tab = "supplies";
        this.open("inventory");
        break;
      case "map":
      case "pause":
      case "guide":
      case "settings":
        this.open(b.dataset.action);
        break;
      case "rest":
        this.toast(this.api?.rest() || "");
        this.render();
        break;
      case "repair":
        this.toast(this.api?.repair() || "");
        this.render();
        break;
      case "stash":
        this.tab = "stash";
        this.open("inventory");
        break;
      case "craft-panel":
        this.tab = "craft";
        this.open("inventory");
        break;
      case "fullscreen": {
        const operation = document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen?.();
        operation?.catch(() =>
          this.toast("Tela cheia indisponível neste navegador."),
        );
        break;
      }
    }
  }
  changeSettings(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.dataset.setting) return;
    const key = input.dataset.setting as keyof Settings;
    if (key === "sound") this.settings.sound = input.checked;
    else this.settings[key] = Number(input.value);
    this.api?.settings(this.settings);
    try {
      localStorage.setItem(
        "no-one-left.settings",
        JSON.stringify(this.settings),
      );
    } catch {
      /* Current session settings remain available. */
    }
  }
}
