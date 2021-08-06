import Vue from 'vue';
import Router from 'vue-router';
import {i18n} from '../i18n'

import Layout from '@/components/Layout/Layout';
import Login from '@/pages/Login/Login';
import ErrorPage from '@/pages/Error/Error';


import HomePage from '@/pages/Home/Home';
import SettingsPage from '@/pages/Settings/Settings';


Vue.use(Router);

const router = new Router({
  mode: 'hash',
  base: '/',
  routes: [
    {
      path: '/:lang',
      component:{
        render(c){return c('router-view')}
      },
      children: [
        { path: '/', name: 'Home'},
        { path: 'login', name: 'Login', component: Login },
        { path: 'error', name: 'Error', component: ErrorPage },
        { path: 'app', name: 'Layout', component: Layout, children: [
          { path: 'home', name: 'HomePage', component: HomePage },
          { path: 'settings', name: 'SettingsPage', component: SettingsPage },
        ]}
      ]
    }
  ],
})

const allowed_languages = ['en', 'ru']

router.beforeEach((to, from, next) => {

  // eslint-disable-next-line
  console.log(from.path)
  // eslint-disable-next-line
  console.log(to.path)

  let language = to.params.lang
  if (language) {
    if (allowed_languages.includes(language)) {
      i18n.locale = language
    }else{
      router.push({name: to.name, params: { lang: 'ru' }})
    }
  }else{
    router.push({name: 'HomePage', params: { lang: 'ru' }})
  }

  next()

})

export default router
