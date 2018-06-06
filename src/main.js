import Vue from 'vue';
import iView from 'iview';
import mavonEditor from 'mavon-editor';
import 'iview/dist/styles/iview.css';
import 'mavon-editor/dist/css/index.css';

import App from './App';
import router from './router';
import store from './store';

import './styles/common.less';

Vue.use(iView);
Vue.use(mavonEditor);

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>',
});
