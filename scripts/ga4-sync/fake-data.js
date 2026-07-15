const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');

const PROJECT_ID = 'localbuddy-analytics';        
const BQ_DATASET = 'localbuddy_manual_data';      
const KEY_FILENAME = './service-account-key.json'; 

const bigquery = new BigQuery({ projectId: PROJECT_ID, keyFilename: KEY_FILENAME });

async function loadDataToBigQuery(tableName, rows) {
  if (rows.length === 0) return;
  const fileContent = rows.map(row => JSON.stringify(row)).join('\n');
  const tempFilePath = `./temp_fake_${tableName}.json`;
  
  fs.writeFileSync(tempFilePath, fileContent);
  await bigquery.dataset(BQ_DATASET).table(tableName).load(tempFilePath, {
    sourceFormat: 'NEWLINE_DELIMITED_JSON',
    autodetect: true,
    writeDisposition: 'WRITE_APPEND' // GHI THÊM (Cộng dồn vào dữ liệu thật)
  });
  fs.unlinkSync(tempFilePath);
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// TẠO DỮ LIỆU ĐỀU ĐẶN TỪ 25/06 ĐẾN HÔM NAY (15/07)
const startDate = new Date('2026-07-16');
const endDate = new Date('2026-07-16');
const datesToFill = [];
for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
  datesToFill.push(d.toISOString().split('T')[0]); 
}

const dailyRows = [];
const eventRows = [];
const techRows = [];
const trafficRows = [];

datesToFill.forEach(date => {
  const activeUsers = randInt(30, 45); // Đều đặn 30-45 người/ngày
  const newUsers = randInt(10, 20);
  const sessions = activeUsers + randInt(5, 10);
  
  // 1. daily_metrics
  dailyRows.push({
    report_date: date,
    active_users: activeUsers,
    new_users: newUsers,
    sessions: sessions,
    screen_page_views: sessions * randInt(3, 5),
    engagement_rate: (randInt(55, 80) / 100), 
    average_session_duration: randInt(60, 240) + 0.5,
    source: 'Fake Data (Gap Filler)'
  });
  
  // 2. event_summary (Phễu)
  const pageViews = sessions * randInt(4, 8); 
  const scrolls = Math.floor(pageViews * 0.7);
  const searches = sessions * randInt(1, 3);
  const viewProfiles = sessions * randInt(2, 5);
  const sendMsgs = Math.floor(viewProfiles * 0.5);
  
  eventRows.push({ report_date: date, event_name: 'first_visit', event_count: newUsers, revenue: 0, source: 'Fake Data' });
  eventRows.push({ report_date: date, event_name: 'session_start', event_count: sessions, revenue: 0, source: 'Fake Data' });
  eventRows.push({ report_date: date, event_name: 'page_view', event_count: pageViews, revenue: 0, source: 'Fake Data' });
  eventRows.push({ report_date: date, event_name: 'scroll', event_count: scrolls, revenue: 0, source: 'Fake Data' });
  eventRows.push({ report_date: date, event_name: 'search', event_count: searches, revenue: 0, source: 'Fake Data' });
  eventRows.push({ report_date: date, event_name: 'view_buddy_profile', event_count: viewProfiles, revenue: 0, source: 'Fake Data' });
  eventRows.push({ report_date: date, event_name: 'send_message', event_count: sendMsgs, revenue: 0, source: 'Fake Data' });
  eventRows.push({ report_date: date, event_name: 'add_to_wishlist', event_count: Math.floor(viewProfiles * 0.3), revenue: 0, source: 'Fake Data' });
  eventRows.push({ report_date: date, event_name: 'sign_up', event_count: newUsers, revenue: 0, source: 'Fake Data' });
  eventRows.push({ report_date: date, event_name: 'login', event_count: activeUsers - newUsers + 5, revenue: 0, source: 'Fake Data' });
  
  // 3. tech_and_geo (Chỉ Việt Nam + Tối đa 1 người nước ngoài mỗi ngày)
  const daNangUsers = Math.floor(activeUsers * 0.4); 
  const hueUsers = Math.floor(activeUsers * 0.3);    
  const hoiAnUsers = activeUsers - daNangUsers - hueUsers - 1; // 1 slot nước ngoài
  
  techRows.push({ report_date: date, country: 'Vietnam', city: 'Da Nang', device_category: 'mobile', browser: 'Chrome', operating_system: 'Android', active_users: daNangUsers, source: 'Fake Data' });
  techRows.push({ report_date: date, country: 'Vietnam', city: 'Hue', device_category: 'desktop', browser: 'Chrome', operating_system: 'Windows', active_users: hueUsers, source: 'Fake Data' });
  techRows.push({ report_date: date, country: 'Vietnam', city: 'Hoi An', device_category: 'mobile', browser: 'Safari', operating_system: 'iOS', active_users: hoiAnUsers, source: 'Fake Data' });
  techRows.push({ report_date: date, country: 'United States', city: 'New York', device_category: 'mobile', browser: 'Safari', operating_system: 'iOS', active_users: 1, source: 'Fake Data' });
  
  // 4. traffic_sources (Tiktok, Facebook, Direct)
  const tiktokTraffic = Math.floor(activeUsers * 0.5); 
  const fbTraffic = Math.floor(activeUsers * 0.3);     
  const directTraffic = activeUsers - tiktokTraffic - fbTraffic; 
  
  trafficRows.push({ report_date: date, source_name: 'tiktok', medium: 'social', active_users: tiktokTraffic, sessions: Math.floor(sessions * 0.2) });
  trafficRows.push({ report_date: date, source_name: 'facebook.com', medium: 'social', active_users: fbTraffic, sessions: Math.floor(sessions * 0.2) });
  trafficRows.push({ report_date: date, source_name: '(direct)', medium: '(none)', active_users: directTraffic, sessions: sessions - Math.floor(sessions * 0.2) - Math.floor(sessions * 0.2) });
});

// Chèn 4 đơn hàng vào 4 ngày ngẫu nhiên (Tạm thời tắt sự kiện purchase)
// const randomDates = [...datesToFill].sort(() => 0.5 - Math.random()).slice(0, 4);
// eventRows.push({ report_date: randomDates[0], event_name: 'purchase', event_count: 1, revenue: 0, source: 'Fake Data' });
// eventRows.push({ report_date: randomDates[1], event_name: 'purchase', event_count: 1, revenue: 19, source: 'Fake Data' });
// eventRows.push({ report_date: randomDates[2], event_name: 'purchase', event_count: 1, revenue: 19, source: 'Fake Data' });
// eventRows.push({ report_date: randomDates[3], event_name: 'purchase', event_count: 1, revenue: 38, source: 'Fake Data' });

async function main() {
  console.log('🚀 Đang bơm dữ liệu VÀO TẤT CẢ CÁC NGÀY (Từ 25/06 - 15/07)...');
  try {
    await loadDataToBigQuery('daily_metrics', dailyRows);
    await loadDataToBigQuery('event_summary', eventRows);
    await loadDataToBigQuery('tech_and_geo', techRows);
    await loadDataToBigQuery('traffic_sources', trafficRows);
    console.log('🎉 XONG! Biểu đồ của bạn giờ sẽ thẳng tắp và đi lên mượt mà!');
  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
}
main();
