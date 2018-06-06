import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home';
import Publish from './views/Publish';
import Detail from './views/Detail';
import MyArticle from './views/MyArticle';
import PurchasedRecord from './views/PurchasedRecord';
import Collect from './views/Collect';
import Bill from './views/Bill';
import DonateRecord from './views/DonateRecord';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/publish',
      name: 'publish',
      component: Publish,
    },
    {
      path: '/detail',
      name: 'detail',
      component: Detail,
    },
    {
      path: '/myarticle',
      name: 'myarticle',
      component: MyArticle,
    },
    {
      path: '/purchasedrecord',
      name: 'purchasedrecord',
      component: PurchasedRecord,
    },
    {
      path: '/collect',
      name: 'collect',
      component: Collect,
    },
    {
      path: '/bill',
      name: 'bill',
      component: Bill,
    },
    {
      path: '/donaterecord',
      name: 'donaterecord',
      component: DonateRecord,
    },
  ],
});
