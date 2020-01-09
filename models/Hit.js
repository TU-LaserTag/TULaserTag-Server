const objection = require('objection');
const Model = objection.Model;

class Hit extends Model {
    static get tableName() {
        return 'hit';
    }
}

module.exports = Hit;