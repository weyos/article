<template>
  <div class="article_contanier">
    <div v-if="ready">
      <div v-if="list.length">
        <div class="article-card-component_container" v-for="(item,index) in list" :key="item.author + index">
          <ArticleCard :refresh="refresh" :item="item"/>
        </div>
      </div>
      <div class="container_placeholder" v-else>
        您还没有消费记录，快去<router-link to="/">看看</router-link>吧！
      </div>
      <div v-if="!loading && currentPage < totalPage" class="load-more">
        <a @click="loadMore">点击加载更多</a>
      </div>
    </div>
    <Spin v-if="loading">加载中...</Spin>
  </div>
</template>

<style lang="less">
  .article_contanier {
    max-width: 1000px;
    margin: 0 auto;
  }
  
</style>

<script>
import nebulas from 'nebulas';
import {
  DAPP_ADDRESS,
  HTTP_URL,
  // PAY_HOST,
} from '../env';
import Utils from '../utils';
import ArticleCard from '../components/ArticleCard';

const neb = new nebulas.Neb();
neb.setRequest(new nebulas.HttpRequest(HTTP_URL));


export default {
  data() {
    return {
      list: [],
      loading: false,
      ready: false,
      currentPage: 1,
      total: 0,
      pageSize: 20,
      totalPage: 0,
      searchType: '',
    }
  },
  components: {
    ArticleCard,
  },
  created() {
    document.title = 'Article-我的账单';
    this.init();
  },
  methods: {
    init() {
      if(this.$store.state.userAddress) {
        this.queryBill(this.currentPage);
      } else {
        Utils.getWallectAddress((from) => {
          this.$store.dispatch('setUserAddress', from);
          this.queryBill(this.currentPage);
        });
      }
    },
    loadMore() {
      if(this.currentPage < this.totalPage) {
        this.currentPage += 1;
        this.queryBill(this.currentPage);
      }
    },
    refresh() {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      // this.queryBill(1, false);
    },
    queryBill(currentPage, needConcat = true) {
      this.loading = true;
      var value = "0";
      var nonce = "0";
      var gas_price = "1000000"
      var gas_limit = "2000000"
      var contract = {
        function: 'queryBill',
        args: JSON.stringify([{
          type: this.searchType,
          pageNo: currentPage,
        }]),
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
        this.ready = true;
        var data = res.result;
        if(data) {
          data = JSON.parse(data);
        }
        this.total = data.total;
        this.currentPage = data.pageNo;
        this.totalPage = Math.ceil(this.total/this.pageSize);
        if(needConcat) {
          this.list = this.list.concat(data.list);
        } else {
          this.list = data.list;
        }
        // console.log(data);
      }).catch((err) => {
        this.loading = false;
        this.ready = true;
        this.$Message.error(err.message);
      })
    },
  }
}
</script>
