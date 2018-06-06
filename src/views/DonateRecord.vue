<template>
  <div class="article_contanier">
    <Table :loading="loading" class="donate-record-table" border :columns="columns" :data="list"></Table>
    <Page
      :current="currentPage"
      :total="total"
      :page-size="pageSize"
      show-elevator
      @on-change="pageChange"
      size="small"
    ></Page>
  </div>
</template>

<style lang="less">
  .article_contanier {
    max-width: 1000px;
    margin: 0 auto;
  }
  .donate-record-table {
    margin-bottom: 20px;
  }
</style>

<script>
import BigNumber from 'bignumber.js';
import nebulas from 'nebulas';

import {
  DAPP_ADDRESS,
  HTTP_URL,
  // PAY_HOST,
} from '../env';
import Utils from '../utils';

const neb = new nebulas.Neb();
neb.setRequest(new nebulas.HttpRequest(HTTP_URL));


export default {
  data() {
    return {
      list: [],
      loading: true,
      currentPage: 1,
      total: 0,
      pageSize: 20,
      totalPage: 0,
      columns: [
        {
          title: '捐赠者',
          key: 'from'
        },
        {
          title: '时间',
          key: 'time',
          render: (h, params) => {
            return h('div', this.timeFormate(params.row.time));
          }
        },
        {
          title: 'NAS',
          key: 'value',
          render: (h, params) => {
            return h('div', this.turnNas(params.row.value));
          }
        }
      ],
    }
  },
  created() {
    document.title = 'Article-收到的打赏';
    this.init();
  },
  methods: {
    init() {
      if(this.$store.state.userAddress) {
        this.queryDonate(this.currentPage);
      } else {
        Utils.getWallectAddress((from) => {
          this.$store.dispatch('setUserAddress', from);
          this.queryDonate(this.currentPage);
        });
      }
    },
    timeFormate(val) {
      if(val) {
        return Utils.formateDate(val);
      }
    },
    turnNas(wei) {
      return new BigNumber(wei/(1e18)).toFormat();
    },
    loadMore() {
      if(this.currentPage < this.totalPage) {
        this.currentPage += 1;
        this.queryDonate(this.currentPage);
      }
    },
    refresh() {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      // this.queryDonate(1, false);
    },
    pageChange(page) {
      this.queryDonate(page);
    },
    queryDonate(currentPage) {
      this.loading = true;
      var value = "0";
      var nonce = "0";
      var gas_price = "1000000"
      var gas_limit = "2000000"
      var contract = {
        "function": 'queryDonate',
        "args": JSON.stringify([currentPage]),
      }

      neb.api.call(
        this.$store.state.userAddress,
        DAPP_ADDRESS,
        value,
        nonce,
        gas_price,
        gas_limit,
        contract,
      ).then((res) => {
        this.loading = false;
        var data = res.result;
        if(data) {
          data = JSON.parse(data);
        }
        this.total = data.total;
        this.currentPage = data.pageNo;
        this.totalPage = Math.ceil(this.total/this.pageSize);
        this.list = data.list;
        console.log(data);
      }).catch((err) => {
        this.loading = false;
        this.$Message.error(err.message);
      })
    },
  }
}
</script>
