<template>
    <div>
        <v-card>
            <v-card-title>
                <v-layout justify-center><h2>Current Games</h2></v-layout>
            </v-card-title>
            <v-data-table v-bind:headers="game_headers" v-bind:items="games" :sort-by="['time_left']">
                <template v-slot:item.maxammo="{ item }">
                    <v-icon v-if="(item.maxammo == -1)">mdi-infinity</v-icon>
                    <span v-if="(item.maxammo != -1)">{{item.maxammo}}</span>
                </template>
                <template v-slot:item.maxLives="{ item }">
                    <v-icon v-if="(item.maxLives == -1)">mdi-infinity</v-icon>
                    <span v-if="(item.maxLives != -1)">{{item.maxLives}}</span>
                </template>
                <template v-slot:item.linkToGame="{ item }">
                    <v-icon color="#007476" medium title="Edit" @click='goToGame(item)'>
                        mdi-chevron-right-box
                    </v-icon>
                </template>
            </v-data-table>
        </v-card>
    </div>
</template>

<script>
export default {
    data: function() {
        return {
            game_headers: [
                { text: "Name", value: "name"},
                { text: "Host", value: "host"},
                { text: "Type of game", value: "style"},
                { text: "Max Ammunition", value: "maxammo"},
                { text: "Teams Left", value: "teams_alive"},
                { text: "Players Left", value: "players_alive"},
                { text: "Time Remaining", value: "time_left"},
                { text: "", value: "linkToGame"}
            ],
            games: []
        }
    },
    mounted: function() {
        this.$axios.get("games/current").then(response => {
            var game = [];
            if (response.data.games) {
                const games = response.data.games;
                for (var i = 0; i < games.length; i++) {
                    game.push({
                        id: games[i].id,
                        name: games[i].name,
                        host: games[i].host,
                        style: games[i].style,
                        maxammo: games[i].maxammo,
                        teams_alive: games[i].teams_alive,
                        players_alive: games[i].players_alive,
                        time_left: response.data.time[i]
                    });
                }
            }
            this.games = game;
        })
    },
    methods: {
        goToGame(game) {
            this.$router.push({ name: 'scores', params: {id: game.id}});
        },
        refresh() {
            this.$axios.get("games/current").then(response => {
                var game = [];
                if (response.data.games) {
                    const games = response.data.games;
                    for (var i = 0; i < games.length; i++) {
                        game.push({
                            id: games[i].id,
                            name: games[i].name,
                            host: games[i].host,
                            style: games[i].style,
                            maxammo: games[i].maxammo,
                            teams_alive: games[i].teams_alive,
                            players_alive: games[i].players_alive,
                            time_left: response.data.time[i]
                        });
                    }
                }
                this.games = game;
            })
        }
    }
}
</script>