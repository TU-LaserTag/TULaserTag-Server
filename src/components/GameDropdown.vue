<template>
    <v-select :items="games" label="Select a game to view" v-model="key" v-on:change="selectGame" solo></v-select>
</template>

<script>
export default {
    props: ["selectedGame"],
    data: function() {
        return {
            games: [],
            selection: {
                key: "",
                value: ""
            }
        }
    },
    computed: {
        key: {
            get: function() {
                return this.selection;
            },
            set: function(value) {
                this.selection.key = value;
            }
        }
    },
    mounted: function() {
        this.$axios.get("allgames").then(response => {
            this.games = response.data.map(game => ({
                text: `${game.name}`,
                value: game.id,
                starttime: game.starttime,
                endtime: game.endtime,
                maxammo: game.maxammo,
                style: game.style,
                timedisabled: game.timedisabled,
                maxLives: game.maxLives,
                pause: game.pause,
                winners: game.winners,
                date: game.date,
                num_teams: game.num_teams,
                players_alive: game.players_alive,
                teams_alive: game.teams_alive,
                name: game.name,
                host: game.host
            }));
        });
    },
    methods: {
        selectGame() {
            let selection = "";
            for (let i = 0; i < this.games.length; i++) {
                if (this.games[i].value === this.selection.key) {
                    selection = this.games[i];
                    this.selection;
                    break;
                }
            }
            this.$emit('selection', selection);
        }
    }
}
</script>