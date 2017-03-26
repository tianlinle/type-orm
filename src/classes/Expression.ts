import { Query } from './Query';
import { Column } from './Column';
import { Literal } from './Literal';

let quoteColumn = Symbol();
let op = Symbol();
type TColumn = Column | string | Literal;

export class Expression {
    static eq(column: TColumn, value): Literal {
        return value === null ? `${Query.quoteId(column)} IS NULL` : this[op]('=', column, value);
    }

    static neq(column: TColumn, value): Literal {
        return value === null ? `${Query.quoteId(column)} IS NOT NULL` : this[op]('<>', column, value);
    }

    static gt(column: TColumn, value): Literal {
        return this[op]('>', column, value);
    }

    static gte(column: TColumn, value): Literal {
        return this[op]('>=', column, value);
    }

    static lt(column: TColumn, value): Literal {
        return this[op]('<', column, value);
    }

    static lte(column: TColumn, value): Literal {
        return this[op]('<=', column, value);
    }

    static in(column: TColumn, values: any[]): Literal {
        let valueParts: string[] = [];
        let hasNull = false;
        for (let item of values) {
            item === null ? hasNull = true : valueParts.push(Query.quoteValue(item));
        }
        if (valueParts.length == 0) {
            return new Literal('1 > 0');
        }
        let ret = `${Query.quoteId(column)} IN (${valueParts.join(', ')})`;
        if (hasNull) {
            ret += `OR ${Expression.eq(column, null)}`;
        }
        return new Literal(ret);
    }

    static nin(column: TColumn, values: any[]): Literal {
        let valueParts: string[] = [];
        let hasNull = false;
        for (let item of values) {
            item === null ? hasNull = true : valueParts.push(Query.quoteValue(item));
        }
        if (valueParts.length == 0) {
            return new Literal('1 = 1');
        }
        let ret = Query.quoteId(column) + ' NOT IN (' + valueParts.join(', ') + ')';
        if (hasNull) {
            ret += ` AND ${Query.quoteId(column)} IS NOT NULL`;
        }
        return new Literal(ret);
    }

    static orX(condictions: string[]): string {
        return `(${condictions.join(' OR ')})`;
    }

    static andX(condictions: string[]): string {
        return `(${condictions.join(' AND ')})`;
    }

    static [op](op: '=' | '<>' | '>' | '>=' | '<' | '<=', column: TColumn, value): Literal {
        return new Literal(`${Query.quoteId(column)} ${op} ${Query.quoteValue(value)}`);
    }
}