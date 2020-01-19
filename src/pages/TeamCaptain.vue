<template>
    <v-container>
        <v-layout justify-center>
            <v-card v-if=!signedIn>
                <v-toolbar>
                    <v-toolbar-title>Sign in</v-toolbar-title>
                </v-toolbar>
                <v-card-text>
                    <v-form ref="form" v-model="valid">
                        <v-text-field label="Username" name="username" v-model="username" :rules="usernameRules" required></v-text-field>
                        <v-text-field label="Password" name="password" v-model="password" :rules="passwordRules" required></v-text-field>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn v-on:click="submit" :disabled="!valid">Submit</v-btn>
                </v-card-actions>
            </v-card>
        </v-layout>
    </v-container>
</template>

<script>
export default {
    data: function() {
        return {
            signedIn: false,
            username: "",
            usernameRules: [
                v => !!v || 'Username is required'
            ],
            password: "",
            passwordRules: [
                v => !!v || 'Password is required'
            ],
            valid: false
        }
    },
    methods: {
        submit() {
            this.$axios.get(`player/${this.username}/${this.password}`).then(response => {
                if (response.data.ok) this.signedIn = true;
            })
        }
    }
}
</script>