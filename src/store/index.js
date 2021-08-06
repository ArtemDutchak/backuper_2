import Vue from 'vue';
import Vuex from 'vuex';

import layout from './layout';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    layout,
  },
  state:{
    colors:[
      '#66666610',
      '#969696',
      '#00b392',
      '#038a01',
      '#b38400',
      '#0058b3',
      '#9700b3',
      '#b34a00',
      '#b30000',
    ],
    settings:{},
    logs:[]
  },
  mutations:{
    set_settings(state, data){
      state.settings = JSON.parse(JSON.stringify(data))
    },
    set_logs(state, data){
      state.logs = JSON.parse(JSON.stringify(data))
    }
  },
  actions:{
    set_settings(ctx, data){
      const obj = {}
      for (const setting of data) {
        obj[setting.name] = setting
      }
      ctx.commit('set_settings', obj)
    },
    set_logs(ctx, data){
      ctx.commit('set_logs', data)
    }
  },
  getters:{
    settings(state){
      return state.settings
    },
    logs(state){
      return state.logs
    }
  }
});
