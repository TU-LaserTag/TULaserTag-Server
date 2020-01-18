<template>
    <div>
        <v-card>
            <v-card-title>
                <v-layout justify-center><h2>Current Games</h2></v-layout>
            </v-card-title>
            <v-data-table v-bind:headers="game_headers" v-bind:items="games" :sort-by="['time_left']">
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
                { text: "Time Remaining", value: "time_left"}
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
</script>