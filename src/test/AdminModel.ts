import { Column } from '../classes/Column';
import { Model } from '../classes/Model';
import { Index } from '../classes/Index';

export class AdminModel extends Model {
    static readonly COLUMNS = {
        ID: Column.increment(),
        NAME: Column.char({ length: 8 }),
        PASSWORD: Column.char({ length: 255 }),
        CREATED_TIME: Column.created(),
        UPDATED_TIME: Column.updated()
    };

    static readonly INDEXES = [
        Index.primary(AdminModel.COLUMNS.ID),
        Index.unique(AdminModel.COLUMNS.NAME)
    ];

    id; name; password; createdTime; updatedTime;
}