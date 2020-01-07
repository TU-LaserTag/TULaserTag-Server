const objection = require('objection');
const Model = objection.Model;

class Game extends Model {
    static get tableName() {
        return 'game';
    }

    static get relationMappings() {
        const Team = require('./Team');
        const Player = require('./Player');

        return {
            individuals: {
                relation: Model.ManyToManyRelation,
                modelClass: Player,
                join: {
                    from: 'game.id',
                    through: {
                        from: 'individual.game_id',
                        to: 'individual.player_id'
                    },
                    to: 'player.id'
                }
            },

            players: {
                relation: Model.ManyToManyRelation,
                modelClass: Player,
                join: {
                    from: 'game.id',
                    through: {
                        from: 'stats.game_id',
                        to: 'stats.player_id'
                    },
                    to: 'player.id'
                }
            },

            teams: {
                relation: Model.ManyToManyRelation,
                modelClass: Team,
                join: {
                    from: 'game.id',
                    through: {
                        from: 'contest.game_id',
                        to: 'contest.team_id'
                    },
                    to: 'team_id'
                }
            }
        }
    }
}

module.exports = Game;