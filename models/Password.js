const objection = require('objection');
const Model = objection.Model;

class Password extends Model {
    static get tableName() {
        return 'password';
    }
}

module.exports = Password;