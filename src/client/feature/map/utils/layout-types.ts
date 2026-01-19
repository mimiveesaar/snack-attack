export type ElementType = 'rock' | 'seaweed' | 'bubble';

export interface Vec2 {
  x: number;
  y: number;
}

export interface TerrainLayout {
  dirtIndex: number;
  sandIndex: number;
}

export interface LayoutElementBase {
  id: string;
  type: ElementType;
  position: Vec2;
  size: number;
  variantIndex: number;
}

export interface RockLayout extends LayoutElementBase {
  type: 'rock';
}

export interface SeaweedLayout extends LayoutElementBase {
  type: 'seaweed';
}

export interface BubbleLayout extends LayoutElementBase {
  type: 'bubble';
  durationMs: number;
  delayMs: number;
  startYOffset: number;
  endYOffset: number;
}

export type AmbientLayout = RockLayout | SeaweedLayout | BubbleLayout;

export interface GameLayout {
  seed: string;
  width: number;
  height: number;
  terrain: TerrainLayout;
  rocks: RockLayout[];
  seaweed: SeaweedLayout[];
  bubbles: BubbleLayout[];
}
