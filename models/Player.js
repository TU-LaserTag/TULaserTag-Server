const objection = require('objection');
const Model = objection.Model;

class Player extends Model {
    static get tableName() {
        return 'player';
    }

    static get relationMappings() {
        const Team = require('./Team');
        const Game = require('./Game');
        const Stats = require('./Stats');

        return {
            games: {
                relation: Model.ManyToManyRelation,
                modelClass: Game,
                join: {
                    from: 'player.id',
                    through: {
                        from: 'stats.player_id',
                        to: 'stats.game_id',
                    },
                    to: 'game.id'
                }
            },

            solo_matches: {
                relation: Model.ManyToManyRelation,
                modelClass: Game,
                join: {
                    from: 'player.id',
                    through: {
                        from: 'individual.player_id',
                        to: 'individual.game_id'
                    },
                    to: 'game.id'
                }
            },

            teams: {
                relation: Model.ManyToManyRelation,
                modelClass: Team,
                join: {
                    from: 'player.id',
                    through: {
                        from: 'assignment.player_id',
                        to: 'assignment.team_id'
                    },
                    to: team.id
                }
            }
        }
    }
}

module.exports = Player;