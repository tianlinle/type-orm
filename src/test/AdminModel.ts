import { Column } from '../classes/Column';
import { Model } from '../classes/Model';
import { Index } from '../classes/Index';

export class AdminModel extends Model {
    static ID = Column.increment();
    static NAME = Column.char({ length: 8 });
    static PASSWORD = Column.char({ length: 255 });
    static CREATED_TIME = Column.created();
    static UPDATED_TIME = Column.updated();

    static indexes = [Index.primary(AdminModel.ID), Index.unique(AdminModel.NAME)];

    id; name; password; createdTime; updatedTime;
}