import { AdminModel } from './AdminModel';
import { Migration } from '../classes/Migration';

let m = new Migration(AdminModel);
console.log(m.getDefinedColumns());