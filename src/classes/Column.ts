import { Literal } from './Literal';
import { Query } from './Query';
import { Expression } from './Expression';

export class Column {
    property: string;
    name: string;
    type: string;
    null: boolean;
    default: any;
    extra: Literal;
    comment: string;

    value(v) {
        return Query.quoteId(this.name) + ' = ' + Query.quoteValue(v);
    }

    eq(value) {
        return Expression.eq(this, value);
    }

    neq(value) {
        return Expression.neq(this, value);
    }

    gt(value) {
        return Expression.gt(this, value);
    }

    gte(value) {
        return Expression.gte(this, value);
    }

    lt(value) {
        return Expression.lt(this, value);
    }

    lte(value) {
        return Expression.lte(this, value);
    }

    in(values) {
        return Expression.in(this, values);
    }

    nin(values) {
        return Expression.nin(this, values);
    }

    like(value, part: 'GENERAL' | 'LEFT' | 'RIGHT' | 'NONE' = 'GENERAL') {
        if (value instanceof Literal) {
            return Query.quoteId(this.name) + ' LIKE ' + Query.quoteValue(value);
        }
        switch (part) {
            case 'GENERAL':
                value = '%' + value + '%';
                break;
            case 'LEFT':
                value = value + '%';
                break;
            case 'RIGHT':
                value = '%' + value;
                break;
            default:
                break;
        }
        return Query.quoteId(this.name) + ' LIKE ' + Query.quoteValue(value);
    }

    static initiate(type: string, option?: { null?: boolean, default?: any, extra?: Literal, comment?: string }) {
        let column = new Column();
        let defaultOption = { null: true, default: null };
        option = Object.assign(defaultOption, option);
        column.type = type;
        column.null = option.null;
        column.default = option.default;
        column.extra = option.extra === undefined ? new Literal('') : option.extra;
        column.comment = option.comment ? option.comment : '';
        return column;
    }

    static increment() {
        return this.initiate('int(11)', { null: false, extra: new Literal('auto_increment') });
    }

    static char(option?: { length?: number, null?: boolean, default?: any, comment?: string }) {
        return this.initiate('char' + (option && option.length ? '(' + option.length + ')' : ''), option);
    }

    static varchar(option?: { length?: number, null?: boolean, default?: any, comment?: string }) {
        return this.initiate('varchar' + (option && option.length ? '(' + option.length + ')' : ''), option);
    }

    static int(option?: { null?: boolean, default?: any, comment?: string }) {
        return this.initiate('int(11)', option);
    }

    static text(option?: { null?: boolean, comment?: string }) {
        return this.initiate('text', option);
    }

    static timestamp(option?: { null?: boolean, default?: any, extra?: Literal, comment?: string }) {
        return this.initiate('timestamp', option);
    }

    static created() {
        return Column.timestamp({ null: true, default: new Literal('CURRENT_TIMESTAMP') });
    }

    static updated() {
        return Column.timestamp({ null: true, default: new Literal('CURRENT_TIMESTAMP'), extra: new Literal('on update CURRENT_TIMESTAMP') });
    }
}