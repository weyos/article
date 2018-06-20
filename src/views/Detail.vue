<template>
  <div>
    <Card style="margin-bottom: 20px;">
      <ArticleCard style="margin-bottom: 40px;" :item="articleInfo" :refresh="refresh" />
      <div>
        <mavon-editor
          class="mavon_component_main"
          :toolbarsFlag="false"
          :subfield="false"
          :defaultOpen="'preview'"
          v-model="value"
        />
      </div>
      <div v-if="showShangBtn" class="shangs_btn">
        <span @click="shang">赏</span>
      </div>
    </Card>
    <Card>
      <h4>评论列表</h4>
      <div class="article_detial_main">
        <div v-if="list.length">
          <ol>
            <li v-for="(item, index) in list" :key="`${item.author}-${index}`">
              <h5>{{ item.author }} <span>{{ item.discussTime | timeFormate }}</span></h5>
              <p>{{ item.text }}</p>
              <div
                class="clearfix"
                v-if="item.currentUserInfo.isAuthor || item.currentUserInfo.isAdmin"
              ><a @click="deleteDiscuss(item.id)">删除</a></div>
            </li>
          </ol>
        </div>
        <div v-if="!list.length && !loading">好凉，快来说点什么吧！</div>
        <a
          v-if="!loading && currentPage < totalPage"
          @click="loadMore">加载更多</a>
        <Spin v-if="loading">加载中...</Spin>
      </div>
      <div style="margin:20px 0;">
        <Input v-model="discussDetail" type="textarea" :autosize="{minRows: 2,maxRows: 5}" placeholder="Enter something..."></Input>
      </div>
      <Button :loading="loading" @click="addDiscuss" type="primary">发表评论</Button>
    </Card>
    <Modal
      v-model="showModal"
      title="打赏"
      @on-ok="ok"
      @on-cancel="cancel">
      <p style="margin-bottom: 10px;">请输入打赏金额，单位NAS</p>
      <Input v-model="shangVal" placeholder="请输入金额"></Input>
    </Modal>
  </div>
</template>

<script>
import BigNumber from 'bignumber.js';
import nebulas from 'nebulas';
import NebPay from 'nebpay';

import {
  DAPP_ADDRESS,
  HTTP_URL,
  PAY_HOST,
  NEED_DECRYPT_ID,
} from '../env';
import Utils from '../utils';
import ArticleCard from '../components/ArticleCard';

const neb = new nebulas.Neb();
const nebPay = new NebPay();
neb.setRequest(new nebulas.HttpRequest(HTTP_URL));

