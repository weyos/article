<template>
  <div class="publish-container_">
    <Card>
      <Form label-position="top" ref="formValidate" :model="formValidate" :rules="ruleValidate">
        <FormItem label="卡片标题" prop="title">
          <Input :maxlength="21" :disabled="loading" v-model="formValidate.title" placeholder="请输入文章标题"></Input>
        </FormItem>
        <FormItem label="分享类型" prop="type">
          <RadioGroup :disabled="loading" v-model="formValidate.type">
            <Radio label="free">免费</Radio>
            <Radio label="unit">单价</Radio>
            <Radio label="total">众筹</Radio>
          </RadioGroup>
          <p class="explain_">{{getExplain}}</p>
        </FormItem>
        <FormItem required v-if="formValidate.type !== 'free'" label="价格" prop="nas">
          <Input :disabled="loading" v-model="formValidate.nas" placeholder="请输入文章标题">
            <span slot="append">NAS</span>
          </Input>
        </FormItem>
        <FormItem label="卡片描述" prop="desc">
          <Input :disabled="loading" v-model="formValidate.desc" type="textarea" :autosize="{minRows: 2,maxRows: 5}" placeholder="简要描述文章内容"></Input>
        </FormItem>
        <FormItem label="正文" required>
          <mavon-editor :subfield="false" :editable="!loading" :toolbars="toolbars" v-model="formValidate.value"/>
        </FormItem>
        <FormItem>
          <Button type="primary" :loading="loading" @click="handleSubmit('formValidate')">提交</Button>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>

<style lang="less" scoped>
  // .publish-container_ {
  //   background-color: #fff;
  // }
  .explain_ {
    color: #f00;
  }
</style>


<script>
import nebulas from 'nebulas';
import NebPay from 'nebpay';
import Utils from '../utils';

import {
  DAPP_ADDRESS,
  HTTP_URL,
  PAY_HOST,
} from '../env';

const neb = new nebulas.Neb();
const nebPay = new NebPay();
neb.setRequest(new nebulas.HttpRequest(HTTP_URL));


export default {
  data() {
    return {
      toolbars: {
        bold: true, // 粗体
        italic: true, // 斜体
        header: true, // 标题
        underline: true, // 下划线
        strikethrough: true, // 中划线
        mark: true, // 标记
        superscript: true, // 上角标
        subscript: true, // 下角标
        quote: true, // 引用
        ol: true, // 有序列表
        ul: true, // 无序列表
        link: true, // 链接
        code: true, // code
        table: true, // 表格
        fullscreen: true, // 全屏编辑
        readmodel: true, // 沉浸式阅读
        htmlcode: true, // 展示html源码
        help: true, // 帮助
        undo: true, // 上一步
        redo: true, // 下一步
        trash: true, // 清空
        alignleft: true, // 左对齐
        aligncenter: true, // 居中
        alignright: true, // 右对齐
        subfield: true, // 单双栏模式
        preview: true,
      },
      txhash: null,
      loading: false,
      formValidate: {
        title: '',
        type: 'free',
        desc: '',
        nas: '',
        value: '',
      },
      ruleValidate: {
        title: [
          { required: true, message: '标题不能为空', trigger: 'blur' },
          { type: 'string', max: 20, message: '标题请控制在20字以内', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '分享类型不能为空', trigger: 'change' },
        ],
        desc: [
          { required: true, message: '描述不能为空', trigger: 'blur' },
          { type: 'string', min: 10, message: '描述内容字数不能低于10个字', trigger: 'blur' },
          { type: 'string', max: 200, message: '描述内容字数不能超过200个字', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    getExplain() {
      const type = this.formValidate.type;
      if(type === 'free') {
        return '此类型下，将会免费分享给所有人';
      }
      if(type === 'unit') {
        return '此类型下，所有用户都需要花费您定义的单价购买此内容';
      }
      if(type === 'total') {
        return '此类型下，您的收益到达您设定的预期后，文章内容将免费开放给其他用户';
      }
    }
  },
  created() {
    document.title = 'Article-发表';
  },
  methods: {
    handleSubmit (name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          let nas = this.formValidate.nas.trim();
          let value = this.formValidate.value.trim();
          let type = this.formValidate.type;
          if(type !== 'free' && (!nas || isNaN(Number(nas)))) {
            return this.$Message.error('请输入正确的价格');
          }
          if(type !== 'free' && nas < 1e-18) {
            return this.$Message.error('价格太少低了吧。。。');
          }
          if(!value) {
            return this.$Message.error('正文不能为空');
          }
          // 校验通过
          // this.$Message.success('Success!');
          // console.log(this.formValidate);
          this.$Notice.info({
            top: 80,
            title: '温馨提示',
            desc: '正在操作钱包',
          });
          this.loading = true;
          // 调用合约
          const subData = JSON.parse(JSON.stringify(this.formValidate))
          subData.value = Utils.encrypt(subData.value);
          var callArgs = JSON.stringify([subData]);
          nebPay.call(DAPP_ADDRESS, '0', 'addArticle', callArgs, {
            callback: PAY_HOST,
            listener: (res) => {
              this.$Notice.info({
                top: 80,
                title: '温馨提示',
                desc: '数据正在提交中，请耐心等待！',
              });
              this.txhash = res.txhash;
              this.funcIntervalQuery();
            },
          });
        }
      })
    },
    funcIntervalQuery() {
      neb.api.getTransactionReceipt({hash: this.txhash})
        .then((resp) => {
          if (resp.status === 1) {
            this.loading = false;
            this.txhash = null;
            this.$Notice.success({
              top: 80,
              title: '成功',
              desc: '保存成功！',
            });
            this.$router.push({
              path: '/',
            })
            // this.$Message.success('保存成功');
          } else {
            if(resp.execute_error) {
              this.loading = false;
              return this.$Notice.error({
                top: 80,
                title: '失败',
                desc: resp.execute_error,
              });
            }
            this.$Notice.info({
              top: 80,
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
              top: 80,
              title: '失败',
              desc: err.message,
            });
            // this.$Message.error(err.message);
          } else {
            // this.$Message.error('已取消');
            this.$Notice.error({
              top: 80,
              title: '失败',
              desc: '已取消',
            });
          }
        });
    }
  }
}
</script>