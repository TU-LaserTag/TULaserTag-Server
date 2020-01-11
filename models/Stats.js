const objection = require('objection');
const Model = objection.Model;

class Stats extends Model {
    static get tableName() {
        return 'stats';
    }

    static get relationMappings() {
        const Gun = require('./Gun');

        return {
            gun: {
                relation: Model.HasOneRelation,
                modelClass: Gun,
                join: {
                    from: 'stats.gun_id',
                    to: 'gun.id'
                }
            }
        }
    }
}

module.exports = Stats;