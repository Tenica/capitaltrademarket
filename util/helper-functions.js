
//Generate Random letters for Affiliate Token
 exports.generateRandomToken = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';
    
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * letters.length);
      token += letters.charAt(randomIndex);
    }
    
    return token;
  }
  
  //Generate Random Numbers for Invoice
  exports.generateRandomInvoiceNumber = () => {
    let invoiceNumber = '';
    
    for (let i = 0; i < 6; i++) {
      const randomDigit = Math.floor(Math.random() * 10);
      invoiceNumber += randomDigit;
    }
    
    return invoiceNumber;
  }

 exports.getCurrentDate = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1; // Months are zero-based
    const year = today.getFullYear();
  
    // Ensure two-digit format for day and month
    const formattedDay = (day < 10) ? `0${day}` : day;
    const formattedMonth = (month < 10) ? `0${month}` : month;
  
    // Create the formatted date string
    const formattedDate = `${formattedDay}/${formattedMonth}/${year}`;
  
    return formattedDate;
  }

  exports.getISODate = () => {
    const currentDate = new Date(Date.now());
const isoString = currentDate.toISOString();

return isoString
  }


  exports.extractNumber = (getString) => {
    const stringWithNumber = getString;
    const extractedNumber = parseInt(stringWithNumber, 10);

   return extractedNumber;

  }

exports.generateEndOfInvestment = (date, value) => {
  const currentDate = new Date(date);
  currentDate.setDate(currentDate.getDate() + value);
  const isoString = currentDate.toISOString();

  return isoString
}
  
exports.convertISODate = (date) => {
  const today = new Date(date);
  const day = today.getDate();
  const month = today.getMonth() + 1; // Months are zero-based
  const year = today.getFullYear();

  // Ensure two-digit format for day and month
  const formattedDay = (day < 10) ? `0${day}` : day;
  const formattedMonth = (month < 10) ? `0${month}` : month;

  // Create the formatted date string
  const formattedDate = `${formattedDay}/${formattedMonth}/${year}`;

  return formattedDate;
}

exports.todayPercentage = (min, max) => {
  const precision = 2; // Number of decimal places
  const randomValue = Math.random() * (max - min) + min;
  return parseFloat(randomValue.toFixed(precision));
};
  
  
  
exports.approximateToTwoDecimalPlaces = (number) =>  {
  return Number(number.toFixed(2));
}



  
  
  
  