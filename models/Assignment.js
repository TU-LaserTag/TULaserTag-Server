const objection = require('objection');
const Model = objection.Model;

class Assignment extends Model {
    static get tableName() {
        return 'assignment';
    }
}

module.exports = Assignment;