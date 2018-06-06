import store from '../store';

export default {
  getWallectAddress: function(callback) {
    if(this.checkPlugins().type === 'mobile') {
      let userAddress = window.localStorage.getItem('userAddress');
      if(userAddress) {
        store.dispatch('setUserAddress', userAddress);
      }
      callback(userAddress);
    } else {
      window.postMessage({
        "target": "contentscript",
        "data": {},
        "method": "getAccount",
      }, "*");
      window.addEventListener('message', function (e) {
        if (e.data && e.data.data) {
          if (e.data.data.account) {
            callback(e.data.data.account);
          }
        }
      });
    }
  },
  formateDate: function(timeStamp) {
    const date = new Date(timeStamp);
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minutes = date.getMinutes();
    if(month < 10) {
      month = '0' + month;
    }
    if(day < 10) {
      day = '0' + day;
    }
    if(hour < 10) {
      hour = '0' + hour;
    }
    if(minutes < 10) {
      minutes = '0' + minutes;
    }

    return `${year}/${month}/${day} ${hour}:${minutes}`;
  },
  checkPlugins() {
    const UA = window.navigator.userAgent.toLocaleUpperCase();
    if(UA.indexOf('ANDROID') > -1 || UA.indexOf('IOS') > -1 || UA.indexOf('IPHONE') > -1 || UA.indexOf('IPAD') > -1) {
      return {
        type: 'mobile',
      }
    } else {
      return {
        type: 'pc',
        plugins: window.webExtensionWallet != undefined,
      }
    }
  },
}