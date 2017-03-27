"use strict"

const crypto = require('crypto')

class AccessTokenManager{

  constructor(setup){
    setup = setup || {}
    this.secret = setup.secret || ""
    this.alwaysFullAccess = setup.alwaysFullAccess || false
    this.cache = {}

    // Clear cache every 48 hours, as the data older than that is irrelevant
    this.cacheClearInterval = setInterval(()=>this.cache = {}, 172800000)
  }

  validateAccess(token, identifier, access){
    if(this.alwaysFullAccess === true)
      return true;

    // First try the cache
    let hashDataToday = this.genHashData(identifier, access)
    let cachedAccess = this.cache[`${hashDataToday}_${token}`]
    if(typeof cachedAccess === "boolean"){
      return cachedAccess
    }

    let hashDataYesterday = this.genHashData(identifier, access, -1)
    cachedAccess = this.cache[`${hashDataYesterday}_${token}`]
    if(typeof cachedAccess === "boolean"){
      return cachedAccess
    }

    let hashDataPermanent = this.genHashData(identifier, access, null, true)
    cachedAccess = this.cache[`${hashDataPermanent}_${token}`]
    if(typeof cachedAccess === "boolean"){
      return cachedAccess
    }

    // If no hit on cache, calculate expected token for today
    let expectedToken = this.genToken(identifier, access)
    if(token == expectedToken){
      this.cache[`${hashDataToday}_${token}`] = true;
      return true;
    }

    //Try day before
    expectedToken = this.genToken(identifier, access, -1)
    if(token == expectedToken){
      this.cache[`${hashDataYesterday}_${token}`] = true;
      return true;
    }

    //Try permanent
    expectedToken = this.genToken(identifier, access, null, true)
    if(token == expectedToken){
      this.cache[`${hashDataPermanent}_${token}`] = true;
      return true;
    }

    return false;
  }

  genToken(identifier, access, dateOffset, permanent){
    let hashData = this.genHashData(identifier, access, dateOffset, permanent)
    let token = crypto.createHmac('sha256', this.secret).update(hashData).digest('hex');
    return token
  }

  genHashData(identifier, access, dateOffset, permanent){
    if(permanent === true){
      return `${identifier}_${access}_perm`
    } else {
      dateOffset = dateOffset || 0
      let d = new Date()
      d.setDate(d.getDate() + dateOffset)
      return `${identifier}_${access}_${d.toDateString()}`
    }
  }

  validateAccessReadWriteThrow(token, identifier, requireWrite){
    if(!this.validateAccessReadWrite(token, identifier, requireWrite))
      throw "You to not have access to this"
  }

  validateAccessReadWrite(token, identifier, requireWrite){
    if(this.alwaysFullAccess === true)
      return true;

    if(this.validateAccess(token, identifier, "write"))
      return true

    if(!requireWrite && this.validateAccess(token, identifier, "read"))
      return true

    return false
  }
}

module.exports = AccessTokenManager
