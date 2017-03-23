import { Model } from './Model';
import { AdminModel } from '../test/AdminModel';

export class Result<T> extends Array<T> {
    allHaveOne<U extends Model>(one: { new (): U }): Result<U> {
        return new Result<U>();
    }
}

let r = new Result;
let model = new AdminModel;
let one = r.allHaveOne<AdminModel>(AdminModel);
let a = one[0];