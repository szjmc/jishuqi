Page({
  data: {
    isTibetan: false,
    currentTab: 'total',
    dailyRecords: {},
    totalStatistics: {
      totalCount: 0,
      records: [],
      totalDays: 0,
      startDate: ''
    },
    dailyStatistics: {
      totalCount: 0,
      records: [],
      date: '',
      tibetanDate: ''
    },
    yearlyStatistics: {
      totalCount: 0,
      records: [],
      year: '',
      tibetanYear: ''
    }
  },

  onLoad() {
    this.loadLanguageSetting();
    this.loadAndCalculate();
  },

  onShow() {
    this.loadAndCalculate();
  },

  // 切换语言
  toggleLanguage() {
    const newLanguage = !this.data.isTibetan;
    this.setData({ isTibetan: newLanguage });
    wx.setStorageSync('isTibetan', newLanguage);
    this.loadAndCalculate();
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

  // 加载数据并计算统计
  loadAndCalculate() {
    this.loadData();
    this.calculateTotalStatistics();
    this.calculateDailyStatistics();
    this.calculateYearlyStatistics();
  },

  // 从本地存储加载数据
  loadData() {
    try {
      const savedRecords = wx.getStorageSync('dailyRecords');
      if (savedRecords) {
        this.setData({ dailyRecords: savedRecords });
      } else {
        this.setData({ dailyRecords: {} });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      this.setData({ dailyRecords: {} });
    }
  },

  // 计算总计统计
  calculateTotalStatistics() {
    const dailyRecords = this.data.dailyRecords || {};

    const totalData = {};
    let totalCount = 0;
    let totalDays = 0;
    let startDate = null;

    Object.keys(dailyRecords).forEach(dateStr => {
      const records = dailyRecords[dateStr];
      if (records && records.length > 0) {
        totalDays++;

        if (!startDate || dateStr < startDate) {
          startDate = dateStr;
        }

        records.forEach(record => {
          if (!totalData[record.id]) {
            totalData[record.id] = {
              id: record.id,
              name: record.name,
              count: 0
            };
          }

          totalData[record.id].count += record.count;
          totalCount += record.count;
        });
      }
    });

    const totalRecords = Object.values(totalData).sort((a, b) => b.count - a.count);

    this.setData({
      totalStatistics: {
        totalCount,
        records: totalRecords,
        totalDays,
        startDate: startDate ? this.formatDate(startDate) : '暂无数据'
      }
    });
  },

  // 计算日统计
  calculateDailyStatistics() {
    const dailyRecords = this.data.dailyRecords || {};
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const todayRecords = dailyRecords[todayStr] || [];
    const dailyTotal = todayRecords.reduce((sum, record) => sum + record.count, 0);

    this.setData({
      dailyStatistics: {
        totalCount: dailyTotal,
        records: todayRecords,
        date: this.formatDate(todayStr),
        tibetanDate: this.convertToTibetanDate(todayStr)
      }
    });
  },

  // 计算年统计
  calculateYearlyStatistics() {
    const dailyRecords = this.data.dailyRecords || {};
    const currentYear = new Date().getFullYear();

    const yearlyData = {};
    let totalCount = 0;

    Object.keys(dailyRecords).forEach(dateStr => {
      const date = new Date(dateStr);

      if (date.getFullYear() === currentYear) {
        dailyRecords[dateStr].forEach(record => {
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

    const yearlyRecords = Object.values(yearlyData).sort((a, b) => b.count - a.count);

    this.setData({
      yearlyStatistics: {
        totalCount,
        records: yearlyRecords,
        year: `${currentYear}年`,
        tibetanYear: this.convertToTibetanYear(currentYear)
      }
    });
  },

  // 切换选项卡
  switchTab(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ currentTab: tab });
  },

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 转换日期为藏文
  convertToTibetanDate(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const tibetanMonths = ['ཟླ་༡', 'ཟླ་༢', 'ཟླ་༣', 'ཟླ་༤', 'ཟླ་༥', 'ཟླ་༦', 
                            'ཟླ་༧', 'ཟླ་༨', 'ཟླ་༩', 'ཟླ་༡༠', 'ཟླ་༡༡', 'ཟླ་༡༢'];
    
    return `${tibetanMonths[month - 1]}ཚེས་${this.toTibetanNumber(day)}`;
  },

  // 转换年份为藏文
  convertToTibetanYear(year) {
    const yearStr = year.toString();
    let tibetanYear = '';
    for (let i = 0; i < yearStr.length; i++) {
      tibetanYear += this.toTibetanNumber(parseInt(yearStr[i]));
    }
    return tibetanYear + 'ལོ';
  },

  // 转换数字为藏文数字
  toTibetanNumber(num) {
    const tibetanNumbers = ['༠', '༡', '༢', '༣', '༤', '༥', '༦', '༧', '༨', '༩'];
    const numStr = num.toString();
    let result = '';
    for (let i = 0; i < numStr.length; i++) {
      result += tibetanNumbers[parseInt(numStr[i])];
    }
    return result;
  }
})
