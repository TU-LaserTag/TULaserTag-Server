<template>
    <div>
        <v-card>
            <v-card-title>
                <v-row>
                    <v-col cols=2>
                        <v-layout justify-left>
                        <v-btn outlined color=#61578b @click='refresh()'>Refresh</v-btn>
                        </v-layout>
                    </v-col>
                    <v-col cols=2>
                        <v-layout justify-center><span v-if="(time && !(winners))" style="font-size:18px">Time Left: {{time}}</span><span v-if=winners style="font-size:18px">Winner(s): {{this.winners.toString()}}</span></v-layout>
                    </v-col>
                    <v-col cols=4> 
                        <v-layout justify-center><span style="font-size:32px">{{name}}</span></v-layout>
                    </v-col>
                    <v-spacer />
                    <v-col cols=2>
                        <v-text-field class="pt-0 mt-0" v-model="search" label="Search" single-line hide-details ></v-text-field>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-data-table v-bind:headers="game_headers" v-bind:items="players" v-bind:search="search">
                <template slot="no-data">
                    <div>No data for game</div>
                </template>
                <template slot="no-results">
                    <div>No options found for search</div>
                </template>
                <template v-slot:item.teamColor="{ item }">
                    <v-avatar style:ma-4 :color="item.team_color"></v-avatar>
                </template>
                <template v-slot:item.moreStats="{ item }">
                    <v-icon color="#ae936c" small title="Stats" @click='showStats(item)'>
                        mdi-poll
                    </v-icon>
                </template>
            </v-data-table>
        </v-card>

        <div>
            <v-dialog persistent v-model="show_stats_visible" max-width=500px>
                <v-card>
                    <v-card-title>
                        <v-layout justify-center>{{selectedStats.player_username}}'s Stats</v-layout>
                    </v-card-title>
                    <v-list-item>
                        <v-list-item-content>Hits: {{otherStats.hits}}</v-list-item-content>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-content>Max Kill Streak: {{otherStats.killStreak}}</v-list-item-content>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-content>Most Hits Against: {{otherStats.maxHit}}</v-list-item-content>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-content>Most Hit By: {{otherStats.maxAttacked}}</v-list-item-content>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-content>K/D: {{otherStats.kd}}</v-list-item-content>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-content>Hit Percentage: {{otherStats.hitPercentage}}%</v-list-item-content>
                    </v-list-item>
                    <v-card-actions>
                        <v-spacer />
                            <v-btn v-on:click="done">Done</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>

<script>
export default {
    props: ["id"],
    watch: {
        id(new_id) {
            this.game_id = new_id;
            this.refresh();
        }
    },
    mounted: function() {
        if (this.game_id != -1) {
            this.setPlayers();
        }
    },
    data: function() {
        return {
            selectedStats: {},
            otherStats: {},
            game_headers: [
                {text: "Name", value: "player_username"},
                {text: "Points", value: "points"},
                {text: "Remaining Lives", value: "remaining_lives"},
                {text: "Ammunition fired", value: "rounds_fired"},
                {text: "Team name", value: "team_name"},
                {text: "Team color", value: "teamColor"},
                {text: "Players Killed", value: "killed"},
                {text: "Gun", value: "gun"},
                {text: "More Stats", value: "moreStats"}
            ],
            search: "",
            players: [],
            game_id: this.id,
            lives: 0,
            name: "",
            time: "",
            winners: null,
            show_stats_visible: false
        }
    },
    methods: {
        showStats(item) {
            this.show_stats_visible = true;
            this.selectedStats = item;
            this.$axios.get(`morestats/${item.player_username}/${this.game_id}`).then(response => {
                this.otherStats = response.data;
                this.otherStats.kd = item.killed.length/this.lives;
                this.otherStats.hitPercentage = Math.round((response.data.hits*100/item.rounds_fired)*100)/100;
            })
        },
        done() {
            this.show_stats_visible = false;
            this.selectedStats = {};
            this.otherStats = {};
        },
        refresh() {
            this.setPlayers();
        },
        setPlayers() {
            if (this.game_id == -1 || this.game_id == 0) {
                this.players = [];
                return;
            }
            this.$axios.get(`game/info/${this.game_id}`).then(response => {
                this.name = response.data.game.name;
                this.time = response.data.time;
                this.winners = response.data.game.winners;
                this.lives = response.data.game.maxLives;
                const stats = response.data.game.stats;
                var players = [];
                for (var i = 0; i < stats.length; i++) {
                    const kill_array = stats[i].killed;
                    var killed = [];
                    for (var j = 0; j < kill_array.length; j++) {
                        killed.push(kill_array[j].player_username);
                    }
                    players.push({
                        player_username: stats[i].player_username,
                        points: stats[i].points,
                        remaining_lives: stats[i].remaining_lives,
                        rounds_fired: stats[i].rounds_fired,
                        killed: killed,
                        gun: stats[i].gun.mac_address,
                        team_name: stats[i].team_name,
                        team_color: stats[i].team_color
                    })
                }
                this.players = players
            }).catch((err) => console.log("An error has occurred: " + err));
        }
    }
}
</script>