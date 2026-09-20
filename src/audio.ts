export interface Point {
  x: number;
  y: number;
}
export interface ProjectileAudioEvent {
  id: string;
  ownerId: string;
  from: Point;
  to: Point;
  impact?: boolean;
}
export function spatialGain(distance: number, max = 400) {
  return Math.max(0, Math.min(1, 1 - distance / max));
}

export interface AudioSettings {
  sound: boolean;
  music: number;
  effects: number;
}

/** Owns the WebAudio unlock, music lifecycle and queued effects for every UI/game flow. */
export class AudioDirector {
  settings: AudioSettings;
  music?: Phaser.Sound.BaseSound;
  musicKey = "";
  private queued: { key: string; volume: number; rate: number }[] = [];
  constructor(private scene: Phaser.Scene, settings: AudioSettings) {
    this.settings = { ...settings };
  }
  configure(settings: AudioSettings) {
    this.settings = { ...settings };
    this.scene.sound.mute = !settings.sound;
    if (this.music)
      (this.music as Phaser.Sound.WebAudioSound).setVolume(
        settings.music * (this.musicKey === "menu-music" ? 0.42 : 0.34),
      );
  }
  async unlock() {
    if (!this.settings.sound) return false;
    if (this.scene.sound instanceof Phaser.Sound.WebAudioSoundManager) {
      if (this.scene.sound.context.state !== "running")
        await this.scene.sound.context.resume();
    } else (this.scene.sound as Phaser.Sound.HTML5AudioSoundManager).unlock();
    const queued = this.queued.splice(0);
    queued.forEach((event) => this.effect(event.key, event.volume, event.rate));
    if (this.music && !this.music.isPlaying) this.music.play();
    return true;
  }
  setMusic(key: string) {
    if (this.musicKey === key && this.music) {
      if (!this.music.isPlaying && this.settings.sound) this.music.play();
      return this.music;
    }
    this.music?.stop();
    this.music?.destroy();
    this.musicKey = key;
    this.music = this.scene.sound.add(key, {
      loop: true,
      volume: this.settings.music * (key === "menu-music" ? 0.42 : 0.34),
    });
    if (this.settings.sound && this.ready()) this.music.play();
    return this.music;
  }
  effect(key: string, volume = 1, rate = 1) {
    if (!this.settings.sound || !this.scene.cache.audio.exists(key)) return false;
    if (!this.ready()) {
      this.queued.push({ key, volume, rate });
      if (this.queued.length > 12) this.queued.shift();
      return false;
    }
    return this.scene.sound.play(key, {
      volume: Math.min(1, this.settings.effects * volume),
      rate,
    });
  }
  ready() {
    return !(this.scene.sound instanceof Phaser.Sound.WebAudioSoundManager) ||
      this.scene.sound.context.state === "running";
  }
}
/** Presentation rule shared by local hits and future replicated projectile events. */
export function projectileCue(
  event: ProjectileAudioEvent,
  listener: Point,
  listenerId: string,
): "ricochet" | "flyby" | null {
  if (
    ![
      event.from.x,
      event.from.y,
      event.to.x,
      event.to.y,
      listener.x,
      listener.y,
    ].every(Number.isFinite)
  )
    return null;
  if (
    event.impact &&
    Math.hypot(event.to.x - listener.x, event.to.y - listener.y) < 120
  )
    return "ricochet";
  if (event.ownerId === listenerId || event.impact) return null;
  const dx = event.to.x - event.from.x,
    dy = event.to.y - event.from.y,
    len = dx * dx + dy * dy;
  if (!len) return null;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((listener.x - event.from.x) * dx + (listener.y - event.from.y) * dy) /
        len,
    ),
  );
  return Math.hypot(
    event.from.x + t * dx - listener.x,
    event.from.y + t * dy - listener.y,
  ) < 75
    ? "flyby"
    : null;
}
import Phaser from "phaser";
