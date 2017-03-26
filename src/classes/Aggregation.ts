import { Column } from './Column';
import { Query } from './Query';
import { Model } from './Model';

let math = Symbol('math');

export class Aggregation {
    query: Query<Model>;

    constructor(query: Query<Model>) {
        this.query = query;
    }

    column(column: Column | string, asField?) {
        let part: string;
        if (column instanceof Column) {
            part = Query.quoteId(column.name);
        } else {
            part = Query.quoteId(this.query.modelClass.columnName(column));
        }
        return asField ? part + ' AS ' + Query.quoteId(asField) : part;
    }

    count(column: Column | string, asField?) {
        return this[math]('count', column, asField);
    }

    sum(column: Column | string, asField?) {
        return this[math]('sum', column, asField);
    }

    max(column: Column | string, asField?) {
        return this[math]('max', column, asField);
    }

    min(column: Column | string, asField?) {
        return this[math]('min', column, asField);
    }

    avg(column: Column | string, asField?) {
        return this[math]('avg', column, asField);
    }

    [math](method: string, column: Column | string, asField?) {
        let part: string = method;
        if (column instanceof Column) {
            part += '(' + Query.quoteId(column.name) + ')';
        } else {
            if (column == '*') {
                part += '(*)';
            } else {
                part += '(' + Query.quoteId(this.query.modelClass.columnName(column)) + ')';
            }
        }
        return asField ? part + ' AS ' + Query.quoteId(asField) : part;
    }
}