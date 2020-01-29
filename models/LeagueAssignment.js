const objection = require('objection');
const Model = objection.Model;

class LeagueAssignment extends Model {
    static get tableName() {
        return 'league_assignment';
    }
}

module.exports = LeagueAssignment;