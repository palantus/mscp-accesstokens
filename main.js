"use strict"

const crypto = require('crypto')

class AccessTokenManager{

  constructor(secret){
    this.secret = secret || ""
    this.cache = {}

    // Clear cache every 48 hours, as the data older than that is irrelevant
    this.cacheClearInterval = setInterval(()=>this.cache = {}, 172800000)
  }

  validateAccess(token, identifier, access){

    // First try the cache
    let hashDataToday = this.genHashData(identifier, access)
    let cachedAccess = this.cache[hashDataToday]
    if(typeof cachedAccess === "boolean"){
      console.log("Cache hit")
      return cachedAccess
    }

    let hashDataYesterday = this.genHashData(identifier, access, -1)
    cachedAccess = this.cache[hashDataYesterday]
    if(typeof cachedAccess === "boolean"){
      console.log("Cache hit")
      return cachedAccess
    }

    // If no hit on cache, calculate expected token for today
    let expectedToken = this.genToken(identifier, access)
    if(token == expectedToken){
      this.cache[hashDataToday] = true;
      return true;
    }

    //Try day before
    expectedToken = this.genToken(identifier, access, -1)
    let result = expectedToken == token

    this.cache[hashDataYesterday] = result;
    return result;
  }

  genToken(identifier, access, dateOffset){
    let hashData = this.genHashData(identifier, access, dateOffset)
    return crypto.createHmac('sha256', this.secret).update(hashData).digest('hex');
  }

  genHashData(identifier, access, dateOffset){
    dateOffset = dateOffset || 0
    let d = new Date()
    d.setDate(d.getDate() + dateOffset)
    return `${identifier}_${access}_${d.toDateString()}`
  }
}

module.exports = AccessTokenManager
