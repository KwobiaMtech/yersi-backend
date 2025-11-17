import * as XLSX from 'xlsx';
import * as path from 'path';

const excelFilePath = path.join(__dirname, '../../laundry contacts.xlsx');

try {
  const workbook = XLSX.readFile(excelFilePath);
  const sheetNames = workbook.SheetNames;
  
  console.log('Excel file sheets:', sheetNames);
  
  // Read the first sheet
  const worksheet = workbook.Sheets[sheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('\nFirst few rows:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));
  
  console.log('\nTotal rows:', data.length);
  
  if (data.length > 0) {
    console.log('\nColumn headers:');
    console.log(Object.keys(data[0]));
  }
  
} catch (error) {
  console.error('Error reading Excel file:', error.message);
}
