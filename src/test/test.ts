import { Migration } from '../classes/Migration';
import { Connection } from '../classes/Connection';
import { AdminModel } from './AdminModel';

let mysqlConfig = require('../../mysql.json');
let connection = new Connection(mysqlConfig);
let migration = new Migration(connection.query(AdminModel));
try {
    (async () => {
        let sql = await migration.showMigrate();
        console.log(sql);
    })();
} catch (e) {
    console.log(e);
}

process.on('unhandledRejection', (reason, p) => {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging, throwing an error, or other logic here
});

(async () => {
    let result = await connection.execute('update tb_admin set name="111"');
    console.log(result);
})();