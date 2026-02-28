// pages/index/index.js
Page({
  data: {
    isTibetan: false,
    // 经文项目列表
    chantingItems: [
      { id: '1', name: 'སྐྱབས་འགྲོ', quickCounts: [100, 500, 1000] },
      { id: '2', name: 'དམིགས་བརྩེ', quickCounts: [100, 500, 1000] },
      { id: '3', name: 'སྒྲོལ་མ', quickCounts: [100, 500, 1000] }
    ],

    // 当日记录
    dailyRecords: {},
    todayRecords: [],

    // 自定义输入值 - 使用对象存储每个经文的输入值
    customInputValue: {},

    // 统计相关
    currentTab: 'daily',
    dailyStatistics: { totalCount: 0, records: [], date: '' },
    monthlyStatistics: { totalCount: 0, records: [], date: '' },
    yearlyStatistics: { totalCount: 0, records: [], date: '' },

    // 模态框相关
    showModal: false,
    showEditModal: false,
    modalTitle: '新增经文',
    chantingName: '',
    quickCount1: '100',
    quickCount2: '500',
    quickCount3: '1000',
    editChantingName: '',
    editCount: '',

    // 当前编辑的ID
    currentEditId: null,
    currentEditRecord: null,

    // 提示信息
    showToast: false,
    toastMessage: '',
    toastType: 'success'
  },

  onLoad() {
    console.log('[onLoad] 页面加载');
    this.loadLanguageSetting();
    // 从本地存储加载数据
    this.loadData();
    // 初始化界面
    this.updateDailySummary();
    this.updateStatistics();
  },

  onShow() {
    console.log('[onShow] 页面显示');
    this.updateDailySummary();
    this.updateStatistics();
  },

  // 切换语言
  toggleLanguage() {
    const newLanguage = !this.data.isTibetan;
    this.setData({ isTibetan: newLanguage });
    wx.setStorageSync('isTibetan', newLanguage);
  },

  // 加载语言设置
  loadLanguageSetting() {
    try {
      const isTibetan = wx.getStorageSync('isTibetan');
      if (typeof isTibetan === 'boolean') {
        this.setData({ isTibetan });
      }
    } catch (error) {
      console.error('加载语言设置失败:', error);
    }
  },

  // 加载本地存储数据
  loadData() {
    try {
      // 加载经文项目
      const savedItems = wx.getStorageSync('chantingItems');
      if (savedItems) {
        this.setData({ chantingItems: savedItems });
      }

      // 加载每日记录
      const savedRecords = wx.getStorageSync('dailyRecords');
      if (savedRecords) {
        this.setData({ dailyRecords: savedRecords });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  },

  // 保存数据到本地存储
  saveData() {
    try {
      wx.setStorageSync('chantingItems', this.data.chantingItems);
      wx.setStorageSync('dailyRecords', this.data.dailyRecords);
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  },

  // 获取今日日期字符串
  getTodayString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  },

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 显示提示信息
  showToast(message, type = 'success') {
    this.setData({
      showToast: true,
      toastMessage: message,
      toastType: type
    });

    setTimeout(() => {
      this.setData({ showToast: false });
    }, 3000);
  },

  // 添加计数
  onAddCount(e) {
    const { id, count } = e.currentTarget.dataset;
    const parsedCount = parseInt(count);

    if (!isNaN(parsedCount) && parsedCount > 0) {
      this.addCount(id, parsedCount);
    }
  },

  // 自定义输入处理
  onCustomInput(e) {
    const { id } = e.currentTarget.dataset;
    const value = e.detail.value;
    console.log('[onCustomInput] id:', id, 'value:', value);

    const customInputValue = this.data.customInputValue || {};
    customInputValue[id] = value;

    this.setData({
      customInputValue: customInputValue
    }, () => {
      console.log('[onCustomInput] setData完成，customInputValue:', this.data.customInputValue);
    });
  },

  // 添加自定义计数
  onAddCustomCount(e) {
    const { id } = e.currentTarget.dataset;
    console.log('[onAddCustomCount] id:', id);
    console.log('[onAddCustomCount] customInputValue:', this.data.customInputValue);

    const customInputValue = this.data.customInputValue || {};
    const value = customInputValue[id] || '';
    const count = parseInt(value);

    console.log('[onAddCustomCount] value:', value, 'count:', count);

    if (!isNaN(count) && count > 0) {
      this.addCount(id, count);
      // 清空输入框
      customInputValue[id] = '';
      this.setData({
        customInputValue: customInputValue
      });
      console.log('[onAddCustomCount] 输入框已清空');
    } else {
      this.showToast('请输入有效的数字', 'error');
      console.log('[onAddCustomCount] 数字无效');
    }
  },

  // 实际添加计数逻辑
  addCount(id, count) {
    console.log('[addCount] 开始添加，id:', id, 'count:', count);
    const today = this.getTodayString();
    const item = this.data.chantingItems.find(item => item.id === id);

    console.log('[addCount] 找到的经文项目:', item);

    if (!item) {
      console.log('[addCount] 未找到经文项目，退出');
      return;
    }

    // 初始化今日记录
    const dailyRecords = { ...this.data.dailyRecords };
    if (!dailyRecords[today]) {
      dailyRecords[today] = [];
      console.log('[addCount] 初始化今日记录');
    }

    // 生成唯一记录ID
    const recordId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 添加新记录（每次都是独立记录，不合并）
    dailyRecords[today].push({
      recordId: recordId,
      id: id,
      name: item.name,
      count: count,
      timestamp: new Date().toISOString()
    });
    console.log('[addCount] 添加新记录');

    console.log('[addCount] 准备保存，dailyRecords:', dailyRecords);

    // 更新数据
    this.setData({ dailyRecords }, () => {
      console.log('[addCount] setData完成');
      this.saveData();
      this.updateDailySummary();
      this.updateStatistics();

      this.showToast(`已添加 ${count} 遍 ${item.name}`);
    });
  },

  // 更新当日汇总
  updateDailySummary() {
    const today = this.getTodayString();
    const todayRecords = this.data.dailyRecords[today] || [];
    this.setData({ todayRecords });
  },

  // 更新统计信息
  updateStatistics() {
    const today = this.getTodayString();

    // 日统计
    const todayRecords = this.data.dailyRecords[today] || [];
    const dailyTotal = todayRecords.reduce((sum, record) => sum + record.count, 0);

    this.setData({
      dailyStatistics: {
        totalCount: dailyTotal,
        records: todayRecords,
        date: this.formatDate(today)
      }
    });

    // 月统计
    const monthlyStats = this.generateMonthlyStatistics();
    this.setData({ monthlyStatistics: monthlyStats });

    // 年统计
    const yearlyStats = this.generateYearlyStatistics();
    this.setData({ yearlyStatistics: yearlyStats });
  },

  // 生成月统计
  generateMonthlyStatistics() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthlyData = {};
    let totalCount = 0;

    Object.keys(this.data.dailyRecords).forEach(dateStr => {
      const date = new Date(dateStr);

      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        this.data.dailyRecords[dateStr].forEach(record => {
          if (!monthlyData[record.id]) {
            monthlyData[record.id] = {
              id: record.id,
              name: record.name,
              count: 0
            };
          }

          monthlyData[record.id].count += record.count;
          totalCount += record.count;
        });
      }
    });

    const monthlyRecords = Object.values(monthlyData);

    return {
      totalCount,
      records: monthlyRecords,
      date: `${currentYear}年${currentMonth + 1}月`
    };
  },

  // 生成年统计
  generateYearlyStatistics() {
    const today = new Date();
    const currentYear = today.getFullYear();

    const yearlyData = {};
    let totalCount = 0;

    Object.keys(this.data.dailyRecords).forEach(dateStr => {
      const date = new Date(dateStr);

      if (date.getFullYear() === currentYear) {
        this.data.dailyRecords[dateStr].forEach(record => {
          if (!yearlyData[record.id]) {
            yearlyData[record.id] = {
              id: record.id,
              name: record.name,
              count: 0
            };
          }

          yearlyData[record.id].count += record.count;
          totalCount += record.count;
        });
      }
    });

    const yearlyRecords = Object.values(yearlyData);

    return {
      totalCount,
      records: yearlyRecords,
      date: `${currentYear}年`
    };
  },

  // 切换统计选项卡
  onSwitchTab(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ currentTab: tab });
  },

  // 复制汇总
  onCopySummary() {
    const today = this.getTodayString();
    const todayRecords = this.data.dailyRecords[today] || [];

    if (todayRecords.length === 0) {
      this.showToast('今日暂无记录可复制', 'error');
      return;
    }

    let summaryText = `${this.formatDate(today)} 念佛汇总：\n`;
    let totalCount = 0;

    todayRecords.forEach(record => {
      summaryText += `${record.name}：${record.count} 遍\n`;
      totalCount += record.count;
    });

    summaryText += `\n总计：${totalCount} 遍`;

    wx.setClipboardData({
      data: summaryText,
      success: () => {
        this.showToast('已复制到剪贴板');
      },
      fail: () => {
        this.showToast('复制失败，请手动复制', 'error');
      }
    });
  },

  // 清空当日记录
  onClearDaily() {
    const today = this.getTodayString();

    if (!this.data.dailyRecords[today] || this.data.dailyRecords[today].length === 0) {
      this.showToast('今日暂无记录可清空', 'error');
      return;
    }

    wx.showModal({
      title: '确认清空',
      content: '确定要清空今日所有记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          const dailyRecords = { ...this.data.dailyRecords };
          delete dailyRecords[today];

          this.setData({ dailyRecords });
          this.saveData();
          this.updateDailySummary();
          this.updateStatistics();

          this.showToast('已清空今日记录');
        }
      }
    });
  },

  // 删除记录
  onDeleteRecord(e) {
    const { record } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteRecord(record);
        }
      }
    });
  },

  // 删除记录逻辑
  deleteRecord(record) {
    const today = this.getTodayString();
    const dailyRecords = { ...this.data.dailyRecords };

    if (dailyRecords[today]) {
      dailyRecords[today] = dailyRecords[today].filter(r =>
        !(r.id === record.id && r.timestamp === record.timestamp)
      );

      // 如果今日没有记录了，删除今日记录对象
      if (dailyRecords[today].length === 0) {
        delete dailyRecords[today];
      }

      this.setData({ dailyRecords });
      this.saveData();
      this.updateDailySummary();
      this.updateStatistics();

      this.showToast('已删除记录');
    }
  },

  // 打开新增经文模态框
  onAddItem() {
    this.setData({
      showModal: true,
      modalTitle: '新增经文',
      chantingName: '',
      quickCount1: '100',
      quickCount2: '500',
      quickCount3: '1000',
      currentEditId: null
    });
  },

  // 打开编辑经文模态框
  onEditItem(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.chantingItems.find(item => item.id === id);

    if (item) {
      this.setData({
        showModal: true,
        modalTitle: '编辑经文',
        chantingName: item.name,
        quickCount1: item.quickCounts[0]?.toString() || '100',
        quickCount2: item.quickCounts[1]?.toString() || '500',
        quickCount3: item.quickCounts[2]?.toString() || '1000',
        currentEditId: id
      });
    }
  },

  // 打开编辑记录模态框
  onEditRecord(e) {
    const { record } = e.currentTarget.dataset;

    this.setData({
      showEditModal: true,
      editChantingName: record.name,
      editCount: record.count.toString(),
      currentEditRecord: record
    });
  },

  // 关闭模态框
  onCloseModal() {
    this.setData({ showModal: false });
  },

  // 关闭编辑记录模态框
  onCloseEditModal() {
    this.setData({ showEditModal: false });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止模态框内容点击事件冒泡
  },

  // 输入处理函数
  onChantingNameInput(e) {
    this.setData({ chantingName: e.detail.value });
  },

  onQuickCount1Input(e) {
    this.setData({ quickCount1: e.detail.value });
  },

  onQuickCount2Input(e) {
    this.setData({ quickCount2: e.detail.value });
  },

  onQuickCount3Input(e) {
    this.setData({ quickCount3: e.detail.value });
  },

  onEditCountInput(e) {
    this.setData({ editCount: e.detail.value });
  },

  // 保存经文项目
  onSaveItem() {
    const name = this.data.chantingName.trim();
    const quickCount1 = parseInt(this.data.quickCount1) || 100;
    const quickCount2 = parseInt(this.data.quickCount2) || 500;
    const quickCount3 = parseInt(this.data.quickCount3) || 1000;

    if (!name) {
      this.showToast('请输入经文名称', 'error');
      return;
    }

    // 检查名称是否重复（编辑时排除自身）
    const isDuplicate = this.data.chantingItems.some(item =>
      item.name === name && item.id !== this.data.currentEditId
    );

    if (isDuplicate) {
      this.showToast('经文名称已存在', 'error');
      return;
    }

    const chantingItems = [...this.data.chantingItems];

    if (this.data.currentEditId) {
      // 编辑现有项
      const itemIndex = chantingItems.findIndex(item => item.id === this.data.currentEditId);
      if (itemIndex !== -1) {
        chantingItems[itemIndex] = {
          ...chantingItems[itemIndex],
          name: name,
          quickCounts: [quickCount1, quickCount2, quickCount3]
        };
        this.showToast('经文已更新');
      }
    } else {
      // 添加新项
      const newItem = {
        id: Date.now().toString(),
        name: name,
        quickCounts: [quickCount1, quickCount2, quickCount3]
      };
      chantingItems.push(newItem);
      this.showToast('经文已添加');
    }

    this.setData({ chantingItems });
    this.saveData();
    this.onCloseModal();
  },

  // 保存记录编辑
  onSaveRecord() {
    const count = parseInt(this.data.editCount);

    if (!count || count <= 0) {
      this.showToast('请输入有效的计数', 'error');
      return;
    }

    if (!this.data.currentEditRecord) return;

    const today = this.getTodayString();
    const dailyRecords = { ...this.data.dailyRecords };

    if (dailyRecords[today]) {
      const recordIndex = dailyRecords[today].findIndex(r =>
        r.id === this.data.currentEditRecord.id &&
        r.timestamp === this.data.currentEditRecord.timestamp
      );

      if (recordIndex !== -1) {
        dailyRecords[today][recordIndex].count = count;
        this.setData({ dailyRecords });
        this.saveData();
        this.updateDailySummary();
        this.updateStatistics();
        this.showToast('记录已更新');
        this.onCloseEditModal();
      }
    }
  },

  // 删除经文项目
  onDeleteItem(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.chantingItems.find(item => item.id === id);

    if (!item) return;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${item.name}"吗？此操作不可恢复。`,
      success: (res) => {
        if (res.confirm) {
          this.deleteChantingItem(id);
        }
      }
    });
  },

  // 删除经文项目逻辑
  deleteChantingItem(id) {
    // 删除相关的所有记录
    const dailyRecords = { ...this.data.dailyRecords };
    Object.keys(dailyRecords).forEach(date => {
      if (dailyRecords[date]) {
        dailyRecords[date] = dailyRecords[date].filter(record => record.id !== id);

        // 如果某天没有记录了，删除该天的记录对象
        if (dailyRecords[date].length === 0) {
          delete dailyRecords[date];
        }
      }
    });

    // 删除经文项
    const chantingItems = this.data.chantingItems.filter(item => item.id !== id);

    this.setData({ chantingItems, dailyRecords });
    this.saveData();
    this.updateDailySummary();
    this.updateStatistics();

    this.showToast('经文已删除');
  }
})
