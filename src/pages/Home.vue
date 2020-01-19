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
        <color-picker v-model="color"></color-picker>
        <div>
            Color:
            <input v-model="color" type="text">
        </div>
        <div>
            <v-avatar :color="this.color_array[0]"></v-avatar>
            <v-avatar :color="this.color_array[1]"></v-avatar>
            <v-avatar :color="this.color_array[2]"></v-avatar>
            <v-avatar :color="this.color_array[3]"></v-avatar>
            <v-avatar :color="this.color_array[4]"></v-avatar>
            <v-avatar :color="this.color_array[5]"></v-avatar>
            <v-avatar :color="this.color_array[6]"></v-avatar>
            <v-avatar :color="this.color_array[7]"></v-avatar>
        </div>
       
    </v-container>
</template>

<script>
import ColorPicker from 'vue-color-picker-wheel';
import UpcomingGames from "../components/UpcomingGames";
import CurrentGames from "../components/CurrentGames";
 
export default {
    name: "Home",
    components: {UpcomingGames, CurrentGames, ColorPicker},
    data() {
        return {
            color: '#ffffff',
            color_array: ["#000000", "#000000","#000000", "#000000","#000000", "#000000","#000000", "#000000"]
        };
    },
    created: function() {
        const rand_num2 = Math.floor(Math.random()*25);
        const rand_num3 = Math.floor(Math.random()*25);
        const rand_num4 = Math.floor(Math.random()*25);
        const rand_num5 = Math.floor(Math.random()*15) + 240;
        const rand_num6 = Math.floor(Math.random()*15) + 115;
        const rand_num7 = Math.floor(Math.random()*15) + 10;
        const rand_num8 = Math.floor(Math.random()*15) + 65; //talk over these two with Physics guys next week
        const rand_num9 = Math.floor(Math.random()*15) + 20; //this one as well. Need to decide what color the last option should be.
        for (var k = 0; k < 8; k++) {
            var rand_array = [rand_num2, rand_num3, rand_num4]
            if (k % 2 == 0) {
                rand_array[2] = 255-rand_num4;
            }
            if (k % 4 < 2) {
                rand_array[1] = 255-rand_num3;
            }
            if (k < 4) {
                rand_array[0] = 255-rand_num2;
            }
            if (k == 0) {
                rand_array = [rand_num5, rand_num6, rand_num7];
            }
            else if (k == 7) {
                rand_array = [rand_num7, rand_num8, rand_num9];
            }
            for (var h = 0; h < 3; h++) {
                var rand_val = rand_array[h];
                if (rand_val < 16) {
                    rand_val = rand_val.toString(16);
                    rand_val = "0" + rand_val;
                    rand_array[h] = rand_val
                }
            }
            this.color_array[k] = "#" + rand_array[0].toString(16) + rand_array[1].toString(16) + rand_array[2].toString(16);
            console.log(this.color_array[k]);
        }
    }
};
</script>
