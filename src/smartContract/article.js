'use strict';

class Article {
  constructor() {
    // 设置管理员地址
    LocalContractStorage.defineProperties(this, {
      adminAddress: null,
      id: null,
      total: null,
      // 存储所有有效文章
      articleIn: null,
      // 存储所有被删除的文章
      articleOut: null,
      discussId: null, //每条评论的id
    });
    // 存储文章id信息
    LocalContractStorage.defineMapProperty(this, 'article');

    // 所有文章具体内容
    LocalContractStorage.defineMapProperty(this, 'articleInfo');
    // 单个用户发表的所有文章
    LocalContractStorage.defineMapProperty(this, 'userArticle');
    // 存储单个用户有效的文章
    LocalContractStorage.defineMapProperty(this, 'userArticleIn');
    // LocalContractStorage.defineMapProperty(this, 'userArticleInSize');
    // 存储单个用户被删除的文章
    LocalContractStorage.defineMapProperty(this, 'userArticleOut');
    // LocalContractStorage.defineMapProperty(this, 'userArticleOutSize');

    // 点赞的
    LocalContractStorage.defineMapProperty(this, 'userArticleTinkGood');
    // 踩的
    LocalContractStorage.defineMapProperty(this, 'userArticleTinkBad');

    // 收藏的
    LocalContractStorage.defineMapProperty(this, 'userCollect');

    // 购买的
    LocalContractStorage.defineMapProperty(this, 'userPurchased');

    // 收支记录
    LocalContractStorage.defineMapProperty(this, 'incomeAndExp');
    
    // 评论列表
    LocalContractStorage.defineMapProperty(this, 'discussList');
    // 所有评论的合集
    LocalContractStorage.defineMapProperty(this, 'discussInfo');
    // 当前文章被删除的评论
    LocalContractStorage.defineMapProperty(this, 'discussListOut');
    // 收到的捐赠记录
    LocalContractStorage.defineMapProperty(this, 'donateRecord');
    // 用户收到的捐赠总数单位wei
    LocalContractStorage.defineMapProperty(this, 'donateTotal');

  }
  // 初始化
  init() {
    this.adminAddress = ['n1aV8CjuLpYc3QenXMDnHER1UKa9BY37g6Q'];
    this.id = 0;
    this.discussId = 0;
    this.total = 0;
    this.articleIn = [];
    this.articleOut = [];
  }
  // 添加文章
  addArticle(params) {
    if(!params) {
      throw new Error("参数不能为空");
    }
    const transaction = Blockchain.transaction;
    const from = transaction.from;
    this.id += 1;
    this.total += 1;
    let summary = {
      title: params.title,
      desc: params.desc,
      type: params.type,
      nas: params.nas,
      author: from,
      id: this.id,
      time: Date.now(),
    };
    this.article.set(this.id, summary);
    this.articleInfo.set(this.id, {
      title: params.title,
      desc: params.desc,
      article: params.value,
      author: from,
    });
    let userArticleList = this.userArticle.get(from) || [];
    let articleInList = this.articleIn;
    let userArticleInList = this.userArticleIn.get(from) || [];
    // let userArticleInSize = this.userArticleInSize.get(from) || 0;

    userArticleList.unshift(this.id);
    this.userArticle.set(from, userArticleList);

    articleInList.unshift(this.id);
    // 必须直接赋值操作，否则会无效
    this.articleIn = articleInList;

    userArticleInList.unshift(this.id);
    this.userArticleIn.set(from, userArticleInList);

    // userArticleInSize += 1;
    // this.userArticleInSize.set(from, userArticleInSize);
  }
  // 点赞list
  good(id) {
    // 不能重复点赞
    const from = Blockchain.transaction.from;
    let list = this.userArticleTinkGood.get(from) || [];
    if(list.includes(id)) {
      throw new Error('已经点过赞了');
    }
    list.unshift(id);
    this.userArticleTinkGood.set(from, list);
    let summary = this.article.get(id);
    let goodNum = summary.good || 0;
    goodNum += 1;
    summary.good = goodNum;
    this.article.set(id, summary);
  }
  // 踩list
  bad(id) {
    // 不能重复的踩
    const from = Blockchain.transaction.from;
    let list = this.userArticleTinkBad.get(from) || [];
    if(list.includes(id)) {
      throw new Error('已经踩过了');
    }
    list.unshift(id);
    this.userArticleTinkBad.set(from, list);
    let summary = this.article.get(id);
    let badNum = summary.bad || 0;
    badNum += 1;
    summary.bad = badNum;
    this.article.set(id, summary);
  }
  // 收藏list
  collect(id) {
    const from = Blockchain.transaction.from;
    let list = this.userCollect.get(from) || [];
    if(list.includes(id)) {
      throw new Error('已收藏过了');
    }
    list.unshift(id);
    this.userCollect.set(from, list);
    let summary = this.article.get(id);
    let collectNum = summary.collect || 0;
    collectNum += 1;
    summary.collect = collectNum;
    this.article.set(id, summary);
  }
  // 购买清单
  buy(id) {
    const from = Blockchain.transaction.from;
    let value = Blockchain.transaction.value;
    // value = new BigNumber(value);
    let list = this.userPurchased.get(from) || [];
    if(list.includes(id)) {
      throw new Error('已购买过了');
    }
    // 如果不是免费的，需要控制金额
    const commodityDetails = this.article.get(id);
    if(commodityDetails.type === 'free') {
      throw new Error('此内容是免费的，无需购买');
    }
    // 交易
    if(commodityDetails.type === 'total' && value == 0) {
      throw new Error('亲！多少给点吧！');
    }
    if(commodityDetails.type === 'unit' && value != (commodityDetails.nas) * 1e18) {
      throw new Error('亲！请按照单价支付！');
    }

    // 转账支付
    const result = Blockchain.transfer(commodityDetails.author, value);
    if(result) {
      let userIncomeAndExpList = this.incomeAndExp.get(from) || [];
      let authorIncomeAndExpList = this.incomeAndExp.get(commodityDetails.author) || [];
      // 用户支出
      userIncomeAndExpList.unshift({
        id,
        wei: value,
        inout: 'out',
        inoutTime: Date.now(),
      });
      this.incomeAndExp.set(from, userIncomeAndExpList);
      // 作者收入
      authorIncomeAndExpList.unshift({
        id,
        wei: value,
        inout: 'in',
        inoutTime: Date.now(),
      });
      this.incomeAndExp.set(commodityDetails.author, authorIncomeAndExpList);
  
      let summary = this.article.get(id);
      // 记录此文章的收入
      let weiTotal = new BigNumber(summary.weiTotal || 0);
      weiTotal = weiTotal.plus(value);
      summary.weiTotal = weiTotal;
      if (summary.type === 'total' && summary.weiTotal >= summary.nas*1e18) {
        summary.enough = true;
      }
      // 保存购买清单
      list.unshift(id);
      this.userPurchased.set(from, list);
      // 记录被多少人买过
      let purchasedNum = summary.purchased || 0;
      purchasedNum += 1;
      summary.purchased = purchasedNum;
      this.article.set(id, summary);
    }
    return result;
  }
  // 删除，只有管理员才有权限删除
  delete(id, reason) {
    const from = Blockchain.transaction.from;
    if(!this.adminAddress.includes(from)) {
      throw new Error('对不起！你没有权限进行此操作！');
    }
    this.total -= 1;
    let summary = this.article.get(id);
    let articleInList = this.articleIn;
    let articleOutList = this.articleOut;
    let deleteIndex = articleInList.indexOf(id);
    if(deleteIndex > -1) {
      articleInList.splice(deleteIndex, 1);
      this.articleIn = articleInList;
      articleOutList.unshift(id);
      this.articleOut = articleOutList;

      // 更新用户的有效和无效的文章条数及内容
      // let userArticleInSize = this.userArticleInSize.get(summary.author);
      let userArticleIn = this.userArticleIn.get(summary.author) || [];
      // 一定会在这里
      let indexIn = userArticleIn.indexOf(id);
      userArticleIn.splice(indexIn, 1);
      this.userArticleIn.set(summary.author, userArticleIn);
      
      // userArticleInSize -= 1;
      // this.userArticleInSize.set(summary.author, userArticleInSize);
      
      let userArticleOut = this.userArticleOut.get(summary.author) || [];
      userArticleOut.unshift(id);
      this.userArticleOut.set(summary.author, userArticleOut);

      // let userArticleOutSize = this.userArticleOutSize.get(summary.author) || 0;
      // userArticleOutSize += 1;
      // this.userArticleOutSize.set(summary.author, userArticleOutSize);
    }
    // 只做标记删除
    summary.tag = 'delete';
    summary.reason = reason || '您的文章不符合要求（默认理由）';
    summary.deleteTime = Date.now();
    this.article.set(id, summary);
  }
  // 捐赠
  donate(address) {
    const from = Blockchain.transaction.from;
    let value = Blockchain.transaction.value;
    value = new BigNumber(value);
    const donateRecord = this.donateRecord.get(address) || [];
    let donateTotal = new BigNumber(this.donateTotal.get(address) || 0);
    if(value) {
      const result = Blockchain.transfer(address, value);
      if(result) {
        donateTotal = donateTotal.plus(value);
        donateRecord.push({
          from,
          value,
          time: Date.now(),
        });
        this.donateTotal.set(address, donateTotal);
        this.donateRecord.set(address, donateRecord);
      }
    }
  }
  // 查询捐赠记录
  queryDonate(pageNo = 1, size = 20) {
    const from = Blockchain.transaction.from;
    const donateRecord = this.donateRecord.get(from) || [];
    const donateTotal = this.donateTotal.get(from) || 0;
    const length = donateRecord.length;
    let num = 0;
    let list = [];

    for(let i = (size * (pageNo - 1)); i < length; i++) {
      // 是否在已购清单，是否是管理员，是否是作者
      const item = donateRecord[i];
      num += 1;
      list.push(item);
      if(size == num) {
        break;
      }
    }
    return {
      list,
      total: length,
      pageNo,
      pageSize: size,
      donateTotal,
    }
  }
  // 发现页面的查询
  query(option = {}) {
    let config = Object.assign({type: '', pageNo: 1, pageSize: 20}, option);

    const from = Blockchain.transaction.from;
    const boughtList = this.userPurchased.get(from) || [];
    const goodList = this.userArticleTinkGood.get(from) || [];
    const badList = this.userArticleTinkBad.get(from) || [];
    const collectList = this.userCollect.get(from) || [];
    const articleIn = this.articleIn;
    const resultList = this._queryTotal(option, articleIn);
    const length = resultList.length;
    let num = 0;
    let list = [];

    for(let i = (config.pageSize * (config.pageNo - 1)); i < length; i++) {
      // 是否在已购清单，是否是管理员，是否是作者
      const id = resultList[i];
      const item = this.article.get(id);
      item.currentUserInfo = {
        from,
        bought: boughtList.includes(id),
        good: goodList.includes(id),
        bad: badList.includes(id),
        collect: collectList.includes(id),
        isAdmin: this.adminAddress.includes(from),
        isAuthor: from === item.author,
      }
      if(item.tag !== 'delete') {
        num += 1;
        list.push(item);
        if(config.pageSize == num) {
          break;
        }
      }
    }
    return {
      list,
      total: length,
      pageNo: config.pageNo,
      pageSize: config.pageSize,
    }
  }
  // 我的文章
  queryMyArticle(option = {}) {
    let config = Object.assign({type: '', pageNo: 1, pageSize: 20}, option);
    const from = Blockchain.transaction.from;
    // 只找有效的记录
    const myList = this.userArticleIn.get(from) || [];
    return this._queryArticle(config, myList);
  }
  // 我的订单
  queryBuy(option = {}) {
    let config = Object.assign({type: '', pageNo: 1, pageSize: 20}, option);
    const from = Blockchain.transaction.from;
    const userPurchasedList = this._effective(this.userPurchased.get(from) || []);
    return this._queryArticle(config, userPurchasedList);
  }
  // 我的收藏
  queryCollect(option = {}) {
    let config = Object.assign({type: '', pageNo: 1, pageSize: 20}, option);
    const from = Blockchain.transaction.from;
    // 只获未被删除的收藏
    const userCollectList = this._effective(this.userCollect.get(from) || []);
    return this._queryArticle(config, userCollectList);
  }
  // 我的账单
  queryBill(option = {}) {
    let config = Object.assign({type: '', pageNo: 1, pageSize: 20}, option);
    const from = Blockchain.transaction.from;
    const myList = this.incomeAndExp.get(from) || [];
    const boughtList = this.userPurchased.get(from) || [];
    const goodList = this.userArticleTinkGood.get(from) || [];
    const badList = this.userArticleTinkBad.get(from) || [];
    const collectList = this.userCollect.get(from) || [];
    const resultList = this._queryBillTotal(option, myList);
    const length = resultList.length;
    let num = 0;
    let list = [];
    
    for(let i = (config.pageSize * (config.pageNo - 1)); i < length; i++) {
      const id = resultList[i].id;
      const inout = resultList[i].inout; //收支类型
      const inoutTime = resultList[i].inoutTime; //收支时间
      const wei = resultList[i].wei; //收支金额
      const item = this.article.get(id);
      item.currentUserInfo = {
        from,
        inout,
        inoutTime,
        wei,
        bought: boughtList.includes(id),
        good: goodList.includes(id),
        bad: badList.includes(id),
        collect: collectList.includes(id),
        isAdmin: this.adminAddress.includes(from),
        isAuthor: from === item.author,
      }
      num += 1;
      list.push(item);
      if(config.pageSize == num) {
        break;
      }
    }

    return {
      list,
      total: length,
      pageNo: config.pageNo,
      pageSize: config.pageSize,
    }
  }
  // 查看文章详情，需权限判断
  queryArticleInfo(id) {
    const from = Blockchain.transaction.from;
    const summary = this._getArticleInfo(id);
    const article = this.articleInfo.get(id).article;
    summary.article = article;
    // 作者自己和管理员不需要权限，可以查看，其他人必须判断是否购买
    // 如果是免费的，直接查询结果
    if(summary.type === 'free') {
      return summary;
    }
    // 查询用户购买的清单
    const list = this.userPurchased.get(from) || [];
    if(list.includes(id) ||
      from === summary.author ||
      this.adminAddress.includes(from) ||
      (summary.type === 'total' && summary.weiTotal >= summary.nas*1e18)) {
      return summary;
    } else {
      throw new Error('请购买本条内容');
    }
  }
  _getArticleInfo(id) {
    const from = Blockchain.transaction.from;
    const boughtList = this.userPurchased.get(from) || [];
    const goodList = this.userArticleTinkGood.get(from) || [];
    const badList = this.userArticleTinkBad.get(from) || [];
    const collectList = this.userCollect.get(from) || [];
    const summary = this.article.get(id);
    const articleInfo = this.articleInfo.get(id);
    summary.currentUserInfo = {
      from,
      bought: boughtList.includes(id),
      good: goodList.includes(id),
      bad: badList.includes(id),
      collect: collectList.includes(id),
      isAdmin: this.adminAddress.includes(from),
      isAuthor: from === summary.author,
    }
    summary.article = articleInfo.article;
    return summary;
  }
  _effective(list) {
    const articleOut = this.articleOut;
    return list.filter((id) => {
      return !articleOut.includes(id);
    })
  }
  // 根据传入的list查找结果
  _queryArticle(option, myList) {
    const from = Blockchain.transaction.from;
    const boughtList = this.userPurchased.get(from) || [];
    const goodList = this.userArticleTinkGood.get(from) || [];
    const badList = this.userArticleTinkBad.get(from) || [];
    const collectList = this.userCollect.get(from) || [];
    const resultList = this._queryTotal(option, myList);
    const length = resultList.length;
    let num = 0;
    let list = [];
    
    for(let i = (option.pageSize * (option.pageNo - 1)); i < length; i++) {
      const id = resultList[i];
      const item = this.article.get(id);
      item.currentUserInfo = {
        from,
        bought: boughtList.includes(id),
        good: goodList.includes(id),
        bad: badList.includes(id),
        collect: collectList.includes(id),
        isAdmin: this.adminAddress.includes(from),
        isAuthor: from === item.author,
      }
      num += 1;
      list.push(item);
      if(option.pageSize == num) {
        break;
      }
    }

    return {
      list,
      total: length,
      pageNo: option.pageNo,
      pageSize: option.pageSize,
    }
  }
  // 查询符合条件的元素个数
  _queryTotal(option, list) {
    if(!option.like) {
      return list.filter(id => {
        const item = this.article.get(id);
        return (option.type === '' || item.type === option.type);
      });
    } else {
      const reg = new RegExp(option.like, 'gi');
      return list.filter(id => {
        const item = this.article.get(id);
        return (option.type === '' || item.type === option.type) && reg.test(item.title);
      });
    }
  }
  // 账单的数据结构不同
  _queryBillTotal(option, list) {
    if(!option.like) {
      return list.filter(data => {
        const id = data.id;
        const item = this.article.get(id);
        return (option.type === '' || item.type === option.type);
      });
    } else {
      const reg = new RegExp(option.like, 'gi');
      return list.filter(data => {
        const id = data.id;
        const item = this.article.get(id);
        return (option.type === '' || item.type === option.type) && reg.test(item.title);
      });
    }
  }
  // 评论功能
  discuss(articleId, val) {
    const from = Blockchain.transaction.from;
    let discussList = this.discussList.get(articleId) || [];
    if(val) {
      this.discussId += 1;
      discussList.push(this.discussId);
      this.discussInfo.set(this.discussId, {
        id: this.discussId,
        text: val,
        author: from,
        discussTime: Date.now(),
      });
      this.discussList.set(articleId, discussList);
    } else {
      throw new Error("参数不能为空");
    }
  }
  // 查询评论
  queryDiscuss(articleId, pageNo = 1, size = 20) {
    const from = Blockchain.transaction.from;
    const myList = this._filterDiscuss(articleId, this.discussList.get(articleId) || []);
    const length = myList.length;
    let num = 0;
    let list = [];
    for(let i = (size * (pageNo - 1)); i < length; i++) {
      const id = myList[i];
      const item = this.discussInfo.get(id);
      num += 1;
      item.currentUserInfo = {
        isAdmin: this.adminAddress.includes(from),
        isAuthor: from === item.author,
      }
      list.push(item);
      if(size == num) {
        break;
      }
    }
    return {
      list,
      total: length,
      pageNo,
      pageSize: size,
    }
  }
  // 删除评论
  deleteDiscuss(articleId, discussId) {
    const from = Blockchain.transaction.from;
    const discussInfo = this.discussInfo.get(discussId);
    // 只有评论者自己和管理员才能操作删除
    if (discussInfo.author === from || this.adminAddress.includes(from)) {
      let deleteList = this.discussListOut.get(articleId) || [];
      deleteList.push(discussId);
      this.discussListOut.set(articleId, deleteList);
    } else {
      throw new Error('对不起！你没有权限进行此操作！');
    }
  }
  // 过滤掉被删除的评论
  _filterDiscuss(articleId, list) {
    const deleteList = this.discussListOut.get(articleId) || [];
    return list.filter((id) => {
      return !deleteList.includes(id);
    })
  }
}

module.exports = Article;