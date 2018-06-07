<template>
  <div class="article_contanier">
    <div v-if="ready">
      <div class="answer_tabs_group clearfix">
        <span @click="changeCondition('')" :class="{'current': searchType === ''}">全部</span>
        <span @click="changeCondition('free')" :class="{'current': searchType === 'free'}">免费</span>
        <span @click="changeCondition('unit')" :class="{'current': searchType === 'unit'}">单价</span>
        <span
          @click="changeCondition('total')"
          :class="{'current': searchType === 'total'}"
        >众筹</span>
      </div>
      <div v-if="list.length">
        <div
          class="article-card-component_container"
          v-for="(item,index) in list"
          :key="item.author + index">
          <ArticleCard :refresh="refresh" :item="item"/>
        </div>
      </div>
      <div class="container_placeholder" v-else>
        还有没这类数据，快来<router-link to="/publish">这里</router-link>发个文章吧！
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
    };
  },
  components: {
    ArticleCard,
  },
  created() {
    document.title = 'Article-发现';
    this.init();
  },
  methods: {
    init() {
      if(this.$store.state.userAddress) {
        this.queryArticle(this.currentPage);
      } else {
        Utils.getWallectAddress((from) => {
          this.$store.dispatch('setUserAddress', from);
          this.queryArticle(this.currentPage);
        });
      }
    },
    loadMore() {
      if(this.currentPage < this.totalPage) {
        this.currentPage += 1;
        this.queryArticle(this.currentPage);
      }
    },
    refresh() {
      // setTimeout(() => {
      //   window.location.reload();
      // }, 2000);
      this.queryArticle(1, false);
    },
    changeCondition(val) {
      if(this.searchType !== val) {
        this.searchType = val;
        this.currentPage = 1;
        this.queryArticle(1, false);
      }
    },
    queryArticle(currentPage, needConcat = true) {
      this.loading = true;
      const value = '0';
      const nonce = '0';
      const gasPrice = '1000000';
      const gasLimit = '2000000';
      const contract = {
        function: 'query',
        args: JSON.stringify([{
          type: this.searchType,
          pageNo: currentPage,
        }]),
      };

      neb.api.call(
        this.$store.state.userAddress,
        DAPP_ADDRESS,
        value,
        nonce,
        gasPrice,
        gasLimit,
        contract,
      ).then((res) => {
        this.loading = false;
        this.ready = true;
        let data = res.result;
        if (data) {
          data = JSON.parse(data);
        }
        this.total = data.total;
        this.currentPage = data.pageNo;
        this.totalPage = Math.ceil(this.total / this.pageSize);
        if (needConcat) {
          this.list = this.list.concat(data.list);
        } else {
          this.list = data.list;
        }
        console.log(data);
      }).catch((err) => {
        this.loading = false;
        this.ready = true;
        this.$Message.error(err.message);
      });
    },
  },
};
</script>
