<template>
    <div>
        <v-card>
            <v-card-title>
                <v-row>
                    <v-col cols=2>
                        <v-layout justify-left>
                        <v-btn outlined color=#61578b @click='refreshData()'>Refresh</v-btn>
                        </v-layout>
                    </v-col>
                    <v-col>
                        <v-layout justify-center>Player Table</v-layout>
                    </v-col>
                    <v-col cols=2>
                        <v-text-field class="pt-0 mt-0" v-model="search" label="Search" single-line hide-details ></v-text-field>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-data-table v-bind:headers="player_headers" v-bind:items="players" v-bind:search="search">
                <template slot="no-data">
                    <div>No data for game</div>
                </template>
                <template slot="no-results">
                    <div>No options found for search</div>
                </template>
                <template v-slot:item.team_captain="{ item }">
                    <v-icon>
                    {{ item.team_captain ? "mdi-checkbox-marked" : "mdi-checkbox-blank-outline" }}
                    </v-icon>
                </template>
                <template v-slot:item.possible_host="{ item }">
                    <v-icon>
                    {{ item.possible_host ? "mdi-checkbox-marked" : "mdi-checkbox-blank-outline" }}
                    </v-icon>
                </template>
                <template v-slot:item.admin="{ item }">
                    <v-icon>
                    {{ item.admin ? "mdi-checkbox-marked" : "mdi-checkbox-blank-outline" }}
                    </v-icon>
                </template>
                <template v-slot:item.editPlayer="{ item }">
                    <v-icon color="#ae936c" small title="Delete" @click='editPlayerInfo(item)'>
                        mdi-lead-pencil
                    </v-icon>
                </template>
                <template v-slot:item.deletePlayer="{ item }">
                    <v-icon color="#ae936c" small title="Edit" @click='deletePlayer(item)'>
                        mdi-delete
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
            search: "",
            player_headers: [
                {text: "Username", value: "username"},
                {text: "Password", value: "password"},
                {text: "Admin", value: "admin"},
                {text: "Host", value: "possible_host"},
                {text: "Team Captain", value: "team_captain"},
                {text: "Edit Player", value: "editPlayer"},
                {text: "Delete Player", value: "deletePlayer"}
            ],
            players: []
        }
    },
    mounted: function () {
        this.$axios.get('players').then(response => {
            const player_list = response.data;
            var players = [];
            for (var i = 0; i < player_list.length; i++) {
                players.push({
                    username: response.data[i].username,
                    password: response.data[i].password.password,
                    admin: response.data[i].roles.admin,
                    possible_host: response.data[i].roles.possible_host,
                    team_captain: response.data[i].roles.team_captain
                })
            }
            this.players = players;
        })
    },
    methods: {
        editPlayerInfo(player) {
            console.log("Edit " + player);
        },
        deletePlayer(player) {
            console.log("Delete " + player);
        },
        refreshData() {
            console.log("Refresh data");
        }
    }
}
</script>