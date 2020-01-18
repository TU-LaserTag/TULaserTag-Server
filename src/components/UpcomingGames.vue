<template>
    <div>
        <v-card>
            <v-card-title>
                <v-layout justify-center><h2>Upcoming Games</h2></v-layout>
            </v-card-title>
            <v-data-table v-bind:headers="game_headers" v-bind:items="games" :sort-by="['date']">
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
                { text: "Type of game", value: "style"},
                { text: "Date", value: "date"}
            ],
            games: []
        }
    },
    mounted: function() {
        this.$axios.get("games/upcoming").then(response => {
            var game = [];
            const games = response.data;
            for (var i = 0; i < games.length; i++) {
                if (games[i].date && this.createDate() <= games[i].date) {
                    game.push({
                        name: games[i].name,
                        style: games[i].style,
                        date: games[i].date
                    });
                }
                else if (!games[i].date){
                    game.push({
                        name: games[i].name,
                        style: games[i].style,
                        date: "TBD"
                    })
                }
            }
            this.games = game;
        })
    },
    methods: {
        createDate() {
            const date = new Date();

            var year = date.getFullYear();

            var month = date.getMonth() + 1;
            if (month < 9) {
                month = "0" + (month);
            }

            var day = date.getDate();
            if (day < 9) {
                day = "0" + day;
            }

            return month + "-" + day + "-" + year;
        }
    }
}
</script>