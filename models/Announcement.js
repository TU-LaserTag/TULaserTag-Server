const objection = require('objection');
const Model = objection.Model;

class Announcement extends Model {
    static get tableName() {
        return 'announcement';
    }
}

module.exports = Announcement;