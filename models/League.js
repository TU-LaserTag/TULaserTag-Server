const objection = require('objection');
const Model = objection.Model;

class League extends Model {
    static get tableName() {
        return 'league';
    }

    static get relationMappings() {
        const Team = require('./Team');

        return {
            teams: {
                relation: Model.HasManyRelation,
                modelClass: Team,
                join: {
                    from: 'league.id',
                    to: 'team.league_id'
                }
            }
        }
    }
}

module.exports = League;