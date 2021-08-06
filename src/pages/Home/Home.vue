<template>
  <div class="page">
    <div>
      <table class="table">
        <tr v-for="(log, index) in logs" :key="index">
          <td v-if="log.type == 'success'">
            <b-icon icon="check" variant="success"></b-icon>
          </td>
          <td v-else-if="log.type == 'warning'">
            <b-icon icon="exclamation" variant="warning"></b-icon>
          </td>
          <td>{{ log.date_time }}</td>
          <td>{{ log.text }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
const electron = window.require('electron')
const {ipcRenderer} = electron
// import { bus } from '../../main'

export default {
  name: 'HomePage',
  components: {
  },
  data(){
    return {
      title: 'HomePage',
    }
  },
  methods:{

  },
  mounted(){
    ipcRenderer.send('refresh_log','backup')
  },
  computed:{
    logs(){
      return this.$store.getters.logs
    }
  },
  created(){

  },
  destroyed(){

  }
};
</script>

<style src="./Home.scss" lang="scss" scoped />
