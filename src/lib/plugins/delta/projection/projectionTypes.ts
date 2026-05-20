export const DELTA_GROUP_NODE = Symbol('delta-group-node')

export interface DeltaProjectionGroup {
  [DELTA_GROUP_NODE]: true
  [key: string]: unknown
}

