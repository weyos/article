<template>
  <div id="app" class="layout">
    <Layout>
      <Header>
        <Menu mode="horizontal" theme="dark" active-name="/" @on-select="selectMenu">
          <div
            class="layout-logo"
            @click="jumpto('/')"
          >
            <!-- <img src="./assets/logo.png"/> -->
            <Icon type="social-freebsd-devil"></Icon>
            Article
          </div>
          <div class="layout-nav">
            <MenuItem name="/">
              <Icon type="ios-ionic-outline"></Icon>
              发现
            </MenuItem>
            <MenuItem name="/publish">
              <Icon type="edit"></Icon>
              发表
            </MenuItem>
            <Submenu name="3">
              <template slot="title">
                <Icon type="android-person"></Icon>
                我的
              </template>
              <MenuItem name="/myarticle">
                我的文章
              </MenuItem>
              <MenuItem name="/purchasedrecord">
                我的订单
              </MenuItem>
              <MenuItem name="/collect">
                我的收藏
              </MenuItem>
              <MenuItem name="/bill">
                我的账单
              </MenuItem>
              <MenuItem name="/donaterecord">
                收到的打赏
              </MenuItem>
            </Submenu>
            <span style="color:rgba(255,255,255,.7);" name="" v-if="$store.state.userAddress">
              {{ $store.state.userAddress }}
            </span>
          </div>
          <div class="nav-small">
            <Dropdown trigger="click" @on-click="selectMenu">
              <Icon :size="30" type="android-menu"></Icon>
              <DropdownMenu slot="list">
                <DropdownItem divided name="/">发现</DropdownItem>
                <DropdownItem divided name="/publish">发表</DropdownItem>
                <DropdownItem divided name="/myarticle">我的文章</DropdownItem>
                <DropdownItem divided name="/purchasedrecord">我的订单</DropdownItem>
                <DropdownItem divided name="/collect">我的收藏</DropdownItem>
                <DropdownItem divided name="/bill">我的账单</DropdownItem>
                <DropdownItem divided name="/donaterecord">收到的打赏</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </Menu>
      </Header>
      <Content>
        <div class="router-container_" style="min-height: 200px;">
          <Alert v-if="checkResult.type === 'mobile'" type="warning">
            温馨提示
            <template slot="desc">
              <span v-if="checkResult.platform == 'ios'">检测到您正在使用移动端浏览，请检查是否安装<a href="https://itunes.apple.com/hk/app/nas-nano/id1281191905?l=zh&ls=1&mt=8">Nano钱包</a> </span>
              <span v-else>检测到您正在使用移动端浏览，请检查是否安装<a href="https://nano.nebulas.io/index_cn.html">Nano钱包</a> </span>
              <Input v-model="mobileAddress" :disabled="locked" placeholder="输入您的钱包地址">
                <Button
                  @click="getLock"
                  slot="append"
                  :icon="locked ? 'unlocked' : 'locked'"
                ></Button>
              </Input>
            </template>
          </Alert>
          <Alert v-if="checkResult.type === 'pc' && !checkResult.plugins" type="warning">
            温馨提示
            <template slot="desc">检测到您未安装星云钱包，请使用chrome安装<a target="__blank" href="https://github.com/ChengOrangeJu/WebExtensionWallet">星云钱包插件</a>后使用！</template>
          </Alert>
          <router-view/>
        </div>
      </Content>
      <Footer class="layout-footer-center">power by Nebulas | weyos</Footer>
    </Layout>
  </div>
</template>

<script>
import nebulas from 'nebulas';
import Utils from './utils';

const Account = nebulas.Account;

export default {
  data() {
    return {
      checkResult: {},
      locked: false,
      mobileAddress: '',
    };
  },
  mounted() {
    setTimeout(() => {
      this.checkResult = Utils.checkPlugins();
      if (this.checkResult.type === 'mobile') {
        const userAddress = window.localStorage.getItem('userAddress');
        if (userAddress) {
          this.$store.dispatch('setUserAddress', userAddress);
          this.mobileAddress = userAddress;
          this.locked = true;
        }
      }
    }, 1000);
  },
  methods: {
    getLock() {
      if (!this.locked) {
        if (!Account.isValidAddress(this.mobileAddress)) {
          this.$Message.error('该地址不是一个有效的钱包地址');
          return;
        }
        this.locked = true;
        this.$store.dispatch('setUserAddress', this.mobileAddress);
        window.localStorage.setItem('userAddress', this.mobileAddress);
        // this.$Message.success('保存钱包地址成功，请手动刷新');
        this.$Modal.confirm({
          title: '保存钱包地址成功！',
          content: '是否需要刷新当前页面？',
          onOk: () => {
            window.location.reload();
          },
        });
      } else {
        this.locked = false;
      }
    },
    jumpto(path) {
      this.$router.push({
        path,
      });
    },
    selectMenu(val) {
      if (val) {
        this.$router.push({
          path: val,
        });
      }
    },
  },
};
</script>

<style lang="less">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  border-radius: 0;
}
.ivu-layout-content {
  padding: 0 50px 50px;
  margin: 20px 0;
}
.layout{
  // border: 1px solid #d7dde4;
  background: #f5f7f9;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}
.layout-logo{
  float: left;
  position: relative;
  top: 15px;
  left: 0;
  height: 30px;
  margin-right: 10px;
  line-height: 30px;
  color: #fff;
  font-weight: bold;
  font-size: 20px;
  cursor: pointer;
  img {
    float: left;
    display: block;
    width: 30px;
    height: 30px;
    margin-right: 10px;
  }
}
.layout-nav{
  float: right;
  margin: 0 auto;
  margin-right: 20px;
  a {
    color: inherit;
  }
}
.nav-small {
  display: none;
  float: right;
}
.layout-footer-center{
  text-align: center;
}
// .router-container_ {
//   max-width: 1000px;
//   margin: 0 auto;
// }
.ivu-layout {
  min-height: 100vh;
  .layout-footer-center {
    width: 100%;
    padding: 15px 0;
    background-color: rgba(73, 80, 96, 0.9);
    color: #fff;
    font-size: inherit;
  }
}
@media (max-width: 900px) {
  .ivu-layout-header {
    padding: 0 20px!important;
  }
  .layout-nav {
    display: none;
  }
  .nav-small {
    display: block;
    color:#f5f7f9;
    .ivu-icon {
      vertical-align: middle;
    }
  }
  .ivu-layout-content {
    padding: 0 20px 50px;
  }
  .card-bt_ {
    span {
      display: block!important;
      box-sizing: border-box;
      margin: 0 10px 15px!important;
    }
  }
}
</style>

