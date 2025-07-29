const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Kết nối tới Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Hàm lưu thông tin vào bảng bctc
async function insertBCTC(names, company) {
  // names là array, company là string
  if (!Array.isArray(names) || names.length === 0) return null;

  const rows = names.map(name => ({ name, company }));

  const { data, error } = await supabase
    .from('bctc')
    .insert(rows);

  if (error) {
    console.error('Insert error:', error.message);
    return null;
  }
  console.log('Inserted:', data);
  return data;
}


// Hàm đọc toàn bộ thông tin từ bảng bctc
async function readBCTC() {
  const { data, error } = await supabase
    .from('bctc')
    .select('*');
  if (error) {
    console.error('Read error:', error.message);
    return null;
  }
  console.log('All records:', data);
  return data;
}

async function filterNewNames(names, company) {
  if (!names || names.length === 0) return [];

  // Truy vấn tất cả các name trong mảng, cùng company
  const { data, error } = await supabase
    .from('bctc')
    .select('name')
    .in('name', names)
    .eq('company', company);

  if (error) {
    console.error('Check duplicate error:', error.message);
    // Nếu lỗi thì coi như chưa có name nào
    return names;
  }

  // Tạo set những name đã tồn tại trong DB
  const existedNames = new Set((data || []).map(item => item.name));
  // Lọc ra những name chưa có trong DB
  const newNames = names.filter(name => !existedNames.has(name));
  return newNames;
}

module.exports = {
  insertBCTC,
  readBCTC,
  filterNewNames
};