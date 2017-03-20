import { Model } from './Model';
import { Connection } from './Connection';

export class Query {
    modelClass: typeof Model;
    connection: Connection;

    constructor(connection: Connection, modelClass: typeof Model) {
        this.connection = connection;
        this.modelClass = modelClass;
    }
}