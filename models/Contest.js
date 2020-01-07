const objection = require('objection');
const Model = objection.Model;

class Contest extends Model {
    static get tableName() {
        return 'contest';
    }
}

module.exports = Contest;