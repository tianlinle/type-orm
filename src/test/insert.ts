import { Connection } from '../classes/Connection';
import { AdminModel } from './AdminModel';
import { ColumnValue } from '../classes/ColumnValue';

let connection = new Connection(require('../../mysql.json'));

(async () => {
    connection.query(AdminModel).insertMulti([
        [
            AdminModel.COLUMNS.NAME.value
        ]
    ]);
})();