<template>
    <v-container>
        <v-row>
            <v-layout justify-center><h1 style="color:#61578b">Welcome!</h1></v-layout>
        </v-row>
        <br>
        <v-row>
            <v-col>
                <current-games></current-games>
            </v-col>
            <v-col>
                <upcoming-games></upcoming-games>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import UpcomingGames from "../components/UpcomingGames";
import CurrentGames from "../components/CurrentGames";
 
export default {
    name: "Home",
    components: {UpcomingGames, CurrentGames}
};
</script>
