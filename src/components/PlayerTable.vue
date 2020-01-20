<template>
    <div>
        <v-card>
            <v-card-title>
                <v-row>
                    <v-col cols=2>
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
        
        <div>
            <v-dialog persistent v-model="edit_player_visible" max-width=500px>
                <v-card>
                    <v-card-title>
                        Edit Player Table
                    </v-card-title>
                    <v-form v-model="valid">
                        <v-card-text>
                            <v-text-field label="Username" v-model="selectedPlayer.username" :rules="usernameRules" required>
                            </v-text-field>
                            <v-text-field label="Password" v-model="selectedPlayer.password">
                            </v-text-field>
                            <v-checkbox color="#007476" label="Admin" v-model="selectedPlayer.admin"></v-checkbox>
                            <v-checkbox color="#007476" label="Host" v-model="selectedPlayer.possible_host"></v-checkbox>
                            <v-checkbox color="#007476" label="Team Captain" v-model="selectedPlayer.team_captain"></v-checkbox>
                            <span style="color:red; font-size:17px">{{message}}</span>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer />
                            <v-btn v-on:click="patchPlayer" :disabled="!valid">Submit</v-btn>
                            <v-btn v-on:click="cancel">Cancel</v-btn>
                        </v-card-actions>
                    </v-form>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>

<script>
export default {
    data: function() {
        return {
            selectedPlayer: {},
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
            players: [],
            edit_player_visible: false,
            usernameRules: [
                v => !!v || 'Username is required'
            ],
            valid: false,
            message: ""
        }
    },
    mounted: function () {
        this.$axios.get('players').then(response => {
            const player_list = response.data;
            var players = [];
            for (var i = 0; i < player_list.length; i++) {
                players.push({
                    id: i,
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
            this.selectedPlayer = JSON.parse(JSON.stringify(player));
            this.edit_player_visible = true;
        },
        deletePlayer(player) {
            console.log("Delete " + player);
        },
        newPlayer() {
            console.log("Refresh data");
        },
        patchPlayer() {
            
            
            this.edit_player_visible = false;
            console.log("Nice try");
        },
        cancel() {
            this.edit_player_visible = false;
        }
    }
}
</script>