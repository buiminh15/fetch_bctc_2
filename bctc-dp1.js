const axios = require('axios');
const cheerio = require('cheerio');
const { sendTelegramNotification } = require('./bot');
const { COMPANIES } = require('./constants/companies');
const { insertBCTC, filterNewNames } = require('./bctc');
const he = require('he');
console.log('📢 [bctc-cdn.js:7]', 'running');

const https = require('https');
const agent = new https.Agent({
  rejectUnauthorized: false
});

const axiosRetry = require('axios-retry');

axiosRetry.default(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry nếu là network error, request idempotent, hoặc timeout
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
  }
});

const URL_ORIGIN = 'https://cpc1.com.vn';

async function fetchAndExtractData() {
  try {
    const response = await axios.get('https://cpc1.com.vn/co-dong/cat12/Bao-Cao-Tai-Chinh', {
      headers: {
        'accept': 'text/html',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      },
      timeout: 60000,
      httpsAgent: agent
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const currentYear = new Date().getFullYear().toString();
    // Lấy tối đa 5 báo cáo mới nhất
    let link = '';
    $('a').each((_, el) => {
      const nameRaw = $(el).text().trim();
      const name = he.decode(nameRaw);
      const filterCondition = [currentYear, 'báo cáo tài chính'];
      if (filterCondition.every(y => name.toLocaleLowerCase().includes(y))) {
        link = $(el).attr('href');
      }
    });

    if (!link) {
      console.log('Không tìm thấy báo cáo tài chính theo năm');
      return;
    }

    const linkStatement = `${URL_ORIGIN}${link}`;

    await fetchStatement(linkStatement);
  } catch (error) {
    console.error('Error fetching HTML:', error);
    process.exit(1);
  }
}

async function fetchStatement(link) {
  try {
    const response = await axios.get(link, {
      headers: {
        'accept': 'text/html',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      },
      timeout: 60000,
      httpsAgent: agent
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const currentYear = new Date().getFullYear().toString();
    // Lấy tối đa 5 báo cáo mới nhất
    const names = [];
    $('strong').each((_, el) => {
      const nameRaw = $(el).text().trim();
      const name = he.decode(nameRaw);
      const filterCondition = [currentYear, 'báo cáo tài chính'];
      if (filterCondition.every(y => name.toLocaleLowerCase().includes(y))) {
        names.push(name);
      }
    });

    if (names.length === 0) {
      console.log('Không tìm thấy báo cáo tài chính nào.');
      return;
    }
    console.log('📢 [bctc-mbs.js:50]', names);
    // Lọc ra các báo cáo chưa có trong DB
    const newNames = await filterNewNames(names, COMPANIES.DP1);
    console.log('📢 [bctc-cdn.js:46]', newNames);
    if (newNames.length) {
      await insertBCTC(newNames, COMPANIES.DP1);

      // Gửi thông báo Telegram cho từng báo cáo mới
      await Promise.all(
        newNames.map(name => {
          return sendTelegramNotification(`Báo cáo tài chính của DP1 ::: ${name}`);
        })
      );
      console.log(`Đã thêm ${newNames.length} báo cáo mới và gửi thông báo.`);
    } else {
      console.log('Không có báo cáo mới.');
    }
  } catch (error) {
    console.error('Error fetching HTML:', error);
    process.exit(1);
  }
}

fetchAndExtractData();