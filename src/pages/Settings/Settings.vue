<template>
  <div class="page">
    <b-row>
      <b-col cols="12">
        <Widget class="h-100 mb-0" :title="$t('titles.settings')">
          <b-row>
            <b-col>
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th></th>
                    <th></th>
                    <th width="100px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{{ $t(`settings.main_dir_source`) }}</td>
                    <td>{{ settings.main_dir_source_path.value }}</td>
                    <td>
                      <b-button variant="light" size="sm" @click="save_path('main_dir_source_path', ['openDirectory'])">
                        <b-icon icon="folder" :variant="main_dir_source_path_class"></b-icon>
                      </b-button>
                    </td>
                  </tr>
                  <tr>
                    <td>{{ $t(`settings.main_dir_dest`) }}</td>
                    <td>{{ settings.main_dir_dest_path.value }}</td>
                    <td>
                      <b-button variant="light" size="sm" @click="save_path('main_dir_dest_path', ['openDirectory'])">
                        <b-icon icon="folder" :variant="main_dir_dest_path_class"></b-icon>
                      </b-button>
                    </td>
                  </tr>
                  <tr>
                    <td>{{ $t('settings.scan_period') }}</td>
                    <td></td>
                    <td>
                      <b-dropdown right variant="light" :text="scan_text" size="sm">
                        <b-dropdown-item @click="set_scan_period(10)">10 {{ $tc('count.seconds', 10) }}</b-dropdown-item>
                        <b-dropdown-item @click="set_scan_period(30)">30 {{ $tc('count.seconds', 30) }}</b-dropdown-item>
                        <b-dropdown-item @click="set_scan_period(60)">60 {{ $tc('count.seconds', 60) }}</b-dropdown-item>
                        <b-dropdown-item @click="set_scan_period(0)">{{ $t('titles.disable') }}</b-dropdown-item>
                      </b-dropdown>
                    </td>
                  </tr>
                </tbody>
              </table>
            </b-col>
          </b-row>
        </Widget>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import Widget from '@/components/Widget/Widget';
const electron = window.require('electron')
const {ipcRenderer} = electron
const fs = window.require("fs");
const {dialog} = window.require('electron').remote;
// import { bus } from '@/main'

export default {
  name: 'Settings',
  components: {
    Widget
  },
  data(){
    return {
      main_dir_source_path_class:'',
      main_dir_dest_path_class:'',
      success_file_path_class:'',
      fail_file_path_class:'',
    }
  },
  methods:{
    save_path(dir_type, properties){
      dialog.showOpenDialog({properties}).then(res => {
        const _setting = this.settings[dir_type]
        let dir_path = ''
        if (res.filePaths.length) {
          dir_path = res.filePaths[0]
        }
        if (dir_path) {
          _setting.value = dir_path
          ipcRenderer.send(`save_setting`,_setting)
          this.check_path()
        }
      });
    },
    check_path(){
      if (
        this.settings.main_dir_source_path.value &&
        this.settings.main_dir_dest_path.value &&
        this.settings.main_dir_source_path.value == this.settings.main_dir_dest_path.value
      ) {
        this.main_dir_source_path_class = 'danger'
        this.main_dir_dest_path_class = 'danger'
      }else{
        if (fs.existsSync(this.settings.main_dir_source_path.value)) {
          this.main_dir_source_path_class = 'success'
        }else{
          this.main_dir_source_path_class = 'danger'
        }
        if (fs.existsSync(this.settings.main_dir_dest_path.value)) {
          this.main_dir_dest_path_class = 'success'
        }else{
          this.main_dir_dest_path_class = 'danger'
        }
      }
    },
    set_scan_period(seconds){
      const _setting = this.settings.scan_period
      if (_setting.value != seconds) {
        _setting.value = seconds
        ipcRenderer.send(`save_setting`,_setting)
      }
    }
  },
  computed:{
    settings(){
      return this.$store.getters.settings
    },
    scan_text(){
      return this.settings.scan_period.value ? this.settings.scan_period.value  + ' ' + this.$tc('count.seconds', this.settings.scan_period.value) : this.$t('titles.disabled')
    }
  },
  mounted(){
    this.check_path()
    this.check_path()
  },
  created(){

  },
  destroyed(){
    ipcRenderer.send(`compact_database`, 'settings')
  }
};
</script>

<style src="./Settings.scss" lang="scss" />
