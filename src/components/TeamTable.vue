<template>
    <div>
        <v-card>
            <v-card-title>
                <v-row>
                    <v-col cols=2>
                        <v-btn color="#61578b" raised v-on:click="addTeam">
                        <font color=white>Add Team</font>
                        </v-btn>
                    </v-col>
                    <v-col>
                        <v-layout justify-center><h3>Team Table</h3></v-layout>
                    </v-col>
                    <v-col cols=2>
                        <v-text-field class="pt-0 mt-0" v-model="search" label="Search" single-line hide-details ></v-text-field>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-data-table v-bind:headers="team_headers" v-bind:items="teams" v-bind:search="search">
                <template slot="no-data">
                    <div>No teams in database</div>
                </template>
                <template slot="no-results">
                    <div>No options found for search</div>
                </template>
                <template v-slot:item.color="{ item }">
                    <v-avatar style:ma-4 :color="item.color"></v-avatar>
                </template>
                <template v-slot:item.editTeam="{ item }">
                    <v-icon color="#ae936c" medium title="Edit" @click='editTeam(item)'>
                        mdi-lead-pencil
                    </v-icon>
                </template>
                <template v-slot:item.deleteTeam="{ item }">
                    <v-icon color="#ae936c" medium title="Delete" @click='deleteTeam(item)'>
                        mdi-delete
                    </v-icon>
                </template>
            </v-data-table>
        </v-card>
        
        <div>
            <v-dialog persistent v-model="edit_team_visible" max-width=500px>
                <v-card>
                    <v-card-title>
                        <v-layout justify-center>
                        {{action}} Player
                        </v-layout>
                    </v-card-title>
                    <v-form>
                        <v-card-text>
                            <v-text-field label="Name" v-model="selectedTeam.name" required>
                            </v-text-field>
                            <v-text-field label="Color" v-model="selectedTeam.color">
                            </v-text-field>
                            <!--need to put in code for placing people into teams-->
                            <span style="color:red; font-size:17px">{{message}}</span>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer />
                            <v-btn v-on:click="submitTeam" >Submit</v-btn>
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
            selectedTeam: {},
            search: "",
            team_headers: [
                {text: "Id", value: "id"},
                {text: "Name", value: "name"},
                {text: "Color", value: "color"},
                {text: "Players", value: "players"},
                {text: "Edit Team", value: "editTeam"},
                {text: "Delete Team", value: "deleteTeam"}
            ],
            teams: [],
            edit_team_visible: false,
            message: "",
            action: ""
        }
    },
    mounted: function () {
        this.$axios.get('teams').then(response => {
            const team_list = response.data;
            var teams = [];
            for (var i = 0; i < team_list.length; i++) {
                const player_list = team_list[i].players;
                var players = [];
                for (var j = 0; j < player_list.length; j++) {
                    players.push(player_list[j].username);
                }
                teams.push({
                    id: response.data[i].id,
                    name: response.data[i].name,
                    color: response.data[i].color,
                    players: players
                })
            }
            this.teams = teams;
        })
    },
    methods: {
        editTeam(team) {
            this.selectedTeam = JSON.parse(JSON.stringify(team));
            this.action = "Edit";
            this.edit_team_visible = true;
        },
        deleteTeam(team) {
            if (!confirm(`Are you sure you want to delete ${team.username} and all database items associated with this user?`)) {
                return;
            }
        },
        addTeam() {
            this.selectedTeam = {};
            this.action = "New";
            this.edit_team_visible = true;
        },
        postTeam() {
            // this.$axios.post(`create/player`, {
            //     player_username: this.selectedTeam.username,
            //     password: this.selectedTeam.password,
            //     admin: this.selectedTeam.admin,
            //     possible_host: this.selectedTeam.possible_host,
            //     team_captain: this.selectedTeam.team_captain
            // }).then((response) => {
            //     if (response.status == 200) {
            //         if (response.data.ok) {
            //             this.selectedTeam = {};
            //             this.refresh();
            //             this.message = "";
            //             this.edit_team_visible = false;
            //         }
            //         else {
            //             this.message = response.data.message;
            //         }
            //     }
            //     else {
            //         this.message = "Error occurred. Please ensure all fields have valid input";
            //     }
            // }).catch(() => {
            //     this.message = "Error occurred. Please ensure all fields have valid input";
            // })
        },
        patchTeam() {
            // const id = this.selectedTeam.id
            // const old_username = this.teams[id].username;
            // this.$axios.patch(`change/player/${old_username}`, {
            //     player_username: this.selectedTeam.username,
            //     password: this.selectedTeam.password,
            //     admin: this.selectedTeam.admin,
            //     possible_host: this.selectedTeam.possible_host,
            //     team_captain: this.selectedTeam.team_captain
            // }).then((response) => {
            //     if (response.status == 200) {
            //         if (response.data.ok) {
            //             this.selectedTeam = {};
            //             this.refresh();
            //             this.message = "";
            //             this.edit_team_visible = false;
            //         }
            //         else {
            //             this.message = response.data.message;
            //         }
            //     }
            //     else {
            //         this.message = "Error occurred. Please ensure all fields have valid input";
            //     }
            // }).catch(() => {
            //     this.message = "Error occurred. Please ensure all fields have valid input";
            // })
        },
        submitTeam() {
            if (this.action == "Edit") this.patchTeam();
            else this.postTeam();
        },
        cancel() {
            this.message = "";
            this.selectedTeam = {};
            this.edit_team_visible = false;
        },
        refresh() {
            this.$axios.get('teams').then(response => {
                const team_list = response.data;
                var teams = [];
                for (var i = 0; i < team_list.length; i++) {
                    const player_list = team_list[i].players;
                    var players = [];
                    for (var j = 0; j < player_list.length; j++) {
                        players.push(player_list[j].username);
                    }
                    teams.push({
                        id: response.data[i].id,
                        name: response.data[i].name,
                        color: response.data[i].color,
                        players: players
                    })
                }
                this.teams = teams;
            })
        }
    }
}
</script>