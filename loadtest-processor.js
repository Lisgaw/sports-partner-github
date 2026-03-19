module.exports = {
  beforeRequest: function(requestParams, context, ee, next) {
    // İstek öncesi işlemler
    return next();
  },
  
  afterResponse: function(requestParams, response, context, ee, next) {
    // Yanıt sonrası işlemler
    return next();
  }
};
