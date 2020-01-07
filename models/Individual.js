const objection = require('objection');
const Model = objection.Model;

class Individual extends Model {
    static get tableName() {
        return 'individual';
    }
}

module.exports = Individual;