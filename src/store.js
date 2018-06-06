import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    userAddress: '',
    activeName: 'home',
  },
  mutations: {
    setUserAddress(state, n) {
      state.userAddress = n;
    },
  },
  actions: {
    setUserAddress(context, n) {
      context.commit('setUserAddress', n);
    },
  },
});
