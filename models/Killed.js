const objection = require('objection');
const Model = objection.Model;

class Killed extends Model {
    static get tableName() {
        return 'killed';
    }
}

module.exports = Killed;