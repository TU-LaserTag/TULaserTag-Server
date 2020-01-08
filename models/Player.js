const objection = require('objection');
const Model = objection.Model;

class Player extends Model {
    static get tableName() {
        return 'player';
    }

    static get relationMappings() {
        const Team = require('./Team');
        const Game = require('./Game');

        return {
            games: {
                relation: Model.ManyToManyRelation,
                modelClass: Game,
                join: {
                    from: 'player.username',
                    through: {
                        from: 'stats.player_username',
                        to: 'stats.game_id',
                    },
                    to: 'game.id'
                }
            },

            solo_matches: {
                relation: Model.ManyToManyRelation,
                modelClass: Game,
                join: {
                    from: 'player.username',
                    through: {
                        from: 'individual.player_username',
                        to: 'individual.game_id'
                    },
                    to: 'game.id'
                }
            },

            teams: {
                relation: Model.ManyToManyRelation,
                modelClass: Team,
                join: {
                    from: 'player.username',
                    through: {
                        from: 'assignment.player_username',
                        to: 'assignment.team_id'
                    },
                    to: 'team.id'
                }
            }
        }
    }
}

module.exports = Player;