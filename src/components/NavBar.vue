<template>
    <v-app-bar app clipped-left color="#61578b">
        <v-row class="justify-baseline">
        <v-col cols=11 xl=11 lg=10 md=9 sm=8 xs=1>
            <v-btn fab color=#209cee v-bind:to="{ name: 'home-page'}">
                <v-icon color="white">
                    mdi-home
                </v-icon>
            </v-btn>
        </v-col>
            <v-col>
                <v-row class="align-center justify-baseline">
                    <p class="mt-4" style="color:white; font-size:18px">Visit Taylor:</p>
                    <div><v-btn fab class="ms-2" color="#209cee" href="https:/taylor.edu"><v-avatar><v-img :src="item.src"></v-img></v-avatar></v-btn></div>
                </v-row>
            </v-col>
        </v-row>
    </v-app-bar>
</template>

<script>
export default {
    data() {
        return {
            item: {src: require('@/components/testlogo.png')}
        }
    }
}
</script>