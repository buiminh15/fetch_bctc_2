const fs = require('fs');
const path = require('path');

// const archiveFile = 'archive_data.json'; // Định nghĩa đường dẫn đến file lưu trữ

// Hàm để đọc dữ liệu từ file
function readArchive(archiveFile) {
  try {
    const filePath = path.resolve(__dirname, archiveFile);
    if (!fs.existsSync(filePath)) {
      // Nếu file không tồn tại, tạo file với mảng rỗng
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]'); // Trả về mảng rỗng nếu dữ liệu rỗng
  } catch (error) {
    console.error('Error reading archive data:', error);
    return [];
  }
}

// Hàm để ghi dữ liệu vào file
function writeArchive(data, archiveFile) {
  try {
    fs.writeFileSync(path.resolve(__dirname, archiveFile), JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to archive:', error);
  }
}


function trimArchive(archiveFile, maxSize = 50, keepCount = 10) {
  const existingData = readArchive(archiveFile);

  if (existingData.length > maxSize) {
    // Lấy ra 'keepCount' phần tử cuối cùng (mới nhất)
    const trimmedData = existingData.slice(-keepCount);
    console.log(`File đã vượt quá ${maxSize} mục. Đang cắt bớt để giữ lại ${keepCount} mục mới nhất.`);
    writeArchive(trimmedData, archiveFile);
  }
}

function removeDuplicates(arr) {
  return [...new Set(arr)];
}

//  fs.writeFileSync('response.html', response.data, 'utf8');
module.exports = {
  readArchive,
  writeArchive,
  trimArchive,
  removeDuplicates
};