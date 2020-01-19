const objection = require('objection');
const Model = objection.Model;

class Role extends Model {
    static get tableName() {
        return 'role';
    }
}

module.exports = Role;