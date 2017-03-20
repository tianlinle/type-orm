import { Model } from './Model';
import { Column } from './Column';

export class Migration {
    modelClass: typeof Model;

    constructor(modelClass: typeof Model) {
        this.modelClass = modelClass;
    }

    getDefinedColumns() {
        let columns = {};
        for (let i in this.modelClass) {
            if (this.modelClass[i] instanceof Column) {
                columns[i.toLowerCase()] = this.modelClass[i];
            }
        }
        return columns;
    }
}