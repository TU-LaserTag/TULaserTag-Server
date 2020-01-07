const objection = require('objection');
const Model = objection.Model;

class Stats extends Model {
    static get tableName() {
        return 'stats';
    }
}

module.exports = Stats;