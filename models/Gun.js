const objection = require('objection');
const Model = objection.Model;

class Gun extends Model {
    static get tableName() {
        return 'gun';
    }
}

module.exports = Gun;