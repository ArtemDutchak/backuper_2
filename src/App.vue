<template>
  <router-view />
</template>

<script>
const electron = window.require('electron')
const {ipcRenderer} = electron
import { bus } from './main'

export default {
  name: 'App',
  methods:{
  },
  computed:{
    settings(){
      return this.$store.getters.settings
    }
  },
  created() {
    const self = this
    const currentPath = this.$router.history.current.path;

    // if (window.localStorage.getItem('authenticated') === 'false') {
    //   this.$router.push('/login');
    // }
    ipcRenderer.send(`refresh_settings`)

    if (currentPath === '/' || currentPath === '/app') {
      this.$router.push('/app/home');
    }

    ipcRenderer.on('settings_from_server_to_app',function(e, data){
      self.$store.dispatch('set_settings', data)
    })

    ipcRenderer.on('logs_from_server_to_app',function(e, data){
      self.$store.dispatch('set_logs', data)
    })

    ipcRenderer.on('set_localization',function(e, lang){
      if (self.$i18n.locale != lang) {
        self.$i18n.locale = lang
        self.$router.push({
          params: {lang}
        })
      }
    })
    ipcRenderer.on('msg_from_server', function (e, data) {
      self.$toasted[data.type](data.text).goAway(3000)
    })


    ipcRenderer.on('play_audio',function(e, src){
      bus.$emit('play_audio', src)
    })


  },
};
</script>

<style src="./styles/theme.scss" lang="scss" />
