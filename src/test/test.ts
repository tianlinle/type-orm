import { Migration } from '../classes/Migration';
import { Connection } from '../classes/Connection';

let mysqlConfig = require('../../mysql.json');
let connection = new Connection(mysqlConfig);
console.log(mysqlConfig);