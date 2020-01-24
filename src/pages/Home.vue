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
        <div>
            <integer-plusminus :min="min" :max="max" :step="step" v-model="number">
                <div class=my-1>{{number}}</div>
            </integer-plusminus>
        </div>
       
    </v-container>
</template>

<script>
import {IntegerPlusminus} from 'vue-integer-plusminus'
import UpcomingGames from "../components/UpcomingGames";
import CurrentGames from "../components/CurrentGames";
 
export default {
    name: "Home",
    components: {UpcomingGames, CurrentGames, IntegerPlusminus},
    data() {
        return {
            number: 2,
            step: 1,
            min: 2,
            max: 8
        };
    }
};
</script>
