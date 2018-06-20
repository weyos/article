import nebulas from 'nebulas';
import CryptoJS from 'crypto-js';
import store from '../store';

const Account = nebulas.Account;

export default {
  getWallectAddress(callback) {
    if (this.checkPlugins().type === 'mobile') {
      const userAddress = window.localStorage.getItem('userAddress') || Account.NewAccount().getAddressString();
      store.dispatch('setUserAddress', userAddress);
      callback(userAddress);
    } else {
      window.postMessage({
        target: 'contentscript',
        data: {},
        method: 'getAccount',
      }, '*');
      window.addEventListener('message', (e) => {
        if (e.data && e.data.data) {
          if (e.data.data.account) {
            callback(e.data.data.account);
          }
        }
      });
    }
  },
  formateDate(timeStamp) {
    const date = new Date(timeStamp);
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minutes = date.getMinutes();
    if (month < 10) {
      month = `0${month}`;
    }
    if (day < 10) {
      day = `0${day}`;
    }
    if (hour < 10) {
      hour = `0${hour}`;
    }
    if (minutes < 10) {
      minutes = `0${minutes}`;
    }

    return `${year}/${month}/${day} ${hour}:${minutes}`;
  },
  checkPlugins() {
    const UA = window.navigator.userAgent.toLocaleUpperCase();
    if (UA.indexOf('ANDROID') > -1) {
      return {
        type: 'mobile',
        platform: 'android',
      };
    } else if (UA.indexOf('IPHONE') > -1 || UA.indexOf('IPAD') > -1) {
      return {
        type: 'mobile',
        platform: 'ios',
      };
    }
    return {
      type: 'pc',
      plugins: window.webExtensionWallet != undefined,
    };
  },
  encrypt(value) {
    const key = CryptoJS.enc.Utf8.parse('xqgfhgdsdshtyrewewdsdsdsdvchhtjk');
    const encrypted = CryptoJS.AES.encrypt(value, key, {
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.ECB,
    });
    return encrypted.toString();
  },
  decrypt(value) {
    const key = CryptoJS.enc.Utf8.parse('xqgfhgdsdshtyrewewdsdsdsdvchhtjk');
    const decrypted = CryptoJS.AES.decrypt(value, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  },
};
