import { Migration } from '../classes/Migration';
import { Connection } from '../classes/Connection';
import { AdminModel } from './AdminModel';

let connection = new Connection(require('../../mysql.json'));

(async () => {
    let migration = new Migration(connection.query(AdminModel));
    if (process.argv[2] == 'exec') {
        await migration.migrate();
    } else {
        console.log(await migration.showMigrate());
    }
})();