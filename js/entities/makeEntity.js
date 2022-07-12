// @flow

import type {
	Vector, Entity, EntityType, EntityID, Ant, Food, Caste, Hill, Dirt,
  Egg, Larva, Pupa, DeadAnt,
} from '../types';

const makeEntity = (
	type: EntityType,
	position: Vector,
	width: ?number,
	height: ?number,
): Entity => {
	return {
    id: -1, // NOTE: this is set by the reducer
		type,
		position,
		prevPosition: position,
		width: width != null ? width : 1,
		height: height != null ? height : 1,
		theta: 0,
    prevTheta: 0,
	};
};

module.exports = {
  makeEntity,
};
