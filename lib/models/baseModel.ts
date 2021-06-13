import {Sequelize, Model} from "sequelize";

export type MySequelize = Sequelize & {
  processData?: any
  stripNullByte?: any
}

export type BaseModel<T> = {
  name: string;
  initialize(sequelize: Sequelize): void
  associate(models: any): void
}

export function StaticImplements<T>(t: T) {
  return t;
}

export interface BaseModelStatic extends Model {
  initialize(sequelize: Sequelize): void

  associate(models: any): void
}
