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
                relation: Model.ManyToManyRelation,
                modelClass: Team,
                join: {
                    from: 'league.id',
                    through: {
                        from: 'league_assignment.league_id',
                        to: 'league_assignment.team_id'
                    },
                    to: 'team.id'
                }
            }
        }
    }
}

module.exports = League;