<template>
  <b-navbar class="header d-print-none app-header">

    <b-nav>
      <b-nav-item>
        <a class="d-md-down-none px-2" href="#" @click="toggleSidebarMethod" id="barsTooltip">
          <i class='la la-bars la-lg' />
        </a>
        <a class="fs-lg d-lg-none" href="#" @click="switchSidebarMethod">
          <i class="la la-bars la-lg" />
        </a>
      </b-nav-item>
    </b-nav>
    <a  class="navbarBrand d-md-none">
      <i class="fa fa-circle text-primary mr-n-sm" />
      <i class="fa fa-circle text-danger" />
      &nbsp;
      sing
      &nbsp;
      <i class="fa fa-circle text-danger mr-n-sm" />
      <i class="fa fa-circle text-primary" />
    </a>
    <b-nav class="ml-auto">
      <!-- <b-nav-item-dropdown
        class="notificationsMenu d-md-down-none mr-2"
        menu-class="notificationsWrapper py-0 animated animated-fast fadeIn"
        right>
        <template slot="button-content">
          <span class="avatar rounded-circle thumb-sm float-left mr-2">
            <img class="rounded-circle" src="../../assets/people/a5.jpg" alt="..." />
          </span>
          <span class="small">Philip Smith</span>
          <span class="ml-1 circle bg-primary text-white fw-bold">13</span>
        </template>
        <Notifications />
      </b-nav-item-dropdown> -->
      <!-- <b-nav-item-dropdown id="v-step-2" class="settingsDropdown" no-caret right>
        <template slot="button-content">
          <i class="la la-cog px-2" />
        </template>
        <b-dropdown-item-button @click="switch_lang('en')">
          <span>EN</span>
        </b-dropdown-item-button>
        <b-dropdown-item-button @click="switch_lang('ru')">
          <span>RU</span>
        </b-dropdown-item-button>
      </b-nav-item-dropdown> -->
    </b-nav>

    <audio ref="audio_success" src="../../assets/success.mp3"></audio>
    <audio ref="audio_warning" src="../../assets/warning.mp3"></audio>

  </b-navbar>

</template>

<script>
import { mapState, mapActions } from 'vuex';
import Notifications from '@/components/Notifications/Notifications';
const electron = window.require('electron')
const {ipcRenderer} = electron
import { bus } from '../../main'

export default {
  name: 'Header',
  components: { Notifications },
  computed: {
    ...mapState('layout', ['sidebarClose', 'sidebarStatic']),
  },
  data(){
    return{
      sh_cp: false,
      cp_type: '',
      cp_id: '',
    }
  },
  methods: {
    ...mapActions('layout', ['toggleSidebar', 'switchSidebar', 'changeSidebarActive']),
    switchSidebarMethod() {
      if (!this.sidebarClose) {
        this.switchSidebar(true);
        this.changeSidebarActive(null);
      } else {
        this.switchSidebar(false);
        const paths = this.$route.fullPath.split('/');
        paths.pop();
        this.changeSidebarActive(paths.join('/'));
      }
    },
    toggleSidebarMethod() {
      if (this.sidebarStatic) {
        this.toggleSidebar();
        this.changeSidebarActive(null);
      } else {
        this.toggleSidebar();
        const paths = this.$route.fullPath.split('/');
        paths.pop();
        this.changeSidebarActive(paths.join('/'));
      }
    },
    switch_lang(lang){
      if (this.$i18n.locale != lang) {
        this.$i18n.locale = lang
        ipcRenderer.send(`switch_lang`,lang)
        this.$router.push({
          params: {lang}
        })
      }
    },
    logout() {
      window.localStorage.setItem('authenticated', false);
      this.$router.push('/login');
    },
    play_audio(elem) {
      this.$refs[elem].play()
    }
  },
  mounted(){
    bus.$on('play_audio', elem=>{
      this.play_audio(elem)
    })
  },
  created (){

  }
};
</script>

<style src="./Header.scss" lang="scss"></style>
