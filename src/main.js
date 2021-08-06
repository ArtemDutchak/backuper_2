// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import VueTouch from 'vue-touch';
import Trend from 'vuetrend';
import Toasted from 'vue-toasted';
import VueApexCharts from 'vue-apexcharts';

import store from './store';
import router from './router';
import App from './App';
import layoutMixin from './mixins/layout';
import Widget from './components/Widget/Widget';
import {i18n} from './i18n'

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(VueTouch);
Vue.use(Trend);
Vue.component('Widget', Widget);
Vue.component('apexchart', VueApexCharts);
Vue.mixin(layoutMixin);
Vue.use(Toasted, { duration: 5000,
                  iconPack : 'material',
                   position: 'bottom-right'
                  } );

Vue.config.productionTip = false;

export const bus = new Vue();

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  toasted: Toasted,
  i18n,
  router,
  render: h => h(App),
});
