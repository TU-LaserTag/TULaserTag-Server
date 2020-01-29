<template>
    <v-container fluid>
        <v-layout justify-center>
            <v-card v-if=!signedIn>
                <v-toolbar>
                    <v-toolbar-title>Sign in</v-toolbar-title>
                </v-toolbar>
                <v-card-text>
                    <v-form ref="form" v-model="valid">
                        <v-text-field label="Username" name="username" v-model="username" :rules="usernameRules" required></v-text-field>
                        <v-text-field label="Password" name="password" type="password" v-model="password" :rules="passwordRules" required></v-text-field>
                    </v-form>
                    <v-spacer />
                    <span style="color:red; font-size:17px">{{message}}</span>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn v-on:click="submit" :disabled="(!valid || banned)">Submit</v-btn>
                </v-card-actions>
            </v-card>
        </v-layout>
        <v-toolbar flat fluid v-if=signedIn>
            <span class='pa-2' style='font-size:24px'> Hello, <span style='font-style:italic'>{{username}}!</span></span>    
            <v-spacer />
            <span class=mr-6><font style=font-size:24px>Options:</font></span>

            <v-btn class=ma-2 color="#61578b" raised v-on:click="viewTeams">
                <font color="white">Teams</font>
            </v-btn>

            <v-btn class=ma-2 color="#61578b" raised v-on:click="viewPlayers">
                <font color="white">Players</font>
            </v-btn>
        
            <v-btn class=ma-2 color="#61578b" raised v-on:click="viewGames">
                <font color=white>Games</font>
            </v-btn>

            <!-- <v-btn class=ma-2 color="#61578b" raised v-on:click="viewLeagues">
                <font color="white" >Leagues</font>
            </v-btn> -->

            <v-btn class=ma-2 color="#61578b" raised v-on:click="viewGuns">
                <font color="white">guns</font>
            </v-btn>

            <v-btn class=ma-2 color="#61578b" raised v-on:click="viewAnnouncements">
                <font color=white>Announcements</font>
            </v-btn>
        </v-toolbar>
        <br><br>
        <v-row>
            <v-layout justify-center>
                <div v-if="(table == 'players')">
                    <player-table></player-table>
                </div>
                <div v-if="(table == 'teams')">
                    <team-table></team-table>
                </div>
                <div v-if="(table == 'games')">
                    <game-table></game-table>
                </div>
                <div v-if="(table == 'announcements')">
                    <announcement-table></announcement-table>
                </div>
                <div v-if="(table == 'guns')">
                    <gun-table></gun-table>
                </div>
            </v-layout>
        </v-row>
    </v-container>
</template>

<script>
import PlayerTable from "../components/PlayerTable";
import TeamTable from "../components/TeamTable";
import AnnouncementTable from "../components/AnnouncementTable";
import GameTable from "../components/GameTable";
import GunTable from "../components/GunTable";
//import LeagueTable from "../components/LeagueTable";
export default {
    components: {PlayerTable, TeamTable, AnnouncementTable, GameTable, GunTable /*, LeagueTable*/},
    data: function() {
        return {
            signedIn: false,
            banned: false,
            username: "",
            usernameRules: [
                v => !!v || 'Username is required'
            ],
            password: "",
            passwordRules: [
                v => !!v || 'Password is required'
            ],
            message:"",
            table:"",
            valid: false
        }
    },
    methods: {
        submit() {
            this.$axios.get(`player/${this.username}/${this.password}`).then(response => {
                if (response.data.ok) {
                    const admin = response.data.person.roles.admin;
                    if (admin) {
                        this.signedIn = true;
                    }
                    else {
                        this.banned = true;
                        this.message = "Not an admin. Please contact an admin to become one"
                    }
                }
                else this.message = response.data.message;
            })
        },
        viewTeams() {
            this.table = "teams"
        },
        viewGames() {
            this.table = "games";
        },
        viewPlayers() {
            this.table = "players"
        },
        // viewLeagues() {
        //     this.table = "leagues"
        // },
        viewGuns() {
            this.table = "guns"
        },
        viewAnnouncements() {
            this.table = "announcements"
        }
    }
}
</script>