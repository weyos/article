<template>
  <div>
    <Card>
      <p slot="title">
        <a @click="readit(item)">{{ item.title }}</a>
        <span
          style="float:right;"
          v-if="item.currentUserInfo.inoutTime"
        >{{ item.currentUserInfo.inoutTime | timeFormate }}</span>
        <span
          v-else
          style="float:right;"
        >{{item.time | timeFormate}}</span>
        <span
          style="float:right;"
          v-if="item.currentUserInfo.inout"
          :class="{'green': item.currentUserInfo.inout === 'in','red': item.currentUserInfo.inout === 'out'}"
        >{{item.currentUserInfo.inout | inoutCn}}: {{item.currentUserInfo.wei | weiToNas}}NAS&emsp;</span>
      </p>
      <p>{{ item.desc }}</p>
      <div class="card-bt_">
        <span>{{getPrice(item)}}</span>
        <a @click="good(item)" :class="{'card_has': item.currentUserInfo.good}"><Icon type="happy"></Icon>&ensp;{{item.good || 0}}</a>
        <a @click="bad(item)" :class="{'card_has': item.currentUserInfo.bad}"><Icon type="sad"></Icon>&ensp;{{ item.bad || 0 }}</a>
        <a @click="collect(item)" :class="{'card_has': item.currentUserInfo.collect}"><Icon type="heart"></Icon>&ensp;收藏</a>
        <a v-if="!item.currentUserInfo.isAuthor && !item.currentUserInfo.bought && item.type !== 'free'" @click="buy(item)"><Icon type="android-cart"></Icon>&ensp;购买</a>
        <a @click="deleteItem(item)" v-if="item.currentUserInfo.isAdmin"><Icon type="trash-a"></Icon>&ensp;管理员删除</a>
      </div>
    </Card>
  </div>
</template>

<style lang="less">
  .card_keyword {
    margin-top: 20px;
  }
  .ivu-card-body {
    p {
      word-break: break-all;
    }
  }
  .card-bt_ {
    text-align: right;
    margin-top: 20px;
    a,
    span {
      color: inherit;
      display: inline-block;
      margin: 0 10px;
    }
    a {
      user-select: none;
    }
    .card_has {
      color: #2d8cf0;
    }
  }
  .green {
    color: green;
  }
  .red {
    color: red;
  }
</style>

<script>
  import {
    DAPP_ADDRESS,
    HTTP_URL,
    PAY_HOST,
  } from '../env';

  import BigNumber from 'bignumber.js';
  import Utils from '../utils';

  var nebulas = require("nebulas"),
      NebPay = require("nebpay"),
      neb = new nebulas.Neb(),
      nebPay = new NebPay();
  neb.setRequest(new nebulas.HttpRequest(HTTP_URL));

  export default {
    props: {
      item: {
        type: Object,
        default: function() {
          return {};
        },
      },
      refresh: Function,
    },
    filters: {
      inoutCn(val) {
        if(val === 'in') {
          return '收入';
        }
        if(val === 'out') {
          return '支出';
        }
      },
      weiToNas(val) {
        return new BigNumber(val/(1e18)).toFormat();
      },
      timeFormate(val) {
        if(val) {
          return Utils.formateDate(val);
        }
      }
    },
    methods: {
      getPrice(item) {
        if(item.type === 'free') {
          return '免费';
        }
        if(item.type === 'unit') {
          return `单价：${item.nas}NAS`;
        }
        if(item.type === 'total') {
          let weiTotal = item.weiTotal || 0;
          let nas = item.nas * 1e18;
          let differ = nas - weiTotal > 0 ? (nas - weiTotal)/(1e18)*1 : 0;
          differ = new BigNumber(differ).toFormat();
          if(differ == 0) {
            return '已免费开放';
          } else {
            return `还差${differ}NAS全员开放`;
          }
        }
      },
      // 查看
      readit(item) {
        if(item.deleteTime) {
          return this.$Modal.warning({
            title: '文章已被删除',
            content: item.reason,
          });
        }

        if(item.currentUserInfo.isAuthor || item.currentUserInfo.isAdmin || item.currentUserInfo.bought || item.type === 'free') {
          // console.log('read');
          this.$router.push({
            name: 'detail',
            query: {
              id: item.id,
            }
          });
        } else {
          if(item.type === 'total') {
            let weiTotal = item.weiTotal || 0;
            let nas = item.nas * 1e18;
            let differ = nas - weiTotal > 0 ? (nas - weiTotal)/(1e18)*1 : 0;
            differ = new BigNumber(differ).toFormat();
            if(differ == 0) {
              return this.$router.push({
                name: 'detail',
                query: {
                  id: item.id,
                }
              });;
            }
          }
          this.$Modal.warning({
            title: '温馨提示',
            content: '您还没有购买此内容，购买后可查看！'
          });
          // this.$Message.error('您还没有购买此内容，购买后可查看！');
        }
      },
      // 赞
      good(item) {
        if(item.currentUserInfo.good) {
          return this.$Modal.warning({
            title: '温馨提示',
            content: '您已经点过赞了！'
          });
          // return this.$Message.warning('您已经点过赞了！');
        }
        // 调用合约
        this.$Notice.info({
          title: '温馨提示',
          desc: '正在操作钱包！',
        });
        var callArgs = JSON.stringify([item.id]);
        nebPay.call(DAPP_ADDRESS, '0', 'good', callArgs, {
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
      // 踩
      bad(item) {
        if(item.currentUserInfo.bad) {
          return this.$Modal.warning({
            title: '温馨提示',
            content: '您已经踩过了！'
          });
          // return this.$Message.warning('您已经踩过了！');
        }
        // 调用合约
        this.$Notice.info({
          title: '温馨提示',
          desc: '正在操作钱包！',
        });
        var callArgs = JSON.stringify([item.id]);
        nebPay.call(DAPP_ADDRESS, '0', 'bad', callArgs, {
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
      // 收藏
      collect(item) {
        if(item.currentUserInfo.collect) {
          return this.$Modal.warning({
            title: '温馨提示',
            content: '您已经收藏过了！'
          });
          // return this.$Message.warning('您已经收藏过了！');
        }
        // 调用合约
        this.$Notice.info({
          title: '温馨提示',
          desc: '正在操作钱包！',
        });
        var callArgs = JSON.stringify([item.id]);
        nebPay.call(DAPP_ADDRESS, '0', 'collect', callArgs, {
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
      // 购买
      buy(item) {
        if(item.currentUserInfo.bought) {
          return this.$Modal.warning({
            title: '温馨提示',
            content: '您已经购买过了！'
          });
          // return this.$Message.warning('您已经购买过了！');
        }
        let unit = '0.0000000001';
        if(item.type === 'unit') {
          unit = item.nas;
        }
        // 调用合约
        this.$Notice.info({
          title: '温馨提示',
          desc: '正在操作钱包！',
        });
        var callArgs = JSON.stringify([item.id]);
        nebPay.call(DAPP_ADDRESS, unit, 'buy', callArgs, {
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
      // 管理员删除操作
      deleteItem(item) {
        // 调用合约
        this.$Notice.info({
          title: '温馨提示',
          desc: '正在操作钱包！',
        });
        var callArgs = JSON.stringify([item.id]);
        nebPay.call(DAPP_ADDRESS, '0', 'delete', callArgs, {
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
                desc: '保存成功！',
              });
              this.refresh();
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
      }
    }
  }
</script>