export default {
  data() {
    return {
      title: '',
      value: '',
      list: [],
      loading: false,
      currentPage: 1,
      total: 0,
      pageSize: 20,
      totalPage: 0,
      discussDetail: '', //评论内容
      txhash: null,
      showShangBtn: true,
      showModal: false,
      shangVal: '0.0001',
      articleInfo: {
        currentUserInfo: {},
      },
    }
  },
  filters: {
    timeFormate(val) {
      if (val) {
        return Utils.formateDate(val);
      }
      return '';
    },
  },
  components: {
    ArticleCard,
  },
  created() {
    document.title = 'Article-文章内容';
  },
  mounted() {
    if (this.$store.state.userAddress) {
      this.queryArticleInfo(this.$store.state.userAddress);
      this.queryDiscuss(this.$store.state.userAddress);
    } else {
      Utils.getWallectAddress((from) => {
        // console.log(from);
        this.$store.dispatch('setUserAddress', from);
        this.queryArticleInfo(from);
        this.queryDiscuss(from);
      });
    }
  },
  methods: {
    queryArticleInfo(from) {
      const ID = Number(this.$route.query.id);
      const value = '0';
      const nonce = '0';
      const gasPrice = '1000000';
      const gasLimit = '2000000';
      const contract = {
        function: 'queryArticleInfo',
        args: JSON.stringify([ID]),
      };

      neb.api.call(
        from,
        DAPP_ADDRESS,
        value,
        nonce,
        gasPrice,
        gasLimit,
        contract,
      ).then((res) => {
        let data = res.result;
        if (data) {
          data = JSON.parse(data);
        }
        this.articleInfo = data;
        if(ID >= NEED_DECRYPT_ID) {
          let value = data.article;
          try {
            value = Utils.decrypt(data.article); 
          } catch (error) {}
          this.value = value;
        } else {
          this.value = data.article;
        }
        // this.title = data.title;
        
        // 是否展示打赏按钮
        // if (data.type === 'free') {
        //   this.showShangBtn = true;
        // }
        // if (data.type === 'total') {
        //   const weiTotal = data.weiTotal || 0;
        //   const nas = data.nas * 1e18;
        //   let differ = nas - weiTotal > 0 ? (nas - weiTotal) / (1e18 * 1) : 0;
        //   differ = new BigNumber(differ).toFormat();
        //   if (differ > 0) {
        //     this.showShangBtn = false;
        //   } else {
        //     this.showShangBtn = true;
        //   }
        // }
        // console.log(data);
      }).catch((err) => {
        this.$Message.error(err.message);
      });
    },
    loadMore() {
      if (this.currentPage < this.totalPage) {
        this.currentPage += 1;
        this.queryDiscuss(this.currentPage);
      }
    },
    refresh() {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      // this.queryArticle(1, false);
    },
    queryDiscuss(currentPage, needConcat = true) {
      this.loading = true;
      const ID = this.$route.query.id;
      var value = "0";
      var nonce = "0";
      var gas_price = "1000000"
      var gas_limit = "2000000"
      var contract = {
        "function": 'queryDiscuss',
        "args": JSON.stringify([ID]),
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
        if(needConcat) {
          this.list = this.list.concat(data.list);
        } else {
          this.list = data.list;
        }
        // console.log(data);
      }).catch((err) => {
        this.loading = false;
        this.$Message.error(err.message);
      });
    },
    // 添加评论
    addDiscuss() {
      const ID = this.$route.query.id;
      if(!this.discussDetail.trim()) {
        return this.$Message.error('内容不能为空！');
      }
      this.loading = true;
      // 调用合约
      var callArgs = JSON.stringify([ID, this.discussDetail]);
      nebPay.call(DAPP_ADDRESS, '0', 'discuss', callArgs, {
        callback: PAY_HOST,
        listener: (res) => {
          this.$Notice.info({
            title: '温馨提示',
            desc: '数据正在提交中，请耐心等待！',
          });
          this.txhash = res.txhash;
          this.funcIntervalQuery();
        },
      });
    },
    funcIntervalQuery() {
      neb.api.getTransactionReceipt({hash: this.txhash})
        .then((resp) => {
          if (resp.status === 1) {
            this.loading = false;
            this.txhash = null;
            this.$Notice.success({
              title: '成功',
              desc: '操作成功！',
            });
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            // this.$Message.success('保存成功');
          } else {
            if(resp.execute_error) {
              this.loading = false;
              return this.$Notice.error({
                title: '失败',
                desc: resp.execute_error,
              });
            }
            this.$Notice.info({
              title: '温馨提示',
              desc: '正在查询交易结果...',
              duration: 10,
            });
            setTimeout(() => {
              this.funcIntervalQuery();
            }, 10000);
          }
        })
        .catch((err) => {
          this.loading = false;
          if(this.txhash) {
            this.$Notice.error({
              title: '失败',
              desc: err.message,
            });
            // this.$Message.error(err.message);
          } else {
            // this.$Message.error('已取消');
            this.$Notice.error({
              title: '失败',
              desc: '已取消',
            });
          }
        });
    },
    // 删除评论
    deleteDiscuss(discussId) {
      this.loading = true;
      const ID = Number(this.$route.query.id);
      // 调用合约
      var callArgs = JSON.stringify([ID, discussId]);
      nebPay.call(DAPP_ADDRESS, '0', 'deleteDiscuss', callArgs, {
        callback: PAY_HOST,
        listener: (res) => {
          this.$Notice.info({
            title: '温馨提示',
            desc: '数据正在提交中，请耐心等待！',
          });
          this.txhash = res.txhash;
          this.funcIntervalQuery();
        },
      });
    },
    // 打赏
    shang() {
      if(!this.loading) {
        this.showModal = true;
      }
    },
    ok() {
      var val = this.shangVal.trim();
      if(!val || isNaN(Number(val))) {
        return this.$Message.error('请填入有效的数字！');
      }
      // 调用合约
      var callArgs = JSON.stringify([this.articleInfo.author]);
      nebPay.call(DAPP_ADDRESS, val, 'donate', callArgs, {
        callback: PAY_HOST,
        listener: (res) => {
          this.$Notice.info({
            title: '温馨提示',
            desc: '数据正在提交中，请耐心等待！',
          });
          this.txhash = res.txhash;
          this.funcIntervalQuery();
        },
      });
    },
    cancel() {
      this.showModal = false;
    },
  },
};
</script>

<style lang="less">
  .mavon_component_title {
    margin-bottom: 20px;
  }
  .mavon_component_main {
    z-index: 600!important;
  }
  .shangs_btn {
    text-align: center;
    padding: 20px;
    span {
      display: inline-block;
      width: 40px;
      height: 40px;
      background-color: rgb(224, 194, 19);
      border-radius: 50%;
      font-size: 18px;
      color: #fff;
      line-height: 40px;
      &:hover {
        cursor: pointer;
      }
    }
  }
  .article_detial_main {
    padding: 20px;
    margin-top: 10px;
    text-align: center;
    border: 1px solid #e9eaec;
    border-radius: 5px;
    ol {
      text-align: left;
      li {
        list-style: none;
        padding-bottom: 10px;
        margin-bottom: 20px;
        border-bottom: 1px solid #e9eaec;
      }
      div {
        a {
          float: right;
          &:hover {
            text-decoration: underline;
          }
        }
      }
      h5 {
        margin-bottom: 10px;
        span {
          float: right;
        }
      }
    }
  }
</style>

