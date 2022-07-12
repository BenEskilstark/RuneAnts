// @flow

// -----------------------------------------------------------------------
// General types
// ----------------------------------------------------------------------

export type Vector = {x: number, y: number};

export type Mouse = {
  isLeftDown: boolean,
  isRightDown: boolean,
  downPos: Vector, // where the mouse down was pressed (in grid-space)
  curPos: Vector, // grid position of mouse
  prevPos: Vector, // previous grid position of the mouse
  curPixel: Vector, // pixel position of mouse
  prevPixel: Vector,
};

// uses left/right/up/down and enter/space/meta
export type HotKeys = {
  onKeyDown: {[key: string]: (store) => void},
  onKeyUp: {[key: string]: (store) => void},
  onKeyPress: {[key: string]: (store) => void},
  keysDown: {[key: string]: boolean},
};

// ----------------------------------------------------------------------------
// Game state
// ----------------------------------------------------------------------------

export type State = {
	screen: 'LOBBY' | 'GAME' | 'EDITOR',
	game: ?Game,
	players: Array<Player>, // players who may be in lobby
};

export type PlayerID = number;
export type Player = {
	id: PlayerID,
  name: string,
	type: 'HUMAN' | 'COMPUTER',
};

export type Colony = {
  id: PlayerID,
  species: 'ANT' | 'TERMITE',
};

export type Game = {
	time: number,
	tickInterval:any,
  isExperimental: boolean, // should it display additional UI for experimentation

	players: Array<Player>, // players in this game

  colonies: {[PlayerID]: Colony},

	pheromoneDisplay: {
		[PheromoneType]: {
			visible: boolean,
		}
	},

	viewWidth: number,
	viewHeight: number,
	gridWidth: number,
	gridHeight: number,
	grid: Grid,
	entities: {[EntityID]: Entity},
	[EntityType]: Array<EntityID>,

	gameOver: ?PlayerID, // ID of winner

	level: number,

  // state that should be local
  sprites: {[string]: Image},
	playerID: PlayerID, // the player on this computer
  mouse: Mouse,
  hotKeys: HotKeys,
	viewPos: Vector, // where in the world we're looking
};

// ------------------------------------------------------------------------
// Grid
// ------------------------------------------------------------------------

export type PheromoneType =
  'COLONY' | 'FOOD' | 'ALERT' | 'EGG' | 'LARVA' |
  'PUPA' | 'DIRT_DROP' | 'QUEEN';

export type Grid = Array<Array<Cell>>;

export type Cell = {
	entities: Array<EntityID>,
	[playerID]: {
		[PheromoneType]: number,
	}
};

// ------------------------------------------------------------------------
// Entities
// ------------------------------------------------------------------------

export type EntityType = 'ANT' | 'FOOD' | 'DIRT' |
	'EGG' | 'LARVA' | 'PUPA' | 'TOKEN' | 'SPIDER';
export type EntityID = number;
export type Entity = {
	id: EntityID,
	type: EntityType,
	position: ?Vector, // has no position if being held
  prevPosition: Vector,
	width: number,
	height: number,
	theta: number,
  prevTheta: number,
};

export type Task =
  'WANDER' |  // "default" random-walk-like task
  'EXPLORE' | // search by going far out
  'RETRIEVE' | // go out to get food
  'RETURN' | // bring food back to ant hill
  'FEED_LARVA' | // find larva to find food to
  'MOVE_DIRT' | // bring held dirt away
  'REDISTRIBUTE_EGG' |
  'REDISTRIBUTE_LARVA' |
  'REDISTRIBUTE_PUPA' |
  'DEFEND'; // fight!
export type Caste = 'MINIMA' | 'MEDIA' | 'MAJOR' | 'QUEEN' | 'YOUNG_QUEEN';
export type Ant = Entity & {
	playerID: PlayerID,
	caste: Caste,
	hp: number,
	damage: number,
  holding: ?Entity,
  fighting: ?Ant,
  task: Task,
  actions: Array<EntityAction>,
  lastHeldID: ?EntityID,
};

export type EntityAction = {
  type: 'LAY' | 'HATCH' | 'MOVE' | 'TURN' | 'BITE' | 'STING' | 'DASH',
  duration: number, // number of ticks
  // additional information for this action
  // MOVE/DASH: next position vector
  // TURN: next theta
  // BITE/STING: target entity
  payload: mixed,
};

export type Egg = Entity & {
  playerID: PlayerID,
  caste: Caste,
  age: number,
  actions: Array<EntityAction>,
};
export type Larva = Entity & {
  foodNeed: number,
  playerID: PlayerID,
  caste: Caste,
  actions: Array<EntityAction>,
};
export type Pupa = Entity & {
  playerID: PlayerID,
  caste: Caste,
  age: number,
  actions: Array<EntityAction>,
};

export type Token = Entity & {
  playerID: PlayerID,
  pheromoneType: PheromoneType,
};

export type Food = Entity;
export type Dirt = Entity & {
	marked: ?PlayerID, // is this marked for digging
};
