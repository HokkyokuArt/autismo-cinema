export type GridSize = "small" | "medium" | "large";

/**
 * off = sem animações (durações colapsadas via CSS); basic = as animações que a
 * interface já tinha antes disso existir (hover glass, giro da roleta, fogos, etc.);
 * full = basic + efeitos extras nos cards de filme (spotlight, tilt 3D, verniz).
 */
export type AnimationLevel = "off" | "basic" | "full";

export interface AppSettings {
  gridSize: GridSize;
  animationLevel: AnimationLevel;
  activeListId?: string;
}
